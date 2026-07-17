
"Jab bhi hum engine me koi naya feature add karenge, pehle Provider Contract check karenge. Agar feature contract ko todta hai, to implementation reject hoga."
1. Purpose : 

Provider Contract defines the standard communication interface between the Agent Engine and any AI CLI Provider. Every provider must follow this contract so the engine remains provider-agnostic and does not require modifications when new AI CLIs are added.

2. Design Principles

Principle 1
Engine never knows provider implementation.

Principle 2
Every Provider follows the same contract.

Principle 3
Adding a new provider must not require engine changes.

Principle 4
Providers are replaceable.

Principle 5
Provider owns CLI communication.
Engine never directly talks to CLI.

Principle 6
Provider emits events.
Engine reacts to events.

3. Provider Responsibilities

Detect CLI
Get Version
Validate Installation
Start Process
Stop Process
Send Messages
Receive Stream
Emit Events
Report Errors

5. Provider Metadata

Name
Display Name
Executable
Supported OS
Version
Capabilities

6. Provider Capabilities

Interactive Session
Streaming
Resume
Terminal Access
Git Support
Vision
Worktree Support
Multi Agent

7. Provider Lifecycle

Load

↓

Detect

↓

Validate

↓

Ready

↓

Start Session

↓

Streaming

↓

Stop

↓

Cleanup

8. Events

ProviderDetected

ProviderReady

SessionStarted

LogReceived

QuestionReceived

ErrorOccurred

SessionCompleted

SessionStopped

9. Error Handling

Provider Missing

Invalid Version

Process Crash

Permission Error

CLI Timeout

Unknown Error

10. Future Compatibility Rules

Any future AI CLI must integrate by implementing this contract.
Not by modifying the Engine.

12. Milestones Mapping

Milestone 1

↓

Detection

Milestone 2

↓

Version

Milestone 3

↓

Launch

Milestone 4

↓

Streaming

13. Non Goals

Dashboard UI
Authentication
Billing
Database Schema
Queue Implementation
WebSocket Protocol
Business Logic

14. Runtime Information

- installed
- executablePath
- version
- status
- error

## Runtime State Rules

- All mutable provider state must be stored inside `this.runtime`.
- Static provider metadata belongs in the constructor.
- Runtime fields must have a single owning method.
- Methods that compute runtime information should persist it before returning.