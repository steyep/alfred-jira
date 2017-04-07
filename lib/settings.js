const fs = require('fs');
const sh = require('./alfred-exec');
const Jira = require('./jira');
const cache = require('./jira/cache');
const Workflow = require('./workflow');

let wf = new Workflow();

function validateRepo() {
  let gitDir = process.cwd() + '/.git',
      exists = fs.existsSync(gitDir);
  if (exists) {
    let pushUrl = sh.execSync("grep -A1 '\"origin\"' " + gitDir 
      + "/config | tail -n 1 | awk '{ print $3 }'").toString();
    
    if (!/steyep/.test(pushUrl)) {
      sh.execSync("git remote set-url origin git@github.com:steyep/alfred-jira.git");
      sh.execSync("git remote set-url --push origin " + pushUrl);
    }
  } else {
    return false;
  }
  return true;
}

module.exports = {
  checkUpdates: function() {
    return new Promise((resolve, reject) => {
      if (!validateRepo()) {
        reject('Unable to validate git repo');
      }
      // If we already know an update is available,
      // or if the cache hasn't expired since we last checked, 
      // don't check again.
      let cacheLimit = 24*60*60*1000; // 1 day
      let updates = cache.get('update');
      if (cache.get('update', cacheLimit) === undefined && !updates) {
        sh.execSync('git fetch origin');
        let status = sh.execSync('git status').toString();
        updates = !/up-to-date/.test(status);
        cache.set('update', updates);
      }
      resolve(updates);
    });
  },

  menu: function(query) {
    this.checkUpdates().then(updatesAvailable => {
      wf.addItems([{
        title: updatesAvailable ? 'Update available' : 'Workflow is up-to-date',
        subtitle: 'Last checked: ' + cache.lastChecked('update'),
        valid: updatesAvailable,
        arg: 'update',
        icon: updatesAvailable ? 'update.png' : 'good.png'
      },
      { title: 'Edit Settings', icon: 'edit.png', valid: true, arg: 'editSettings' },   
      { title: 'Clear cache', icon: 'delete.png', valid: true, arg: 'clearCache' }
      ]);
      wf.feedback();
    })
    .catch(() => {
      wf.error('Unable to check for updates', 'No git repo found', true);
      wf.feedback();
    });
  }
}