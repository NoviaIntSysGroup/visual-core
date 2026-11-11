---
name: issue-fix
description: >-
  Edit this repo's instructions — skills and their reference files, AGENTS.md, the README,
  code comments, and kit doc headers — so they are correct, clear, and short. Use when working
  through the problems logged in `issues/` by the `issue-log` skill, including the ones in
  code, when the user asks to tidy or rewrite a doc, or before any other change to an
  instruction. Fixes the cause by rewriting, not by appending.
---

# Editing Instructions

An instruction is read by an agent that trusts it and knows nothing else. Each line it reads
costs attention, and each rule competes with every other. So the goal of an edit is a doc that
is correct and as short as it can be while still covering the work, not one that has an answer
for every problem seen so far.

## The pass

1. **Gather.** List `issues/` and group the entries by subject and section. Several
   entries on one section usually share one cause. With no entries, start from the doc the
   user named.
2. **Read the whole section, and the code it describes.** Check what is true now, and
   reproduce a code problem where you can; the entry records what one agent saw, and its
   `guess` is only a guess.
3. **Find the cause.** Ask why the agent was misled: a false claim, a rule hidden in a long
   list, two places saying different things, a heading that sends readers elsewhere, detail
   that buries the point, or code that is wrong or awkward to use. The answer decides the
   edit; adding a sentence is rarely it, and a code cause is fixed in the code.
4. **Propose.** For each subject, say in a line or two what is wrong and what you will change,
   with the length before and after. Changes to `core/` are agreed with the user before they
   are made (AGENTS.md rule 6).
5. **Edit** a doc by the rules below, and code by the skill that governs it.
6. **Close.** Delete the entries you fixed; git keeps them. Tell the user which entries you
   left, and why.

## Rules for the edit

- **Replace, don't append.** Rewrite the sentence that was wrong. A fix that only adds lines
  needs a reason why nothing could be cut or merged.
- **One fact, one place.** If two docs state it, keep it where a reader looks first and link
  to it from the other.
- **Delete** what is out of date, what the code or a file name already says, and history
  ("previously…", "now…"). Say what is, not how it came to be.
- **A rule and one example** beat a list of special cases. A list of cases often hides the
  rule that would cover them all.
- **Keep the shape.** A `SKILL.md` holds what most tasks need; detail that few tasks need goes
  in the skill's reference files, named from `SKILL.md`. AGENTS.md is loaded every session, so
  it holds only rules that apply to every session.
- **Check every claim you touch** against the code: names, paths, defaults, units.
- **Code comments** say what the code does, in five lines or fewer (AGENTS.md rule 5).

Report the line count of each edited file before and after.
