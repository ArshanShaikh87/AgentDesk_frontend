const ClaudeProvider = require('../providers/claude/ClaudeProvider');

/**
 * Provider Start Test
 *
 * Koi testing framework nahi — sirf plain Node script.
 * Run: node engine/tests/providerStart.test.js
 *
 * Ye sirf ClaudeProvider.start() ko test karta hai.
 * Contract follow karta hai: start() sirf tab call hoga
 * jab detect().installed === true ho.
 *
 * Verify:
 *  Q1 - detect().installed === true ?
 *  Q2 - start() ek object return karta hai
 *  Q3 - object me started, error fields hain
 *  Q4 - started === true
 *
 * Note: Ye test lifecycle (stop()) implement nahi karta. Sirf
 * test cleanup ke liye, agar process successfully launch hua,
 * to test khatam hone par usse terminate kar dete hain taaki
 * orphan process background me na reh jaye.
 */

(async () => {
        const provider = new ClaudeProvider();
        const detection = await provider.detect();

        console.log('Provider Start Test\n');
        console.log(`Provider   : ${provider.name}`);
        console.log(`Installed  : ${detection.installed ? 'Yes' : 'No'}`);

        // --- Q1: gate on detect() ---
        if (!detection.installed) {
                console.log('\nSkipping start test.');
                return;
        }

        const result = await provider.start();

        // --- Q2 & Q3: shape verification ---
        const isObject = typeof result === 'object' && result !== null;
        const hasRequiredFields =
                isObject && 'started' in result && 'error' in result;

        console.log(`Started    : ${result.started ? 'Yes' : 'No'}`);
        console.log(`Error      : ${result.error ?? 'None'}`);

        console.log('\n--- Verification ---');
        console.log(`[Q1] detect().installed === true: ✅`);
        console.log(`[Q2] start() returned an object: ${isObject ? '✅' : '❌'}`);
        console.log(
                `[Q3] Object has started/error fields: ${hasRequiredFields ? '✅' : '❌'}`
        );
        console.log(`[Q4] started === true: ${result.started === true ? '✅' : '❌'}`);

        // --- Test cleanup only — NOT stop() implementation ---
        if (provider.process) {
                provider.process.kill();
        }
})();