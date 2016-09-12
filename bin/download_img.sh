url="$1"
output="$2"
auth=$(security 2>&1 >/dev/null find-generic-password -s alfred-jira -g | sed -E 's/^password: "(.+)"$/\1/')
[[ "$auth" == "security: SecKeychainSearchCopyNext: The specified item could not be found in the keychain." ]] && { echo "Could not find auth-token"; exit 1; }
[[ ! "$url" ]] && { echo "No url specified."; exit 1; } 
[[ ! "$output" ]] && { echo "No output file specified."; exit 1; } 

test -d $(dirname "$output") || mkdir -p $(dirname "$output")
curl -H "Authorization: Basic $auth" -o $output $url 
extension=$(file -b --mime-type $output | sed -E 's_.*/([^\+]*).*_\1_')
file_name="$output.$extension"
mv $output $file_name

if [[ "$extension" == "svg" ]]; then
  qlmanage -t -s 48 -o $(dirname $output) $output.svg 1>&2
  file_name="$output.png"
  rm -f $output.svg
  mv $output.svg.png $file_name
fi

echo "File created: $file_name"

exit 0
