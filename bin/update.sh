#! /bin/sh
source "./bin/pashua.sh"
conf="
# Set window title
*.title = Alfred Jira

img.type = image
img.path = ./resources/icons/restart.png
img.maxwidth = 50

info.type = text
info.x = 60
info.y = 50
info.text = Your workflow has been updated![return]In order for the changes to take effect, you may need to restart Alfred.

restart.type = defaultbutton
restart.label = Restart now

cancel.type = cancelbutton
cancel.label = Later
"

upstream="$(git branch -lvv | grep \* | sed 's/.*\[\(.*\):.*/\1/')"
[[ -z "$upstream" ]] && upstream="origin/master"

git reset --hard $upstream
echo "Workflow updated"

result="$(pashua_run "$conf")"

# Parse result
for line in $result
do
    name=$(echo $line | sed 's/^\([^=]*\)=.*$/\1/')
    value=$(echo $line | sed 's/^[^=]*=\(.*\)$/\1/')
    eval $name='$value'
done

if [[ "$restart" == "1" ]]; then
  alfred_pid=$(ps -o ppid= $PPID)
  app=$(ps -p $alfred_pid -o comm=)
  ( kill -9 $alfred_pid && open "${app/.app*/.app}" ) &
fi
exit 0