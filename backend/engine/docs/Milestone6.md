# Milestone 6 – Engine Layer

**Status:** ✅ Completed

---

# Objective

Implement the Engine as the single entry point between the application and AI providers.

The Engine is responsible for orchestration only. It does not communicate with providers directly, nor does it implement provider-specific logic.

This milestone establishes the foundation that allows the application to interact with any AI provider through a unified interface while keeping the Engine completely provider-independent.

---

# Scope

The following functionality was implemented during this milestone:

- Engine class
- Dependency Injection
- Provider delegation
- Provider lookup
- Structured error handling
- Provider-independent orchestration
- Engine regression testing

---

# Architecture

The Engine sits between the application and ProviderManager.

```
Application
      │
      ▼
    Engine
      │
      ▼
ProviderManager
      │
      ▼
ProviderContract
      │
      ▼
 Provider
```

The application never communicates with a provider directly.

---

# Responsibilities

The Engine is responsible for:

- Receiving requests from the application
- Locating the requested provider
- Delegating requests to that provider
- Returning the provider's response without modification
- Returning structured errors
- Never throwing exceptions

---

# Non-Responsibilities

The Engine intentionally does **not** perform the following tasks:

- Prompt validation
- Prompt modification
- Provider lifecycle management
- Session management
- Retry logic
- Streaming
- Provider selection strategies
- Logging
- Metrics collection
- Conversation management

These responsibilities belong to providers or future milestones.

---

# Constructor

The Engine receives its ProviderManager through dependency injection.

```javascript
const engine = new Engine(providerManager);
```

The Engine never creates its own ProviderManager instance.

This keeps the Engine loosely coupled and easily testable.

---

# Public API

```javascript
async send(providerName, request)
```

Parameters:

```javascript
providerName
```

```javascript
request
```

Example:

```javascript
await engine.send("claude", {
    prompt: "Explain polymorphism."
});
```

---

# Internal Flow

```
Engine.send()

↓

ProviderManager.get(providerName)

↓

Provider.send(request)

↓

Return provider response
```

The Engine performs orchestration only.

---

# Response Contract

The Engine returns exactly the same contract defined by Provider.send().

```javascript
{
    response,
    error
}
```

Successful response:

```javascript
{
    response: "...",
    error: null
}
```

Failure:

```javascript
{
    response: null,
    error: "Provider not found."
}
```

The Engine never modifies successful provider responses.

---

# Error Handling

The Engine returns structured errors for:

- Provider not found
- Unexpected internal exceptions

Unexpected exceptions are converted into:

```javascript
{
    response: null,
    error: error.message
}
```

No exceptions are propagated to the application.

---

# Dependency Injection

The Engine depends only on the ProviderManager interface.

It has no knowledge of:

- Claude
- Gemini
- Codex
- OpenAI
- Local providers

Any provider implementing the Provider Contract can be used without modifying the Engine.

---

# Regression Testing

Regression tests were implemented using fake providers.

No real AI providers were required.

No subscriptions were required.

No internet connection was required.

No CLI execution was required.

The following scenarios were verified:

- ✅ Provider exists
- ✅ Provider not found
- ✅ Provider returns its own error
- ✅ Unexpected exception handling

Regression Result:

```
8 Passed
0 Failed
```

---

# Design Principles

The Engine follows the following architectural principles:

- Single Responsibility Principle
- Dependency Injection
- Provider Independence
- Contract-based Communication
- Never Throw Exceptions
- Orchestration over Implementation

---

# Final Architecture

```
                Application
                     │
                     ▼
                 Engine
                     │
                     ▼
             ProviderManager
                     │
                     ▼
             ProviderContract
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 ClaudeProvider  GeminiProvider  CodexProvider
```

The Engine remains completely independent of any specific provider implementation.

---

# Final Status

| Component | Status |
|-----------|--------|
| Architecture | ✅ Complete |
| Constructor | ✅ Complete |
| Public API | ✅ Complete |
| Request Delegation | ✅ Complete |
| Error Handling | ✅ Complete |
| Dependency Injection | ✅ Complete |
| Regression Testing | ✅ Complete |

---

# Conclusion

Milestone 6 successfully establishes the Engine as the central orchestration layer of AgentDesk.

The Engine now provides a unified entry point for all provider communication while remaining completely provider-independent. By delegating requests through the ProviderManager and forwarding provider responses without modification, the architecture maintains loose coupling and clear separation of responsibilities.

With this milestone complete, AgentDesk now has a stable core architecture consisting of:

- Provider Registration
- Provider Lifecycle
- Provider Communication
- Engine Orchestration

This foundation enables future milestones such as provider selection strategies, request pipelines, retries, streaming, conversation management, and advanced orchestration without requiring changes to the Engine's core design.