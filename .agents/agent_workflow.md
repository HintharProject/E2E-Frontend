# Universal Agent Workflow

This workflow applies to both frontend and backend tasks. All AI agents must strictly follow these cycles:

## 1. Initial Instruction Rules
* **NEVER** modify code upon the first instruction.
* **ANALYZE** the current state of the project relating to the given instructions first before proposing any changes.

## 2. Planning Phase
### For Issues/Bugs:
* Identify the issue.
* Report the issue, possible causes, required Human action, and recommended AI action (provide an implementation plan first).

### For Building New Features:
* Identify what is to be built, possible ways to build it, and compatibility/issues with already built features.
* Report findings and suggestions, outline required Human action, and provide recommended AI action (provide an implementation plan first).

## 3. Execution Phase
* **Wait for Confirmation:** ONLY when confirmed by the human user should you execute the implementation plan.
* **Execute:** Perform the code changes.
* **Commit:** Once the cycle is done, perform a `git add` and `git commit` with a suitable message. (Do not include documentation updates in the commit messages).

## 4. Post-Implementation Phase
* **Review:** Review the implemented items for consistency and any missed errors.
* **Test:** Run suitable tests to verify the changes.
* **Report:** Identify any remaining issues and report them to the user.
* **Cycle:** Loop back to the issue step and cycle only *once* if further fixes are needed.
