# Implementation Plan Template

Use this template for `docs/agents/plans/YYYY-MM-DD-description.md`.

```md
---
date: [ISO date/time from metadata]
git_commit: [Current commit hash from metadata]
branch: [Current branch name from metadata]
topic: '[Feature/Task Name]'
tags: [plan, relevant-component-names]
status: draft
---

# PLAN: [Title]

[Describe the goal of the plan and reference to relevant tickets if any]

## Acceptance Criteria

[List the acceptance criteria from the brainstorming]

## Technical Key Decisions and Tradeoffs

1. **[Specific decision]:** [Chosen direction].
   - Why: [Short reason]
   - Impact: [Main implementation consequence]

## Current State

[How the current system works. Use ASCII diagrams if feasible.]

## Desired End State

[High-level target state. Visualize architecture changes if feasible.]

## Abstractions and Code Reuse

[How existing abstractions are reused and which new abstractions are needed.]

Use file trees when helpful:

- `folder`
  - `file1.ext` - [concise change summary. Mention affected symbols]
    - `AffectedClass` - [few word summary]
    - `affectedFunction` - [few word summary]
  - `file2.ext` - [concise change summary]

## Logging & Observability

[Logs or observability changes. Show concrete example logs when applicable.]

## Implementation

### Phase [N]: [Descriptive Name]

Skip phase headers when there is only one phase.

Dependencies: [Mention earlier phases or tasks that must be completed first. Write `None` if independent.]

[Short summary of the phase goals]

**Tasks**:

- [ ] [Single actionable change in one file or symbol]
      [High-level code snippet if helpful]
- [ ] [Next task]

**Automated Verification**:

- [ ] [Explicit test case passes]
- [ ] [General check command passes]

[Add a `**Manual Verification**` section only when there are user-facing checks that cannot reasonably be automated. Omit the section entirely when there are no manual checks.]

## Implementation Notes

During implementation, document user feedback, problems, and decisions here.

## References

[List relevant references]
```
