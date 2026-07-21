const os = require('os');
const { exec, spawn } = require('child_process');

const ProviderContract = require('../../contracts/ProviderContract');

/**
 * ClaudeProvider
 *
 * Pehla real provider jo ProviderContract (rulebook) ko follow karta hai.
 *
 * Is stage par sirf metadata set hota hai super() ke through.
 * Koi detection, spawn, version, ya streaming logic yahan NAHI hai.
 *
 *  detect()
 *  getVersion()
 *  start()
 *  stop()
 *  stream()
 *  capabilities()
 */

class ClaudeProvider extends ProviderContract {
        constructor() {
                super({
                        id: 'claude',
                        name: 'Claude Code',
                        executable: 'claude',
                });

                this.runtime = {
                        installed: false,
                        executablePath: null,
                        version: null,
                        busy: false,
                };

                // Private provider state
                this._process = null;
                this._sessionId = null;
        }

        /**
   * detect()
   *
   * Checks whether the Claude CLI is available on this machine.
   * Persist-first: this.runtime updates before the return object is built.
   * Never throws — always resolves to { installed, executablePath, error }.
   */
        async detect() {
                const isWindows = os.platform() === 'win32';
                const command = isWindows ? `where ${this.executable}` : `which ${this.executable}`;

                return new Promise((resolve) => {
                        exec(command, (err, stdout) => {
                                if (err) {
                                        this.runtime.installed = false;
                                        this.runtime.executablePath = null;

                                        resolve({
                                                installed: false,
                                                executablePath: null,
                                                error: `${this.name} executable not found.`,
                                        });
                                        return;
                                }

                                const executablePath = stdout
                                        .trim()
                                        .split(/\r?\n/)[0];

                                if (!executablePath) {
                                        this.runtime.installed = false;
                                        this.runtime.executablePath = null;

                                        resolve({
                                                installed: false,
                                                executablePath: null,
                                                error: `${this.name} executable not found.`,
                                        });
                                        return;
                                }

                                this.runtime.installed = true;
                                this.runtime.executablePath = executablePath;

                                resolve({
                                        installed: true,
                                        executablePath,
                                        error: null,
                                });
                        });
                });
        }

        /**
   * getVersion()
   *
   * Precondition: detect().installed === true
   * Isliye ye method detect() ko dobara call nahi karta.
   *
   * Owns runtime.version only — never touches installed/executablePath,
   * those belong to detect().
   *
   * Never throws — always resolves to { version, error }.
   */
        async getVersion() {
                return new Promise((resolve) => {
                        exec(`${this.executable} --version`, (err, stdout) => {
                                if (err) {
                                        this.runtime.version = null;

                                        resolve({
                                                version: null,
                                                error: err.message || 'Unable to determine version',
                                        });
                                        return;
                                }

                                const version = stdout.trim();

                                this.runtime.version = version;

                                resolve({
                                        version,
                                        error: null,
                                });
                        });
                });
        }

        /**
         * _resolveLaunchStrategy()
         *
         * PRIVATE. Decides HOW to actually spawn this provider's process on the
         * current platform. This is intentionally separate from
         * runtime.executablePath (which is detect()'s discovery evidence, not
         * a launch instruction) — the two answer different questions.
         *
         * Windows: npm global CLIs are shims (.cmd / .ps1). spawn() cannot
         * execute those directly without going through a shell, so we let
         * cmd.exe resolve "claude" via { shell: true }.
         *
         * Linux/macOS: the discovered path is a real executable, so it can be
         * spawned directly, no shell needed.
         *
         * Never exposed outside this class — the Engine and the Contract never
         * see this decision, only the { started, error } result.
         */
        _resolveLaunchStrategy() {
                const isWindows = os.platform() === 'win32';

                if (isWindows) {
                        return {
                                command: this.executable,
                                args: [],
                                options: { stdio: 'ignore', shell: true },
                        };
                }

                return {
                        command: this.runtime.executablePath || this.executable,
                        args: [],
                        options: { stdio: 'ignore' },
                };
        }

        /**
   * start()
   *
   * Sirf Claude CLI process launch karta hai. Prompt send, output read,
   * session maintain — kuch nahi. Process object bhi return nahi hota.
   *
   * Launch mechanism is a private, platform-aware decision made in
   * _resolveLaunchStrategy() — this method itself stays platform-agnostic.
   *
   * Never throws — always resolves to { started, error }.
   */
        async start() {
                return new Promise((resolve) => {
                        try {
                                const { command, args, options } = this._resolveLaunchStrategy();
                                const child = spawn(command, args, options);

                                child.once('error', (err) => {
                                        //this.runtime.process = null;
                                        this._process = null;

                                        resolve({
                                                started: false,
                                                error: err.message || `Failed to start ${this.name}.`,
                                        });
                                });

                                child.once('spawn', () => {
                                        //this.runtime.process = child;
                                        this._process = child;
                                        resolve({
                                                started: true,
                                                error: null,
                                        });
                                });
                        } catch (err) {
                                //this.runtime.process = null;
                                this._process = null;

                                resolve({
                                        started: false,
                                        error: err.message || `Failed to start ${this.name}.`,
                                });
                        }
                });
        }
        /**
          * stop()
          *
          * Precondition check: if runtime.process is null, there's nothing to
          * stop — this is a valid state, not an error.
          *
          * Deterministic lifecycle: kill() is only a termination REQUEST, not a
          * guarantee. We wait for the 'exit' event before cleaning up and
          * resolving, so callers never race against a process that's still
          * technically alive.
          *
          * Never throws — always resolves to { stopped, error }.
          */
        async stop() {
                return new Promise((resolve) => {
                        //const child = this.runtime.process;
                        const child = this._process;

                        if (!child) {
                                resolve({
                                        stopped: false,
                                        error: 'Provider is not running.',
                                });
                                return;
                        }

                        // Cleanup + resolve happens exactly once, however the process ends.
                        const finalize = () => {
                                child.removeAllListeners();
                                //this.runtime.process = null;
                                this._process = null;

                                resolve({
                                        stopped: true,
                                        error: null,
                                });
                        };

                        child.once('exit', finalize);

                        // If the process is already dead (or dies before it can be killed),
                        // kill() throws synchronously in some environments rather than
                        // emitting 'error' — guard so we still resolve deterministically.
                        try {
                                child.kill();
                        } catch (err) {
                                child.removeAllListeners();
                                //this.runtime.process = null;
                                this._process = null;

                                resolve({
                                        stopped: false,
                                        error: err.message || 'Failed to stop provider.',
                                });
                        }
                });
        }

