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


        /**
   * send(request)
   *
   * Purpose: "Provider ko ek request bhejo aur uska complete response wapas lo."
   *
   * Precondition: provider must already be running (i.e. start() successfully
   * called before this). send() will NEVER attempt to start the provider
   * itself — lifecycle ownership belongs entirely to the Engine, not the
   * Provider. If this precondition is not met, the implementation must
   * resolve with an error, not throw.
   *
   * Request shape:
   *
   *   {
   *     prompt: string
   *   }
   *
   * This object is additive-safe — future capabilities (system prompt,
   * conversation history, attachments, tool results) will be added as new
   * fields alongside `prompt`, never by changing its type or meaning.
   *
   * Async hai — communication with the underlying provider is inherently
   * an async operation (process I/O, network call, etc.).
   *
   * Contract: ye method KABHI exception throw nahi karega. Har provider
   * apni implementation me errors ko catch karke is shape me return karega:
   *
   *   {
   *     response: string|null,
   *     error: string|null
   *   }
   *
   * Behaviour rules:
   *  - Never throws.
   *  - Resolves only with the COMPLETE response — not partial or streamed
   *    chunks. Streaming is explicitly out of scope for this method and,
   *    if ever needed, will be exposed via a separate method (e.g.
   *    stream() / sendStream()) rather than changing this contract.
   *  - A provider instance handles ONE active send() at a time. If a
   *    second send() is called while one is already in progress, the
   *    implementation must resolve with
   *    { response: null, error: "Provider is busy." } rather than
   *    queueing or running concurrently.
   *
   * Ye base class implementation abstract placeholder hai — har subclass
   * ko ise apna override karna hi hoga.
   */
        async send(request) {
                throw new Error(
                        `${this.constructor.name} must implement the async send() method.`
                );
        }


        /**
   * stop()
   *
   * Purpose: "Release any resources the provider is holding for
   * communication."
   *
   * ADR-004: what gets released is entirely provider-specific (a spawned
   * process, an HTTP connection, nothing at all for an inherently one-shot
   * provider). A no-op implementation that simply resolves
   * { stopped: false, error: "Provider is not running." } is valid when
   * there is nothing to release.
   *
   * Async hai — releasing resources may be an async operation (waiting
   * for a process to actually exit, closing a connection, etc.).
   *
   * Contract: ye method KABHI exception throw nahi karega. Har provider
   * apni implementation me errors ko catch karke is shape me return karega:
   *
   *   {
   *     stopped: boolean,
   *     error: string|null
   *   }
   *
   * Ye base class implementation abstract placeholder hai — har subclass
   * ko ise apna override karna hi hoga.
   */
        async stop() {
                throw new Error(
                        `${this.constructor.name} must implement the async stop() method.`
                );
        }
}

module.exports = ProviderContract;