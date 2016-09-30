const Jira = require('./jira');
const settings = require('./settings');
const sh = require('child_process');
const fs = require('fs');
const config = require('./jira/config');

let log = config.cfgPath + 'bg.pid';
if (!fs.existsSync(log)) {
  fs.writeFile(log, process.pid);

  Jira.listAll().then(res => { 
    Jira.listWatched().then(() => {
      let inProgress = Jira.listInProgress();
      inProgress.forEach( item => Jira.inProgressInfo(item.id));
    })
  });
  
  Jira.getUsers();
  settings.checkUpdates();

  process.on('exit', code => {
    fs.unlink(log);
  });
} 
else {
  // Delete the file if it hasn't been modified in 60 seconds
  fs.stat(log, (err, stat) => {
    let lastUpdated = new Date(stat.ctime).getTime();
    let now = new Date().getTime();
    if (now - lastUpdated >= 60*1000) {
      // If the process is still running, kill it.
      sh.exec('ps -p $(cat ' + log + ') && kill -9 $(cat ' + log + ')', () => {
        fs.unlink(log);
      });
    }
  });
}