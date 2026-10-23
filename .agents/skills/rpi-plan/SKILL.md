---
name: rpi-plan
description: Create detailed, phased implementation plans through interactive research and iteration. Use when the user explicitly asks to "create a plan", "plan the implementation", or "design an approach" for a feature, refactor, or bug fix. Do not use for quick questions or simple tasks.
---

# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

## Initial Setup

If the user already provided a task description, file path, or topic alongside this command, proceed directly to step 1 below. Only if no context was given, respond with:

```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. A description of what you want to build or change
2. Any relevant context, constraints, or specific requirements
3. Pointers to related files or previous research

I'll analyze this information and work with you to create a comprehensive plan.
```

Then wait for the user's input.

## Process Steps

### Step 1: Context Gathering & Brainstorming

1. **Read all mentioned files immediately and FULLY**:
   - Any files the user referenced (docs, research, code)
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: DO NOT spawn sub-tasks before reading these files yourself in the main context
   - **NEVER** read files partially - if a file is mentioned, read it completely

2. **Determine if research already exists**:
   - If the user provided a research document (e.g. from `docs/agents/research/`), **trust it as the source of truth**. Do NOT re-research topics that the document already covers. Use its findings, file references, and architecture analysis directly as the basis for planning.
   - **NEVER repeat or re-do research that has already been provided.** The plan phase is about turning existing research into actionable implementation steps, not about gathering information that's already available.
   - If NO research document was provided, spawn a subagent to find relevant research documents:
     - The subagent first should quickly scan the research folder by filename & yaml frontmatter to find relevant documents
     - Then check if the research is relevant for our plan
     - IF a document is relevant, verify that the research document is up-to-date by checking all changes since its creation
     - IF the document is outdated, the subagent should make sure to fully understand the latest information and update the document

3. **Spawn sub-agents for missing information**:
   - Do NOT spawn sub-agents to re-discover what the research document already covers
   - Spawn focused subagents to find additional, relevant files for the task (for example, an explorer subagent when available)
   - The job of the subagent is to explore and return paths to relevant files and line numbers, NOT to provide long answers
   - Each sub-agent should have a narrow, specific question to answer, not broad exploration
   - You MUST fully understand third party interfaces you are going to use:
     - IF you have access to the source code (e.g. node_modules), start a subagent to explore the relevant parts
     - OTHERWISE start a websearch, either as a subagent or directly if your websearch tool already behaves like a subagent
   - You MUST find and identify all related documentation for that feature and plan how to update it
   - You MUST wait for the subagents to finish before continuing with the next step or doing additional research in the main agent

4. **Read the most relevant files directly into your main context**:
   - Based on the research, user input and/or subagent results, identify the most relevant source files for the given tasks
   - **Read these files yourself using the Read tool**. Do NOT delegate this to sub-agents. You need these files in your own context to write an accurate plan.
   - Focus on files that will be modified or that define interfaces/patterns you need to follow

5. **Analyze and verify understanding**:
   - Cross-reference the requirements with actual code (and research document if provided)
   - Identify any discrepancies or misunderstandings
   - Note assumptions that need verification
   - Determine true scope based on codebase reality

6. **Present informed understanding and work back and forth with the user**:
   - Before asking questions, summarize the current state of the relevant codebase area.
   - Use ASCII diagrams, trees, or flow charts to explain the current architecture or flow.
   - Include the key files, components, data flows, constraints, and relevant file:line references.
   - Do not present a proposed solution or make unstated assumptions yet.
   - Then ask one question at a time, with your recommended answer.
   - After each user answer, briefly restate the updated understanding before asking the next question.
   - Separate each Q&A turn with `---`.

   Interview the user relentlessly about every aspect of the plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. Propose different alternatives and let the user decide which one is best.

   **Be Visual**: Work with ASCII mockups and trees for UI/UX design or architecture decisions. This helps the user to get an intuitive understanding of the question.

   **Remember**: The user is the expert and responsible for the decisions being made.

   Verify all facts or statements made during the discussion, either by looking at the codebase, dependencies, or doing a websearch.

   If a question can be answered by exploring the codebase, explore the codebase instead.

### Step 2: Plan Structure Development

After all key decisions are clear, extract the acceptance criteria from the brainstorming process, then summarize the decisions and planned phases clearly so the user can improve the split.
Each phase must be a **vertical**, testable slice.
If that does not fit, use fewer larger phases:

```text
Acceptance criteria:
- [Specific behavior or outcome the implementation must satisfy]
- [Another required outcome]

Key decisions:
1. **<Specific decision>:** <chosen direction>.
   - Why: <short reason>
   - Impact: <main implementation consequence>

Planned phases:
1. ...
2. ...
3. ...

Reply "create plan" and I will write the plan.
```

**Phase by vertical feature slices**. Do NOT extract tests or documentation updates into their own phases. Include tests and documentation in the phase that delivers the related behavior.

### Step 3: Detailed Plan Writing

