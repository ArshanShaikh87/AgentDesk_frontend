const os = require("os");
const { exec } = require("child_process");
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
        }

        /**
   * detect()
   *
   * Checks whether the Claude CLI is available on this machine.
   * Never throws — always resolves to { installed, executablePath, error }.
   */
        async detect() {
                const isWindows = os.platform() === 'win32';
                const command = isWindows ? `where ${this.executable}` : `which ${this.executable}`;

                return new Promise((resolve) => {
                        exec(command, (err, stdout) => {
                                if (err) {
                                        resolve({
                                                installed: false,
                                                executablePath: null,
                                                error: `${this.name} executable not found.`,
                                                //error: err.message || `${this.name} executable not found`,
                                        });
                                        return;
                                }

                                const executablePath = stdout
                                        .split(/\r?\n/)[0]
                                        .trim();

                                if (!executablePath) {
                                        resolve({
                                                installed: false,
                                                executablePath: null,
                                                error: `${this.name} executable not found.`,
                                                //error: err.message || `${this.name} executable not found`
                                        });
                                        return;
                                }

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
   * Never throws — always resolves to { version, error }.
   */
        async getVersion() {
                return new Promise((resolve) => {
                        exec(`${this.executable} --version`, (err, stdout) => {
                                if (err) {
                                        resolve({
                                                version: null,
                                                error: err.message || 'Unable to determine version',
                                        });
                                        return;
                                }

                                const version = stdout.trim();

                                resolve({
                                        version,
                                        error: null,
                                });
                        });
                });
        }
}

module.exports = ClaudeProvider;