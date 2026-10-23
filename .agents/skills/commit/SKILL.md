---
name: commit
description: >
  Compose and record a git commit in this repository's house style: a
  Conventional-Commits subject line and, when the change earned one, a body of
  flowing prose that explains why the code is the way it is rather than
  restating the diff. Use this whenever the user asks to commit, stage, check
  in, or save work, asks what a commit message should say, or asks you to split
  a messy working tree into sensible commits — and read it before you run
  `git commit` at the end of a task even if nobody said the word "commit",
  because the default message an assistant reaches for is not the one this
  repository uses.
---

# Writing a commit for this repository

The commit log here is written to be read. Someone opening `git log` a year from
now should be able to reconstruct not just what changed but what the author knew
at the time: the constraint that forced the design, the obvious approach that
turned out to be wrong, what was measured, what was deliberately left alone. The
diff already records what changed. The message records everything the diff
cannot.

That is a higher bar than most repositories set, and clearing it is most of the
work of this skill.

## Scope

Compose the message and record the commit. That is all.

Do not run the test suite, the typechecker, the linter or the formatter as part
of committing, do not fix code you notice on the way, and do not push. The
author decides when the tree is ready; your job starts once they have. If you
spot something genuinely broken in the diff, say so in your reply rather than
acting on it — an unexpected edit tangled into someone's commit is worse than a
late warning.

Commits go directly on `main`. Do not create a branch unless asked, and prefer a
new commit over amending an existing one.

## 1. Read before you write

Read the full diff, not a summary of it. `git status` for the shape of the tree,
`git diff --cached` for what is staged, `git diff` for what is not, and
`git log -5` to re-anchor on the current subject-line convention.

Two situations to notice while reading:

**Something is already staged.** That is a deliberate choice by the author about
what this commit contains. Commit exactly that, and mention in your reply what
was left unstaged so they can decide whether that was intentional.

**Untracked files.** Never sweep them in with `git add -A`. Name them and ask.
Scratch files, build output and local databases turn up here regularly, and
`data/gainz.sqlite` is git-ignored precisely because it should never land in a
commit.

## 2. One commit or several

If nothing is staged and the tree holds changes that do not belong to one story,
propose a split before touching the index. Group by whether a reader would want
to read the changes together, not by directory or file type: a route handler and
the test that exercises it are one commit; a route handler and an unrelated CSS
fix are two.

Present the grouping compactly — the files in each group and the subject line
you would give it — and wait for approval. Proposing a split costs a sentence;
unpicking a commit that mixed two ideas costs an interactive rebase, and this
repository commits straight to `main`, where that means rewriting published
history.

When the changes genuinely are one story, say so and move on. Splitting for its
own sake produces commits that cannot be reverted independently anyway.

## 3. The subject line

```
type(scope): Capitalized imperative summary
```

`feat:` for new behaviour, `fix:` for a defect, `refactor:` for a change that
rearranges code without changing what it does, `test:` for a commit whose change
is the tests themselves — a test that accompanies the code it exercises stays in
that code's commit — `docs:` for documentation content
— `README.md` and anything under `docs/` — `ci:` for the build and automation
pipeline, and `chore:` for the rest of the housekeeping: tooling, config,
dependency and editor upkeep, and instruction files like `AGENTS.md`.

`refactor:` is the workhorse here; several recent commits use it for moves and
regroupings. If a change both moves code and alters behaviour it is not a
refactor — either split it or label it by the behaviour.

A scope in parentheses only when it genuinely narrows things (`chore(idea):` for
IDE run configs); most commits do not need one.

Imperative mood, capitalized after the colon, no trailing period. Keep it short:
aim for about 50 characters and treat 72 as a hard ceiling. Short here means
dropping articles, possessives and the trailing prepositional phrase naming the
path the diff already shows — "refactor: Group frontend modules and styles", not
"refactor: Group the frontend's modules and styles under frontend/src/". Write
the line, then remove words until the next one you removed would cost meaning.
Detail that does not survive that trim belongs in the body, or nowhere.

Say what the change accomplishes, not which files moved. "Load route scripts and
styles on demand" tells you what the commit is about; "Update gz-app.js and
styles.js" does not. "Add an Auto/Light/Dark theme switcher", not "Added a theme
switcher" and not "theme switcher stuff".

Several older commits in this log carry no type prefix. That is history rather
than a pattern to follow — the recent ones are prefixed.

## 4. Whether this commit needs a body

A bare subject line is a complete and correct message when the change carries no
decision worth recording: adding a config file, updating a document, applying a
convention already agreed elsewhere, deleting something that has served its
purpose. `chore: Update AGENTS.md` needs nothing after it, and padding it out
with a paragraph that restates the subject makes the log harder to skim, not
easier.

Write a body when a reader would ask "why is it like this?" and the diff would
not answer them. In practice that means the change involved a tradeoff, a
measurement, a constraint you discovered, an approach you tried and abandoned,
or a consequence that is not visible from the code alone.

