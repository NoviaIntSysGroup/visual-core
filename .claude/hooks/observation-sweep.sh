#!/bin/sh
# Hook that keeps the observation-log and session-log skills in play. At session start it
# prints both into context. After a Read, Grep or Bash call it notes the repo files the call
# read. At the end of a turn it writes one record to sessions/<session>.jsonl: the Task line's
# parts, the Observations line and those reads. It stops the turn once if a line is missing.
dir=${CLAUDE_PROJECT_DIR:-.}
skills=core/skills
[ -d "$dir/$skills" ] || skills=skills

input=$(cat)
field() {
  printf '%s' "$input" | grep -o "\"$1\" *: *\"[^\"]*\"" | head -n 1 | sed 's/.*"\([^"]*\)"$/\1/'
}
log="$dir/sessions/$(field session_id).jsonl"
pending="$dir/sessions/$(field session_id).reads"
record() {
  mkdir -p "$dir/sessions"
  printf '{"at":"%s",%s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" >> "$log"
}
# Writes one record with the reads noted since the last one, then forgets them.
flush() {
  reads=$([ -f "$pending" ] && sort -u "$pending" | sed 's/.*/"&"/' | paste -sd, -)
  record "$1,\"reads\":[$reads]"
  rm -f "$pending"
}

case "$(field hook_event_name)" in
  SessionStart)
    for skill in observation-log session-log; do
      printf 'The %s skill (%s/%s/SKILL.md), loaded by a hook:\n\n' "$skill" "$skills" "$skill"
      cat "$dir/$skills/$skill/SKILL.md"
      echo
    done
    ;;
  UserPromptSubmit)
    # Reads still noted here belong to a turn that ended without Stop, such as an interrupt.
    [ -s "$pending" ] && flush '"interrupted":true'
    ;;
  PostToolUse)
    # A Read or Grep reads its file; a Bash command reads the files named after a read verb
    # (cat, sed, grep…). Glob patterns, flags, directories and > targets are not reads.
    set -f
    case "$(field tool_name)" in
      Read) names=$(field file_path) ;;
      Grep) names=$(field path) ;;
      Bash) names=$(printf '%s' "$input" | grep -oE '"command" *: *"(\\.|[^"\\])*"' | head -n 1 |
          sed -E 's/^"command" *: *"//; s/"$//; s/\\n/;/g; s/\\t/ /g; s/\\"/"/g; s/[0-9]*>+ *[^ ;|&]+//g' |
          tr ';|&' '\n\n\n' | sed -E 's/^ *(do|then|else|\{|\() +//' |
          while read -r verb args; do
            case "$verb" in cat|head|tail|sed|grep|awk|wc|diff|cut|nl|less) ;; *) continue ;; esac
            printf '%s\n' $args | tr -d "\"'" | grep -v '^-' | grep -v '[*?[]'
          done) ;;
      *) exit 0 ;;
    esac
    # Paths are stored relative to the project root, and core files relative to the core.
    root=$(realpath "$dir")
    reads=$(printf '%s\n' "$names" | while read -r name; do
      case "$name" in /*) file=$name ;; *) file=$root/$name ;; esac
      [ -f "$file" ] || continue
      file=$(realpath "$file")
      case "$file" in "$root"/*) file=${file#"$root"/}; echo "${file#core/}" ;; esac
    done | sort -u)
    [ -n "$reads" ] && { mkdir -p "$dir/sessions"; printf '%s\n' "$reads" >> "$pending"; }
    ;;
  Stop)
    # The closing message is in the input, or else in the transcript tail.
    closing=$input
    transcript=$(field transcript_path)
    printf '%s' "$input" | grep -q '"last_assistant_message"' ||
      { [ -f "$transcript" ] && closing=$(tail -n 3 "$transcript"); }
    task=$(printf '%s' "$closing" | grep -oE 'Task: [0-9]+ [^"\\]*' | tail -n 1)
    observations=$(printf '%s' "$closing" | grep -oE 'Observations: [^"\\]*' | tail -n 1)
    n=$(printf '%s' "$task" | sed -nE 's/^Task: ([0-9]+) .*/\1/p')
    type=$(printf '%s' "$task" | sed -nE 's/^Task: [0-9]+ · ([a-z-]+) · .*/\1/p')
    goal=$(printf '%s' "$task" | sed -nE 's/^Task: [0-9]+ · [a-z-]+ · //p')
    fields="\"n\":${n:-null},\"type\":\"$type\",\"goal\":\"$goal\""
    fields="$fields,\"observations\":\"${observations#Observations: }\""
    # Already continuing from this hook's stop: record what there is, so it stops at most once.
    if printf '%s' "$input" | grep -q '"stop_hook_active" *: *true'; then
      flush "$fields"
      exit 0
    fi
    reason=
    [ -n "$observations" ] || reason="Observation sweep, from the
      observation-log skill. Look back over this turn, from the message that started it and
      through every subagent's report, and at what it made clear about earlier turns: did
      something get in your way, could the code, docs or tools be better than they are, or
      did the user tell you something no instruction states? Log each with that skill, or give
      in one clause why not. Then end with one line, Observations: <what you logged, or
      nothing>."
    if [ -z "$task" ]; then
      reason="${reason:+$reason }End the turn with the Task line the session-log skill
        describes, before the Observations line."
    elif [ -z "$goal" ] || { [ "$type" != other ] && [ ! -d "$dir/$skills/$type" ]; }; then
      reason="${reason:+$reason }The Task line must read Task: <n> · <type> · <goal>, with a
        type that is a folder in $skills/ or other. Write it again."
    fi
    if [ -z "$reason" ]; then
      flush "$fields"
      exit 0
    fi
    printf '{"decision":"block","reason":"%s"}\n' "$(printf '%s' "$reason" | tr -s '\n ' '  ')"
    ;;
esac
exit 0
