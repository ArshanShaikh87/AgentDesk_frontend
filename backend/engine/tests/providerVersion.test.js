const ClaudeProvider = require('../providers/claude/ClaudeProvider');

/**
 * Provider Version Test
 *
 * Koi testing framework nahi — sirf plain Node script.
 * Run: node engine/tests/providerVersion.test.js
 *
 * Ye sirf ClaudeProvider.getVersion() ko test karta hai.
 * Contract follow karta hai: getVersion() sirf tab call hoga
 * jab detect().installed === true ho.
 *
 * Verify:
 *  Q1 - detect().installed === true ?
 *  Q2 - getVersion() ek object return karta hai
 *  Q3 - object me version, error fields hain
 *  Q4 - version null nahi hai
 */

(async () => {
        const provider = new ClaudeProvider();
        const detection = await provider.detect();

        console.log('Provider Version Test\n');
        console.log(`Provider   : ${provider.name}`);
        console.log(`Installed  : ${detection.installed ? 'Yes' : 'No'}`);

        // --- Q1: gate on detect() ---
        if (!detection.installed) {
                console.log('\nSkipping version test.');
                return;
        }

        const result = await provider.getVersion();

        // --- Q2 & Q3: shape verification ---
        const isObject = typeof result === 'object' && result !== null;
        const hasRequiredFields =
                isObject && 'version' in result && 'error' in result;

        console.log(`Version    : ${result.version ?? 'null'}`);
        console.log(`Error      : ${result.error ?? 'None'}`);

        console.log('\n--- Verification ---');
        console.log(`[Q1] detect().installed === true: ✅`);
        console.log(`[Q2] getVersion() returned an object: ${isObject ? '✅' : '❌'}`);
        console.log(
                `[Q3] Object has version/error fields: ${hasRequiredFields ? '✅' : '❌'}`
        );
        console.log(
                `[Q4] version is not null: ${result.version !== null ? '✅' : '❌'}`
        );
})();