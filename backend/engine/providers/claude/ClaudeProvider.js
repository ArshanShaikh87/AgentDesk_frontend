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
                        process: null,
                };
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
                                        this.runtime.process = null;

                                        resolve({
                                                started: false,
                                                error: err.message || `Failed to start ${this.name}.`,
                                        });
                                });

                                child.once('spawn', () => {
                                        this.runtime.process = child;

                                        resolve({
                                                started: true,
                                                error: null,
                                        });
                                });
                        } catch (err) {
                                this.runtime.process = null;

                                resolve({
                                        started: false,
                                        error: err.message || `Failed to start ${this.name}.`,
                                });
                        }
                });
        }
}

module.exports = ClaudeProvider;