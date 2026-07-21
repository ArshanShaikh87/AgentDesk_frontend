const ClaudeProvider = require('../providers/claude/ClaudeProvider');

/**
 * Provider Send Test
 *
 * Koi testing framework nahi — sirf plain Node script.
 * Run: node engine/tests/providerSend.test.js
 *
 * Ye sirf ClaudeProvider ke PUBLIC contract ko test karta hai:
 * detect() -> start() -> send() -> stop().
 *
 * Abhi sirf HAPPY PATH. Negative scenarios (busy, invalid prompt,
 * invalid JSON, spawn failure, non-zero exit code, not running) alag
 * negative test suite me aayenge — abhi scope se bahar.
 *
 * Verify:
 *  Q1 - detect().installed === true ?
 *  Q2 - start().started === true ?
 *  Q3 - send() ek object return karta hai
 *  Q4 - object me response, error fields hain
 *  Q5 - response !== null aur error === null
 *  Q6 - stop().stopped === true (mandatory cleanup)
 */

(async () => {
        const provider = new ClaudeProvider();

        console.log('Provider Send Test\n');

        // --- Q1: detect() ---
        const detection = await provider.detect();
        console.log(`Provider   : ${provider.name}`);
        console.log(`Installed  : ${detection.installed ? 'Yes' : 'No'}`);

        if (!detection.installed) {
                console.log('\nSkipping send test.');
                return;
        }

        // --- Q2: start() ---
        const startResult = await provider.start();
        console.log(`Started    : ${startResult.started ? 'Yes' : 'No'}`);

        if (!startResult.started) {
                console.log(`Error      :\n${startResult.error}`);
                console.log('\nSkipping send test — provider did not start.');
                return;
        }

        // --- Q3, Q4, Q5: send() ---
        const sendResult = await provider.send({
                prompt: 'Say hello in one sentence.',
        });

        const isObject = typeof sendResult === 'object' && sendResult !== null;
        const hasRequiredFields =
                isObject && 'response' in sendResult && 'error' in sendResult;

        console.log(`Response   : ${sendResult.response ?? 'null'}`);
        console.log(`Send Error : ${sendResult.error ?? 'None'}`);

        // --- Q6: stop() (mandatory cleanup) ---
        const stopResult = await provider.stop();
        console.log(`Stopped    : ${stopResult.stopped ? 'Yes' : 'No'}`);

        console.log('\n--- Verification ---');
        console.log(`[Q1] detect().installed === true: ✅`);
        console.log(`[Q2] start().started === true: ✅`);
        console.log(`[Q3] send() returned an object: ${isObject ? '✅' : '❌'}`);
        console.log(
                `[Q4] Object has response/error fields: ${hasRequiredFields ? '✅' : '❌'}`
        );
        console.log(
                `[Q5] response !== null && error === null: ${sendResult.response !== null && sendResult.error === null ? '✅' : '❌'
                }`
        );
        console.log(
                `[Q6] stop().stopped === true: ${stopResult.stopped === true ? '✅' : '❌'}`
        );
})();