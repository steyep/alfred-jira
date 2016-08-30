#! /bin/sh
url="$1"
username="$2"

source "./bin/pashua.sh"
conf="
# Set window title
*.title = Alfred Jira Workflow

# Get Username
url.type = textfield
url.label = Jira URL
url.default = $url
url.mandatory = 1
url.width = 310

# Get Username
username.type = textfield
username.label = Username
username.default = $username
username.mandatory = 1
username.width = 310

# Get Password
password.type = password
password.label = Password
password.mandatory = 1
password.width = 310

cancel.type = cancelbutton
"
pashua_run "$conf"