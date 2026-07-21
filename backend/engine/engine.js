class Engine {
        constructor(providerManager) {
                this.providerManager = providerManager;
        }

        async send(providerName, request) {
                const provider = this.providerManager.get(providerName);
                if (!provider) {
                        return {
                                response: null,
                                error: "Provider not found."
                        };
                }
                return provider.send(request);
        }
}