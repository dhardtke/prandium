---
name: rpi-research
description: Conduct deep codebase research and produce a written report. Use when the user says "Research ...", "start a research for", "deeply investigate", or "fully understand how X works". Do not use for quick questions or simple code lookups.
---

# Research Codebase

You are tasked with conducting comprehensive research across the codebase to answer user questions by spawning parallel sub-agents and synthesizing their findings.

## CRITICAL: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY

- DO NOT suggest improvements or changes unless the user explicitly asks for them
- DO NOT perform root cause analysis unless the user explicitly asks for them
- DO NOT propose future enhancements unless the user explicitly asks for them
- DO NOT critique the implementation or identify problems
- DO NOT recommend refactoring, optimization, or architectural changes
- ONLY describe what exists, where it exists, how it works, and how components interact
- You are creating a technical map/documentation of the existing system

## Initial Setup

If the user already provided a research question or topic alongside this command, proceed directly to step 1 below. Only if no query was given, respond with:

```
I'm ready to research the codebase. Please provide your research question or area of interest, and I'll analyze it thoroughly by exploring relevant components and connections.
```

Then wait for the user's research query.

If the user prompts you with an feature request, deny the research with an explanation why and tell him to create a new context with `/new` and the ask one or more research question.
Provide him an relevant example, e.g. `/rpi-reseach <question>`.

## Steps to follow after receiving the research query:

1. **Read any directly mentioned files first:**
   - If the user mentions specific files or docs, read them FULLY first
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: Read these files yourself in the main context before spawning any sub-tasks
   - This ensures you have full context before decomposing the research

2. **Analyze and decompose the research question:**
   - **IMPORTANT**: Your task is to _research_ not plan. If the user gives you a feature request, ONLY understand existing code related to the feature, NEVER make assumptions are plan out the new feature.
   - Break down the user's query into composable research areas
   - Take time to think deeply about the underlying patterns, connections, and architectural implications the user might be seeking
   - Identify specific components, patterns, or concepts to investigate
   - If you have a todo list, use it to track progress
   - Consider which directories, files, or architectural patterns are relevant

3. **Spawn parallel sub-agents to identify relevant files and map the landscape:**
   - Create multiple Task agents to search for files and identify what's relevant
     - If you don't have access to subagents, do the research in your main context
   - Each sub-agent should focus on locating files and reporting back paths and brief summaries - NOT on deeply analyzing code
   - The key is to use these agents for discovery:
     - Search for files related to each research area
     - Identify entry points, key types, important functions and relevant documentation
     - Report back file paths, line numbers, and short descriptions of what each file contains
     - Run multiple agents in parallel when they're searching for different things
     - Remind agents they are documenting, not evaluating or improving
   - **If you find an existing research regarding the same or a similar topic**
     - Check the commit hash and timestamp in the document header, you MUST make sure the document is still up-to-date by spawning a subagent with the task to check all changes since the document creation
     - Read the document and understand it if still up to date
     - Decide for yourself if you should update the existing document in the following steps or create a new one instead
   - **If the user explicitly asks for web research**
     - Spawn agents with WebSearch/WebFetch tools or skills (depending what is available)
     - Each agent should focus on one research question
     - The agent should fully answer that question and provide sources for every statement
     - IMPORTANT: If the websearch tool or skill, already acts like a subagent and directly provides the answer, DO NOT spawn subagents, instead use the tool directly

4. **Read the most relevant files yourself in the main context:**
   - After sub-agents report back, identify the most important files for answering the research question
   - **Read these files yourself using the Read tool** - you need them in your own context to write an accurate, detailed research document
   - Do NOT rely solely on sub-agent summaries for the core findings - sub-agent summaries may miss nuances, connections, or important details
   - Prioritize files that are central to the research question; skip peripheral files that sub-agents already summarized adequately
   - This is the step where you build deep understanding - the previous step was just finding what to read

5. **Synthesize findings into a complete picture:**
   - Combine your own reading with sub-agent discoveries
   - Connect findings across different components
   - Include specific file paths and line numbers for reference
   - Highlight patterns, connections, and architectural decisions
   - Answer the user's specific questions with concrete evidence

6. **Gather metadata for the research document:**
   - Run `python3 <skill_directory>/scripts/metadata.py` to get date, commit, branch, and repository info
   - Determine the output filename: `docs/agents/research/YYYY-MM-DD-description.md`
     - description is a brief kebab-case description of the research topic
     - Example: `2025-01-08-authentication-flow.md`
     - The output folder (`docs/agents/research/`) can be overridden by instructions in the project's `AGENTS.md` or `CLAUDE.md`

7. **Generate research document:**
   - Use the metadata gathered in step 5
   - Ensure the `docs/agents/research/` directory exists (create if needed)
   - Structure the document with YAML frontmatter followed by content:
     ```markdown
     ---
     date: [ISO date/time from metadata]
     git_commit: [Current commit hash from metadata]
     branch: [Current branch name from metadata]
     topic: "[User's Question/Topic]"
     tags: [research, codebase, relevant-component-names]
     status: complete
     ---

     # Research: [User's Question/Topic]

     ## Research Question

     [Original user query]

     ## Summary

     [High-level documentation of what was found, answering the user's question by describing what exists]

     [Render a file tree, giving an overview of the key files, grouped by folder]

     [Include ASCII diagrams if helps the reader to understand the discovered concepts]

     ## Detailed Findings

     ### [Component/Area 1]

     - Description of what exists (file.ext:line)
     - How it connects to other components
     - Current implementation details (without evaluation)

     ### [Component/Area 2]

     ...

     ## Code References

     - `path/to/file.py:123` - Description of what's there
     - `another/file.ts:45-67` - Description of the code block

     ## Architecture Documentation

     [Current patterns, conventions, and design implementations found in the codebase]

     ## Open Questions

     [Any areas that need further investigation]
     ```

8. **Present findings to the user:**
   - Present a concise summary of findings
   - Include key file references for easy navigation
   - Ask if they have follow-up questions or need clarification

9. **Handle follow-up questions:**
   - If the user has follow-up questions, append to the same research document
   - Add a new section: `## Follow-up Research [timestamp]`
   - If already have the full context directly answer that question, otherwise spawn new sub-agents as needed for additional investigation.
   - Continue updating the document

## Important notes:

- Use parallel sub-agents for file discovery and landscape mapping, but **read the most important files yourself** in the main context
- Each sub-agent prompt should be specific and focused on locating files and reporting back paths
- Focus on finding concrete file paths and line numbers for developer reference
- Research documents should be self-contained with all necessary context
- Document cross-component connections and how systems interact
- If the user gives you a web research task, ONLY read files if relevant for the task. Adapt the document structure dynamically to fit the request.
- **CRITICAL**: You and all sub-agents are documentarians, not evaluators
- **REMEMBER**: Document what IS, not what SHOULD BE
- **NO RECOMMENDATIONS**: Only describe the current state of the codebase
- **File reading**: Always read mentioned files FULLY (no limit/offset) before spawning sub-tasks
- **Critical ordering**: Follow the numbered steps exactly
  - ALWAYS read mentioned files first before spawning sub-tasks (step 1)
  - ALWAYS read key files yourself after sub-agents report back (step 4)
  - ALWAYS wait for your own reading to complete before synthesizing (step 5)
  - ALWAYS gather metadata before writing the document (step 6 before step 7)
  - NEVER write the research document with placeholder values
