/**
 * ProviderContract
 *
 * Ye Claude nahi hai. Ye Codex nahi hai. Ye Gemini bhi nahi hai.
 * Ye sirf ek RULEBOOK hai.
 *
 * JavaScript me true "interface" nahi hota, isliye ye Base Class
 * har provider ke liye ek standard shape define karti hai — taaki
 * har provider (Claude, Codex, Gemini, ...) ek jaisa minimum
 * metadata implement kare, chahe internally wo kuch bhi kare.
 *
 * Is stage par sirf metadata hai. Koi behavior/logic nahi.
 *
 *  detect()
 *  version()
 *  start()
 *  stop()
 *  spawn()
 *
 * Ye sab baad me aayenge.
 */

class ProviderContract {
        /**
         * @param {Object} config
         * @param {string} config.id - Unique identifier (e.g. "claude", "codex", "gemini")
         * @param {string} config.name - Human-readable name (e.g. "Claude Code")
         * @param {string} config.executable - CLI executable name/path (e.g. "claude", "codex")
         */
        constructor({ id, name, executable } = {}) {
                if (new.target === ProviderContract) {
                        throw new Error('ProviderContract is abstract and cannot be instantiated directly.');
                }

                if (!id) {
                        throw new Error('ProviderContract requires an "id".');
                }
                if (!name) {
                        throw new Error('ProviderContract requires a "name".');
                }
                if (!executable) {
                        throw new Error('ProviderContract requires an "executable".');
                }

                this.id = id;
                this.name = name;
                this.executable = executable;
        }

        /**
 * detect()
 *
 * Purpose: "Kya main is machine par available hoon?"
 * Ye process start NAHI karta — sirf availability check karta hai.
 *
 * Async hai kyunki future implementations me file check, registry check,
 * network check, ya version check jaisi async operations ho sakti hain.
 * Signature abhi hi async rakhne se baad me breaking change nahi hoga.
 *
 * Contract: ye method KABHI exception throw nahi karega. Har provider
 * apni implementation me errors ko catch karke is shape me return karega:
 *
 *   {
 *     installed: boolean,
 *     executablePath: string|null,
 *     error: string|null
 *   }
 *
 * Ye base class implementation abstract placeholder hai — har subclass
 * ko ise apna override karna hi hoga.
 */
        async detect() {
                throw new Error(
                        `${this.constructor.name} must implement the async detect() method.`
                );
        }

        /**
  * getVersion()
  *
  * Purpose: "Agar main installed hoon, to meri version kya hai?"
  *
  * Ye method sirf tab call kiya jaana chahiye jab detect() se
  * installed: true mile — uninstalled provider ki version nikalna
  * unnecessary process execution hai.
  *
  * Async hai — jaisa detect() me tha, kyunki underlying implementation
  * ek CLI command (e.g. `claude --version`) chalayegi.
  *
  * Contract: ye method KABHI exception throw nahi karega. Har provider
  * apni implementation me errors ko catch karke is shape me return karega:
  *
  *   {
  *     version: string|null,
  *     error: string|null
  *   }
  *
  * Ye base class implementation abstract placeholder hai — har subclass
  * ko ise apna override karna hi hoga.
  */
        async getVersion() {
                throw new Error(
                        `${this.constructor.name} must implement the async getVersion() method.`
                );

        }


        /**
   * start()
   *
   * Purpose: "Provider ka CLI process shuru karo."
   *
   * Responsibility: sirf process launch karna. Prompt kaise bhejna hai,
   * output kaise read karna hai, session kaise maintain hoga, ya
   * streaming kaise hogi — ye sab future contracts/tasks hain, is
   * method ka scope nahi.
   *
   * Async hai — process spawn karna inherently ek async operation hai.
   *
   * Contract: ye method KABHI exception throw nahi karega. Har provider
   * apni implementation me errors ko catch karke is shape me return karega:
   *
   *   {
   *     started: boolean,
   *     error: string|null
   *   }
   *
   * Ye base class implementation abstract placeholder hai — har subclass
   * ko ise apna override karna hi hoga.
   */
        async start() {
                throw new Error(
                        `${this.constructor.name} must implement the async start() method.`
                );
        }
}

module.exports = ProviderContract;