Length follows the reasoning, not the diff — and the reasoning is usually
shorter than it feels while you are still holding the change in your head. One
paragraph is the normal body. Two is common. Three or more has to be earned by
three or more distinct things a reader could not recover from the diff, and if
you have written that much, the first cut is almost always a sentence that
restates the subject line or narrates the diff.

A four-hundred-line mechanical move deserves the one paragraph that says it is
mechanical and names what was checked to confirm that. A one-line change that
took a day to understand may deserve several — but only for the day, not for the
line.

## 5. Writing the body

Before writing anything longer than a paragraph, read `references/examples.md` —
five real messages from this log, with notes on what each paragraph is doing.
The style is far easier to absorb from examples than from rules. Take the shape
of each paragraph from them, not the total length: the longest of the five is
the ceiling for an exceptional change, not the target.

The reasoning behind them:

**Open by orienting the reader.** Either the problem, in the past tense and
concretely — "Opening the dashboard downloaded the whole app: all eleven
component scripts and all eleven component stylesheets, 35 requests and 94 KB,
for a page that needs five components" — or a single sentence naming what the
change does. Both work. What does not work is opening with the mechanics, before
the reader knows what is at stake.

**Give the reasoning, not the inventory.** Each middle paragraph takes one facet
of the change and explains why it is shaped the way it is. Where you rejected
the obvious approach, say what it was and why it failed; that is the paragraph
that saves the next person from trying it again.

**Be specific.** Name the files, functions and identifiers involved. Use real
numbers when you have them — request counts, byte sizes, error counts, test
counts, measured pixel values. Vague praise is worthless in a log; "23 requests
and 45 KB" is not.

**State the negative space.** "This is a pure move. No stylesheet was edited at
all." "src/server.ts needed no change: it maps any path under public/
generically." "A `system` value written by the previous version is no longer
valid and falls through to that same default, so this needs no migration code."
Sentences like these stop a reviewer hunting for a change that is not there, and
by definition they are invisible in the diff.

**Close with verification, if you did any.** Say what you actually checked:
"Verified on Bun 1.4.2: 27 tests pass, tsc is clean, the frontend modules
resolve, and a running server still serves the API." Not "tested and working".

**Never invent a reason.** This is the one that matters most. A body full of
plausible-sounding rationale that nobody actually had is worse than no body,
because it reads exactly like the real thing and will be trusted. If you do not
know why a change is shaped the way it is, either find out — read the
surrounding code, or the conversation that produced the change — or write the
shorter message that claims only what you know. Numbers are the same trap: do
not write "cuts the payload by a third" unless something actually reported that.

### Form

Prose paragraphs, hard-wrapped around 72–80 columns, blank line between them.

No bullet lists. This is not decoration: a list lets you enumerate changes
without saying how they relate, and how they relate is the entire content of a
good commit body. If you catch yourself reaching for bullets, each item probably
needs a clause connecting it to the others — at which point it is a paragraph.
The one exception in this log is a short indented block laying three parallel
cases side by side, which is a table rather than a list.

Plain declarative sentences. Present tense for how the code behaves now, past
tense for how it behaved before. No "This commit…", no "This PR…". Avoid
"improved", "enhanced", "cleanly", "properly", "robust", "leverage": they take
up space without narrowing anything down.

## 6. Recording it

Write the message to a file and commit with `-F`. Quoting a multi-line message
through the shell mangles the wrapping and is a live hazard on this machine,
where the Bash tool rejects PowerShell here-strings and the two shells disagree
about escaping. A file sidesteps all of that, and lets you re-read the message
once more before it becomes permanent:

```sh
git commit -F "<scratchpad>/commit-msg.txt"
```

Use the session scratchpad directory for that file so it never lands in the
project.

End the message with this session's attribution trailers, taken from the current
session's attribution instructions — never copied from an old commit. The
`Claude-Session` trailer identifies the conversation that produced the commit,
so a copied one points at the wrong session and quietly corrupts the record.
Leave a blank line before the trailer block.

Then confirm with `git log -1 --stat`, and report the subject line and the files
that went in.

## Common failure modes

Reaching for the generic assistant commit message: a subject like "Update
files", a body of bullets restating the diff, an opening "This commit adds…". It
is what an assistant produces by default, and it is the specific thing this
skill exists to prevent.

Writing a body because the diff was large. Size is not the trigger; unrecorded
reasoning is.

Padding the subject line with the detail that is already in the diff — the path
the files moved to, the file names themselves, a qualifier that narrows nothing.
Trim it to the accomplishment and let the body carry the rest.

Writing three paragraphs where one carried the reasoning. Every extra paragraph
costs the reader attention they will spend on the next commit instead; if a
paragraph does not tell them something the diff cannot, cut it.

Inventing rationale to fill the body out. Covered above, and worth repeating,
because the pull to do it is strongest exactly when you know least about the
change.

Committing everything in the tree without looking, including the stray file the
author never meant to add.
