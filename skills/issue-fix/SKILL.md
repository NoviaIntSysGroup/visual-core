---
name: issue-fix
description: >-
  Edit this repo's instructions — skills and their reference files, AGENTS.md, the README, and
  code comments — so they are correct, clear, and short. Use when working through the entries
  logged in `issues/` by the `issue-log` skill, including the ones in code and the `memory`
  entries that become skills or notes, when the user asks to tidy or rewrite a doc, or before
  any other change to an instruction. Fixes the cause with a general rule, by rewriting, not
  appending.
---

# Editing Instructions

An instruction is read by an agent that trusts it and knows nothing else. Each line it reads
costs attention, and each rule competes with every other. So the goal of an edit is a doc that
is correct and short: general rules a reader can extend, not an answer for every problem seen
so far. A rule is only as simple as the code behind it, so the fix is often there.

## The pass

1. **Gather.** List `issues/` and group the entries by subject, then look across the groups:
   entries in different docs often share one cause, such as one rule written in several places
   or code that fails without a word. With no entries, start from the doc the user named.
2. **Read the whole section, and the code it describes.** Check what is true now, and reproduce
   a code problem where you can; the entry records what one agent saw, and its `guess` names
   the case it hit, not the fix.
3. **Find the cause.** Ask what general problem the entry is one case of, and why the agent was
   misled: a false claim, a rule written as the one case that prompted it, a rule hidden in a
   long list, two places saying different things, a heading that sends readers elsewhere,
   detail that buries the point, or code with no rule a reader could guess. The answer decides the edit; adding a sentence is rarely it, and a code
   cause is fixed in the code, so that one rule describes it. `memory` entries are hints, not
   fixes: weigh them together and consolidate only what recurs or clusters. Then fold it into
   the doc readers already open when most tasks there need it, add a lookup file beside that
   skill when few do, or write a new skill when the cluster has none. Leave the rest to gather
   evidence.
4. **Propose.** For each cause, not each entry, say in a line or two what is wrong, the rule
   the fix establishes, and what you will change. A good batch leaves the docs it touches
   shorter: give each doc's length before and after, and a reason for any that grows. Agree
   the proposal with the user before editing.
5. **Edit** a doc by the rules below, and code by the skill that governs it.
6. **Close.** Each entry ends one of three ways, and the two archives beside `issues/` are the
   cases `issue-log` is evaluated against. If you made its fix, move it to `issues-fixed/` and
   add a `fixed:` line naming the files changed and the rule the fix set up. If it needed no
   change (a slip where the text was clear, a claim already true, a tool outside the repo),
   move it to `issues-dismissed/` and add a `dismissed:` line saying why. A `memory` entry left
   to gather evidence stays in `issues/`. `.gitignore` keeps all three folders out of git. Tell
   the user which entries you dismissed or left, and why.

## Rules for the edit

- **Replace, don't append.** Rewrite the sentence that was wrong. A fix that only adds lines
  needs a reason why nothing could be cut or merged.
- **One fact, one place.** If two docs state it, keep it where a reader looks first and point
  to it from the other.
- **Paths, not links.** Docs an agent reads name a file as a backticked path from the project
  root (`core/skills/figures/SKILL.md`). Markdown links belong only in docs for humans, like
  the README.
- **Delete** what is out of date, what the code or a file name already says, and history
  ("previously…", "now…"). Say what is, not how it came to be.
- **A rule and one example** beat a list of special cases. A list of cases hides the rule that
  would cover them all; when no rule does, make the code regular rather than document the
  cases.
- **Keep the shape.** A `SKILL.md` holds what most tasks need; detail that few tasks need goes
  in the skill's reference files, named from `SKILL.md`. AGENTS.md is loaded every session, so
  it holds only rules that apply to every session.
- **Check every claim you touch** against the code: names, paths, defaults, units.
- **Code comments** say what the code does, in five lines or fewer (AGENTS.md rule 5).

Report the line count of each edited file before and after.
