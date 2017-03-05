auth=$(security 2>&1 >/dev/null find-generic-password -s alfred-jira -g | sed -E 's/^password: "(.+)"$/\1/')
[[ "$auth" == "security: SecKeychainSearchCopyNext: The specified item could not be found in the keychain." ]] && { echo "Could not find auth-token"; exit 1; }

curl -H "Authorization: Basic $auth" --create-dirs $@

for param in $@; do
  test ! -f $param && continue

  icon="$param"
  extension=$(file -b --mime-type $icon | sed -E 's_.*/([^\+]*).*_\1_')
  file_name="$icon.$extension"
  mv $icon $file_name

  if [[ "$extension" != "png" ]]; then
    qlmanage -t -s 48 -o $(dirname $icon) $icon.$extension 1>&2
    file_name="$icon.png"
    rm -f $icon.$extension
    mv $icon.$extension.png $file_name
  fi
done

exit 0
