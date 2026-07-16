/**
 * ProviderManager
 *
 * Ek central registry jo engine ke saare providers (Claude, Codex, Gemini, etc.)
 * ko track karta hai.
 *
 * Engine kabhi kisi provider ko directly nahi janta — sirf ProviderManager
 * se register/get/list karta hai.
 *
 * Is stage par ye class sirf providers ko IN-MEMORY store karti hai.
 * Koi detection, CLI run, version check, ya spawn logic yahan NAHI hai.
 */

class ProviderManager {
        constructor() {
                // providerId -> provider object
                this.providers = new Map();
        }

        /**
         * Ek provider ko registry me register karta hai.
         * @param {Object} provider - Provider object (minimum: { id: string })
         */
        register(provider) {
                if (!provider || !provider.id) {
                        throw new Error('Provider must have an "id" property to be registered.');
                }

                if (this.providers.has(provider.id)) {
                        throw new Error(`Provider with id "${provider.id}" is already registered.`);
                }

                this.providers.set(provider.id, provider);
        }

        /**
         * Registered provider ko uske id se fetch karta hai.
         * @param {string} providerId
         * @returns {Object|undefined}
         */
        get(providerId) {
                return this.providers.get(providerId);
        }

        /**
         * Saare registered providers ki list return karta hai.
         * @returns {Object[]}
         */
        list() {
                return Array.from(this.providers.values());
        }
}

module.exports = ProviderManager;