After **explicit** approval of the user:

1. **Gather metadata**:
   - Run `python3 <skill_directory>/scripts/metadata.py` to get date, commit, branch, and repository info
   - Determine the output filename: `docs/agents/plans/YYYY-MM-DD-description.md`
     - YYYY-MM-DD is today's date
     - description is a brief kebab-case description
     - Example: `2025-01-08-improve-error-handling.md`
     - The output folder (`docs/agents/plans/`) can be overridden by instructions in the project's `AGENTS.md` or `CLAUDE.md`

2. **Write the plan** to `docs/agents/plans/YYYY-MM-DD-description.md`
   - Use the template structure defined in `<skill_dir>/references/plan-template.md`
   - Ensure the `docs/agents/plans/` directory exists (create if needed)
   - **Every actionable item must have a checkbox** (`- [ ]`) so progress can be tracked during implementation. This includes each task and each verification step.
   - Verification guidance:
     - Put every verification that can be automated under Automated Verification.
     - Use Manual Verification only for user-facing behavior that cannot reasonably be automated yet.
     - Omit Manual Verification sections entirely when there are no manual checks. Do not add placeholder checkboxes such as `None`.
     - Do not list manual `git diff` inspection or temporary break-and-revert checks when they can be covered by tests or scripts.

### Step 4: Review & Iterate

1. **If subagents are available, start one to review the plan first. Otherwise, review it yourself. Focus on consistency and other common mistakes.**

2. **Fix relevant findings directly**

3. **Present the draft plan location**:

   ```
   I've created the initial implementation plan at:
   `docs/agents/plans/YYYY-MM-DD-description.md`

   Please review it and let me know:
   - Are the phases properly scoped?
   - Are the success criteria specific enough?
   - Any technical details that need adjustment?
   - Missing edge cases or considerations?

   Confirm if you are happy with the plan.
   ```

4. **Iterate based on feedback** - be ready to:
   - Add missing phases
   - Adjust technical approach
   - Clarify success criteria (both automated and manual)
   - Add/remove scope items

5. **Once the user is happy**, set the status of the plan to `ready`. Offer the user to commit (only if the plan is not gitignored).

   Give the user a hint about the next step.

   ```text
   Next step: implement the plan.

   Start a fresh session:
   /new

   Then run:
   /rpi-implement @<path-to-plan>
   ```

## Important Guidelines

1. **Be Skeptical**:
   - Question vague requirements
   - Identify potential issues early
   - Ask "why" and "what about"
   - Don't assume - verify with code

2. **Be Interactive**:
   - Don't write the full plan in one shot
   - Get buy-in at each major step
   - Allow course corrections
   - Work collaboratively

3. **Be Thorough But Not Redundant**:
   - Use provided research as-is. Do not re-investigate what's already documented
   - Use subagents to find key files quickly
   - Read key source files directly into your context rather than delegating to sub-agents
   - Write measurable success criteria with clear automated vs manual distinction

4. **Be Visual**:
   - If the change involves any user-facing interface (web UI, CLI output, terminal UI, forms, dashboards, etc.), include ASCII mockups in the plan
   - Mockups make the intended result immediately understandable and help catch misunderstandings early
   - Study the current UI before creating mockups
   - Show both the current state and the proposed state when the change modifies an existing UI
   - Keep mockups simple but accurate enough to convey layout, key elements, and interactions

5. **Be Practical**:
   - Focus on incremental, testable changes
   - Consider migration and rollback
   - Ensure that all relevant documentation updates are fully covered by the plan
   - Think about edge cases

6. **No Open Questions in Final Plan**:
   - If you encounter open questions during planning, STOP
   - Research or ask for clarification immediately
   - Do NOT write the plan with unresolved questions
   - The implementation plan must be complete and actionable
   - Every decision must be made before finalizing the plan

## Success Criteria Guidelines

**Always separate success criteria into two categories:**

1. **Automated Verification** (can be run by agents):
   - Commands that can be run: test suites, linters, type checkers
   - Specific files that should exist
   - Code compilation/type checking

2. **Manual Verification** (requires human testing):
   - You MUST only add manual verification when the user can interact with a working feature (e.g. open a UI, run a command, trigger a workflow).
   - You MUST NOT use "review the code" or "check the implementation" as a verification step.
   - You MUST NOT add manual verification to internal phases (refactoring, utilities, types, backend without entry point). Use automated verification instead.
   - You SHOULD place manual verification at milestones where a user-facing feature is complete.
   - Examples: UI/UX functionality, performance under real conditions, edge cases that are hard to automate, user acceptance criteria.

## Common Patterns

### For Database Changes:

- Start with schema/migration
- Add store methods
- Update business logic
- Expose via API
- Update clients

### For New Features:

- Research existing patterns first
- Start with data model
- Build backend logic
- Add API endpoints
- Implement UI last

### For Refactoring:

- Document current behavior
- Plan incremental changes
- Maintain backwards compatibility
- Include migration strategy
