const fs = require('fs');
const sh = require('child_process');
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
    if (!validateRepo()) {
      return wf.error('Unable to check for updates', 'No git repo found', true);
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
    wf.addItem({
      title: updates ? 'Update available' : 'Workflow is up-to-date',
      subtitle: 'Last checked: ' + cache.lastChecked('update'),
      valid: updates,
      arg: 'update',
      icon: updates ? 'resources/icons/update.png' : 'resources/icons/good.png'
    });
  },

  menu: function(query) {
    this.checkUpdates();
    wf.addItems([
      { title: 'Edit Settings', icon: 'resources/icons/edit.png', valid: true, arg: 'editSettings' },   
      { title: 'Clear workflow settings', icon: 'resources/icons/delete.png', valid: true, arg: 'clearSettings' },
      { title: 'Clear cache', icon: 'resources/icons/delete.png', valid: true, arg: 'clearCache' },      
    ])
    wf.feedback();
  }
}