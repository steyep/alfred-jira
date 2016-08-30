url="$1"
output="$2"
auth=$(security 2>&1 >/dev/null find-generic-password -s alfred-jira -g | sed -E 's/^password: "(.+)"$/\1/')
[[ "$auth" == "security: SecKeychainSearchCopyNext: The specified item could not be found in the keychain." ]] && { echo "Could not find auth-token"; exit 1; }
[[ ! "$url" ]] && { echo "No url specified."; exit 1; } 
[[ ! "$output" ]] && { echo "No output file specified."; exit 1; } 

test -d $(dirname "$output") || mkdir -p $(dirname "$output")
curl -H "Authorization: Basic $auth" -o $output $url 
extension=$(file -b --mime-type $output | sed -E 's_.*/([^\+]*).*_\1_')
# if [[ "$extension" == "svg" ]]; then
#   qlmanage -t -s 48 -o . $output 
#   extension="png"
# fi
mv $output $output.$extension
exit 0
