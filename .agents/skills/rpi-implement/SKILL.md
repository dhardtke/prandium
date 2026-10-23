---
name: rpi-implement
description: Execute approved implementation plans phase by phase with automated and manual verification. Use when the user explicitly says "implement the plan", "execute the plan", or "start implementing" and has a plan file ready. Do not use for ad-hoc coding tasks without a plan.
---

# Implement Plan

You are tasked with implementing an approved technical plan. These plans contain phases with specific changes and success criteria.

## Getting Started

If the user provided a plan path, proceed directly. If no plan path was provided, check `docs/agents/plans/` for the most recent plans. If none found, ask the user for a path.

When you have a plan:

- Read the plan completely and check for any existing checkmarks (`- [x]`)
- Read all files mentioned in the plan
- **Read files fully** - never use limit/offset parameters, you need complete context
- Think deeply about how the pieces fit together
- Start implementing if you understand what needs to be done
- Mark tasks you are working on with `[-]` and completed tasks with `[x]` (Prefer that over the task list tool)

## Task Tracking

The plan file is also a state tracker. After every task, you MUST immediately update the checkbox. Also mark tasks you are working on:

- `[ ]` - Not started yet
- `[-]` - In Progress (update BEFORE you start)
- `[x]` - Done (directly AFTER the task is tested successfully). For manual verification steps, only mark `[x]` after user confirmation.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:

- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:

- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:
  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]

  How should I proceed?
  ```

## Verification Approach

After implementing a phase:

- Run the success criteria checks listed in the plan (test commands, linters, type checkers, etc.)
- Fix any issues before proceeding
- If the phase has **manual verification steps**, pause and inform the human:
  ```
  Phase [N] Complete - Ready for Manual Verification

  Automated verification passed:
  - [List automated checks that passed]

  Please perform the manual verification steps listed in the plan:
  - [List manual verification items from the plan]

  Let me know when manual testing is complete so I can proceed to Phase [N+1].
  ```
- Proceed with the next phase (if not explicitly prompted otherwise)

Do not check off items in the manual testing steps until confirmed by the user.

After all phases are fully done, present a summary to the user for verification.

## If You Get Stuck

When something isn't working as expected:

- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

Use sub-agents sparingly - mainly for targeted debugging or exploring unfamiliar territory.

## Resuming Work

If the plan has existing checkmarks:

- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.