        /**
   * _executeClaudeCommand(args)
   *
   * PRIVATE. Runs a one-shot `claude` invocation with the given args and
   * collects its stdout/stderr/exit code. This is distinct from
   * _resolveLaunchStrategy() (used by start()) — this helper is for
   * send()'s request/response CLI calls (`claude -p ...`), not for
   * launching a long-running process.
   *
   * Never throws — always resolves to
   * { stdout, stderr, exitCode, spawnError }.
   */
        _executeClaudeCommand(args) {
                return new Promise((resolve) => {

                        const isWindows = os.platform() === 'win32';

                        const command = isWindows
                                ? this.executable
                                : this.runtime.executablePath || this.executable;

                        const options = isWindows
                                ? { shell: true }
                                : {};

                        let child;

                        try {
                                child = spawn(command, args, options);
                        } catch (err) {
                                resolve({
                                        stdout: '',
                                        stderr: '',
                                        exitCode: null,
                                        spawnError: err
                                });
                                return;
                        }

                        let stdout = '';
                        let stderr = '';

                        let finished = false;

                        function finish(result) {
                                if (finished) {
                                        return;
                                }

                                finished = true;
                                resolve(result);
                        }

                        child.stdout.on('data', (chunk) => {
                                stdout += chunk.toString();
                        });

                        child.stderr.on('data', (chunk) => {
                                stderr += chunk.toString();
                        });

                        child.once('error', (err) => {
                                finish({
                                        stdout,
                                        stderr,
                                        exitCode: null,
                                        spawnError: err
                                });
                        });

                        child.once('close', (exitCode) => {
                                finish({
                                        stdout,
                                        stderr,
                                        exitCode,
                                        spawnError: null
                                });
                        });

                });
        }
        // TODO:
        // Replace _process readiness check once start()/stop()
        // are refactored to the provider-agnostic lifecycle model.

        /**
         * send(request)
         *
         * Precondition: provider must already be "running" — for this one-shot
         * CLI provider, that's represented by this._process (start() having
         * succeeded), NOT a persistent communication channel to that process.
         *
         * Each call spawns its own one-shot `claude -p` invocation; conversation
         * continuity across calls is carried by the private _sessionId field via
         * `--resume`, per the frozen invocation contract.
         *
         * busy is always cleared in a finally block — even if something inside
         * throws unexpectedly — so the provider never gets stuck permanently busy.
         *
         * Never throws — always resolves to { response, error }.
         */
        async send(request) {
                if (!this._process) {
                        return { response: null, error: 'Provider is not running.' };
                }

                if (this.runtime.busy) {
                        return { response: null, error: 'Provider is busy.' };
                }

                //const prompt = request && request.prompt;
                const prompt = request?.prompt;
                if (typeof prompt !== 'string' || prompt.trim().length === 0) {
                        return { response: null, error: 'Invalid prompt.' };
                }

                this.runtime.busy = true;

                try {
                        //const args = ['-p', prompt];
                        const args = [
                                '-p',
                                prompt,
                                ...(this._sessionId ? ['--resume', this._sessionId] : []),
                                '--output-format',
                                'json'
                        ];

                        // if (this._sessionId) {
                        //         args.push('--resume', this._sessionId);
                        // }

                        //args.push('--output-format', 'json');

                        const { stdout, stderr, exitCode, spawnError } = await this._executeClaudeCommand(args);

                        if (spawnError) {
                                return {
                                        response: null,
                                        error: spawnError.message || `Failed to run ${this.name}.`,
                                };
                        }

                        if (exitCode !== 0) {
                                return {
                                        response: null,
                                        error: stderr.trim() || `${this.name} exited with code ${exitCode}.`,
                                };
                        }

                        let parsed;
                        try {
                                parsed = JSON.parse(stdout);
                        } catch (parseErr) {
                                return {
                                        response: null,
                                        //error: 'Failed to parse Claude response.',
                                        error: `Failed to parse Claude response: ${parseErr.message}`
                                };
                        }

                        if (parsed.session_id) {
                                this._sessionId = parsed.session_id;
                        }

                        if (!parsed || typeof parsed !== "object") {
                                return {
                                        response: null,
                                        error: "Claude returned an invalid JSON response."
                                };
                        }

                        if (typeof parsed.result !== "string") {
                                return {
                                        response: null,
                                        error: "Claude returned an invalid response."
                                };
                        }

                        return {
                                response: parsed.result ?? null,
                                error: null,
                        };
                } catch (err) {
                        return {
                                response: null,
                                error: err.message || `Failed to communicate with ${this.name}.`,
                        };
                } finally {
                        this.runtime.busy = false;
                }
        }



}

module.exports = ClaudeProvider;