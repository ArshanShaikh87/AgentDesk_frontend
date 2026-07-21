const Engine = require('../engine');

/**
 * Engine Send Test
 *
 * Koi testing framework nahi — sirf plain Node script.
 * Run: node engine/tests/engineSend.test.js
 *
 * Ye Engine ki orchestration verify karta hai — Claude, Gemini, Codex
 * ya kisi bhi real provider par NO dependency. Sab kuch fake
 * provider/providerManager se deterministic hai, isliye ye test kabhi
 * subscription, authentication, ya CLI availability par depend nahi karta.
 *
 * Verify:
 *  Test 1 - Provider exists: Engine locate + delegate + return as-is
 *  Test 2 - Provider not found: { response: null, error: "Provider not found." }
 *  Test 3 - Provider returns its own error: Engine forwards it unmodified
 *  Test 4 - Unexpected exception (ProviderManager.get() throws): Engine never throws
 */

// --- Fakes ---

class FakeProvider {
        async send(request) {
                return {
                        response: `Fake Response: ${request.prompt}`,
                        error: null,
                };
        }
}

class FakeBusyProvider {
        async send(request) {
                return {
                        response: null,
                        error: 'Provider is busy.',
                };
        }
}

function makeFoundProviderManager(provider) {
        return {
                get(providerName) {
                        return provider;
                },
        };
}

function makeEmptyProviderManager() {
        return {
                get(providerName) {
                        return undefined;
                },
        };
}

function makeThrowingProviderManager() {
        return {
                get(providerName) {
                        throw new Error('Boom');
                },
        };
}

// --- Test runner (plain assertions, no framework) ---

let passed = 0;
let failed = 0;

function check(label, condition) {
        if (condition) {
                console.log(`[${label}] ✅`);
                passed += 1;
        } else {
                console.log(`[${label}] ❌`);
                failed += 1;
        }
}

(async () => {
        console.log('Engine Send Test\n');

        // --- Test 1: Provider exists ---
        const engine1 = new Engine(makeFoundProviderManager(new FakeProvider()));
        const r1 = await engine1.send('claude', { prompt: 'Hello' });

        console.log('Test 1 — Provider Exists');
        //console.log(JSON.stringify(r1));
        console.log(JSON.stringify(r1, null, 2));
        check('T1-a] response matches provider output', r1.response === 'Fake Response: Hello');
        check('T1-b] error === null', r1.error === null);

        // --- Test 2: Provider not found ---
        const engine2 = new Engine(makeEmptyProviderManager());
        const r2 = await engine2.send('gemini', { prompt: 'Hello' });

        console.log('\nTest 2 — Provider Not Found');
        console.log(JSON.stringify(r2));
        check('T2-a] response === null', r2.response === null);
        check('T2-b] error === "Provider not found."', r2.error === 'Provider not found.');

        // --- Test 3: Provider returns its own error (forwarded unmodified) ---
        const engine3 = new Engine(makeFoundProviderManager(new FakeBusyProvider()));
        const r3 = await engine3.send('claude', { prompt: 'Hello' });

        console.log('\nTest 3 — Provider Error Forwarded');
        console.log(JSON.stringify(r3));
        check('T3-a] response === null', r3.response === null);
        check('T3-b] error === "Provider is busy."', r3.error === 'Provider is busy.');

        // --- Test 4: Unexpected exception (Engine never throws) ---
        const engine4 = new Engine(makeThrowingProviderManager());
        const r4 = await engine4.send('claude', { prompt: 'Hello' });

        console.log('\nTest 4 — Unexpected Exception');
        console.log(JSON.stringify(r4));
        check('T4-a] response === null', r4.response === null);
        check('T4-b] error === "Boom"', r4.error === 'Boom');

        console.log(`\n--- Summary: ${passed} passed, ${failed} failed ---`);
})();