pushd $(dirname "$0") > /dev/null
repo="$(dirname "$PWD")"
popd > /dev/null

hash npm &> /dev/null && npm install || { 
  echo
  echo "Error: npm is required to install this workflow."
  echo "https://docs.npmjs.com/getting-started/installing-node"
  echo
  exit 1
}

echo "Looking for Alfred Preferences..."
paths=("$1" "$HOME/Dropbox" "$HOME/Library/Mobile Documents/com~apple~CloudDocs" "$HOME/Google Drive" "$HOME/Library/Application Support/Alfred" "$HOME/Library/Application Support/Alfred 3" "$HOME/Library/Application Support/Alfred 2")

for i in "${paths[@]}"; do
  d=${i// /\ }
  [[ ! -d $d ]] && continue
  path="$(find "$d" -path "*.alfredpreferences/workflows" | head -n 1)"
  if [[ -n "$path" ]]; then
    echo "Found preferences at: $(dirname "$path")"
    break
  fi
done

while true; do
  [[ -n "$path" ]] && break

  if [[ ! "$path" ]]; then
    echo "Enter the path to your \"Alfred.alfredpreferences\" file:"
    read directory
  fi

  if [[ ! -d "$directory" ]]; then
    echo "Unable to read \"$directory\""
    directory=
  fi

  if [[ "$directory" ]]; then
    path="$(find "$directory" -path "*.alfredpreferences/workflows" 2>/dev/null)"
    if [[ -n "$path" ]]; then
      echo "Found preferences at: $(dirname "$path")"
      break 
    else
      echo "Could not locate \"Alfred.alfredpreferences\" at \"$directory\""
      path=
    fi
  fi
done

link="$path/_jira"
if [[ -L "$link" ]]; then
  echo "Workflow already installed at \"$link\"." 
  echo "Re-install? Y/n"
  read res
  [[ "$res" != "Y" ]] && exit 0
  rm "$link"
fi 

if [[ -d "$link" ]]; then
  echo
  echo "ERROR: Non-symlinked directory found at:"
  echo "\"$link\""
  echo "Remove previously installed Alfred-Jira workflows before installing"
  exit 1
fi

ln -s "$repo" "$link"
echo "Installation complete!"
exit 0
