#!/bin/bash
print_help_message () {
  echo "This script generates a zip file for a BSVE app."
  echo "$0 APP_URL APP_NAME ZIP_PATH"
  echo "Example:"
  echo "$0 https://grits.eha.io/new?compact=true \"GRITS Example\" app.zip"
}

if [ "$#" -ne 3 ]; then
  echo "Incorrect number of arguments."
  print_help_message
  exit 1
fi
SCRIPT_DIR="$(dirname "$(readlink "$0")")"
cp -r $SCRIPT_DIR/template temp_template

cat > temp_template/source.js <<EOF
var APP_URL = "$1";
var APP_NAME = "$2";
EOF
cat >> temp_template/source.js < template/source.js
ZIP_PATH="`readlink -f "$3"`"
cd temp_template
zip -r $ZIP_PATH .
cd ..
rm -r temp_template
