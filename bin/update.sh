#! /bin/sh
upstream="$(git rev-parse --abbrev-ref --symbolic-full-name @{u})"
[[ -z "$upstream" ]] && upstream="origin/master"

git reset --hard $upstream && npm install 
echo "Workflow updated"
IFS=$'\n'
restart="$(npm run -s electron update)"
[[ ! "$restart" ]] && exit 0;

alfred=()
pids=()
for process in $(ps ax -o pid,comm | grep Alfred | grep -v grep); do
  app=${process#* }
  pid=${process%% *}
  pids+=($pid)
  alfred+=(${app/.app*/.app})
done
( kill -9 ${pids[@]} && open $alfred ) &
exit 0
