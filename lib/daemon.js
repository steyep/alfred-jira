const config = require('./jira/config');
const sh = require('./alfred-exec');
const path = require('path');
const plistFile = config.plistFile;
const plist = path.parse(plistFile);
const fs = require('fs');

const DaemonDefinition = interval => (
`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plist.name}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>${path.resolve(__dirname, 'background.js')}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>${interval}</integer>
</dict>
</plist>`);

const BackgroundProcess = {
  status: () => sh.execSync(`launchctl list | grep ${plist.name} | awk '{ print $2 }'`).toString().replace(/[^\d]/g, '') || undefined,
  load: function (interval) {
    if (this.unload()) {
      let definition = DaemonDefinition(interval);
      fs.writeFileSync(plistFile, definition, 'utf8');
      sh.execSync(`launchctl load ${plistFile}`);
      return true;
    }
    return false;
  },
  unload: function() {
    if (this.status() !== undefined) {
      sh.execSync(`launchctl unload ${plistFile}`);
    }
    if (fs.existsSync(plistFile)) {
      fs.unlinkSync(plistFile);
    }
    return true;
  }
}

module.exports = BackgroundProcess;