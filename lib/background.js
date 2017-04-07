const Jira = require('./jira');
const settings = require('./settings');
const sh = require('child_process');
const fs = require('fs');
const config = require('./jira/config');
const log = require('./alfred-log');
const moment = require('moment');

const pid = config.cfgPath + 'bg.pid';

if (!fs.existsSync(pid)) {
  fs.writeFileSync(pid, process.pid);

  Jira.getAllBookmarks().catch(console.error);
  Jira.getUsers().catch(console.error);
  settings.checkUpdates().catch(console.error);

  process.on('exit', code => {
    fs.unlinkSync(pid);
    log(moment().format('MMM D YY h:mm:ss A') + ' background exit status: ' + code);
    process.exit(code);
  });
} 
else {
  // Delete the file if it hasn't been modified in 60 seconds
  fs.stat(pid, (err, stat) => {
    if (err) return log(err);
    let lastUpdated = new Date(stat.ctime).getTime();
    let now = new Date().getTime();
    if (now - lastUpdated >= 60*1000) {
      // If the process is still running, kill it.
      sh.exec('ps -p $(cat ' + pid + ') && kill -9 $(cat ' + pid + ')', () => {
        fs.unlinkSync(pid);
      });
    }
  });
}