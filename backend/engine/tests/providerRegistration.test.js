const ProviderManager = require('../core/ProviderManager');
const ClaudeProvider = require('../providers/claude/ClaudeProvider');

/**
 * Provider Registration Test
 *
 * Koi testing framework nahi — sirf plain Node script.
 * Run: node engine/tests/providerRegistration.test.js
 *
 * Isse prove hota hai:
 *  Q1 - ProviderManager ek provider register kar sakta hai
 *  Q2 - Duplicate register hone par error aata hai (optional/basic check)
 *  Q3 - list() me provider mil raha hai
 *  Q4 - get("claude") sahi object return karta hai
 */

const manager = new ProviderManager();
const claudeProvider = new ClaudeProvider();

// --- Q1: Register ---
manager.register(claudeProvider);
console.log('[Q1] Registered "claude" without error. ✅');

// --- Q2: Duplicate registration should throw ---
try {
        manager.register(claudeProvider);
        console.log('[Q2] Duplicate register did NOT throw. ❌');
} catch (err) {
        console.log('[Q2] Duplicate register correctly threw an error. ✅');
}

// --- Q3 & Q4: list() and get() ---
const providers = manager.list();
const claudeFromGet = manager.get('claude');

console.log('\nRegistered Providers\n');
providers.forEach((provider, index) => {
        console.log(`${index + 1}. ${provider.name} (${provider.id})`);
});

console.log('\n--- Verification ---');
console.log(
        `[Q3] list() contains 1 provider: ${providers.length === 1 ? '✅' : '❌'}`
);
console.log(
        `[Q4] get("claude") returns correct object: ${claudeFromGet === claudeProvider ? '✅' : '❌'
        }`
);