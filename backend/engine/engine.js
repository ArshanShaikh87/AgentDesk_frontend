/**
 * Engine
 *
 * Single entry point between the application and providers. The
 * application never talks to a Provider directly — it always goes
 * through Engine.
 *
 * Engine's job is orchestration, not communication:
 *  - get the right provider from ProviderManager
 *  - delegate the request to that provider
 *  - return the result exactly as the provider gave it
 *
 * Engine does NOT:
 *  ❌ validate or modify the prompt (that's the provider's job)
 *  ❌ call provider.start() (lifecycle ownership stays with the caller,
 *     same as Provider.send()'s own precondition)
 *  ❌ retry, select providers, manage sessions, log, or collect metrics
 *     (all future milestones)
 */

class Engine {
        constructor(providerManager) {
                this._providerManager = providerManager;
        }

        /**
         * send(providerName, request)
         *
         * Never throws — always resolves to { response, error }, exactly
         * mirroring the shape Provider.send() itself returns. Engine forwards
         * the provider's result unmodified; it only adds its own
         * "Provider not found" / unexpected-exception cases on top.
         */
        async send(providerName, request) {
                try {
                        const provider = this._providerManager.get(providerName);

                        if (!provider) {
                                return {
                                        response: null,
                                        error: 'Provider not found.',
                                };
                        }

                        return await provider.send(request);
                } catch (err) {
                        return {
                                response: null,
                                error: err instanceof Error ? err.message : String(err)
                        };
                }
        }
}

module.exports = Engine;