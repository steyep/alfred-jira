const Jira = require('./jira');
const sh = require('./alfred-exec');
const config = require('./jira/config');
const log = require('./alfred-log');
const fs = require('fs');
const cfgFile = config.cfgPath + config.cfgFile;

let args = process.argv.slice(2)[0].split(' ');
let query = args.shift();
const bookmarks = () => Jira.getBookmarks().map((s,p) => `bookmark-${p}`);
const openURL = url => url ? sh.exec(`open ${url}`) : false;
const openIssue = key => {
  if (key && Jira.checkConfig()) {
    let data = JSON.parse(fs.readFileSync(cfgFile, 'utf-8'));
    openURL(`${data.url}browse/${key}`);
  }
}

switch(query) {
  case 'update':
    Jira.refreshCache();
    sh.exec('sh ./bin/update.sh');
  break;
  case 'editSettings':
    Jira.editSettings();
  break;
  case 'clearCache':
    Jira.clearCache();
  break;
  case 'clearProgress':
    Jira.clearProgress(args[0]);
  break;
  case 'login':
    Jira.login();
  break;
  case 'openURL':
    openURL(( args[0] || ''));
  break;
  case 'openIssue':
    openIssue(args[0] || '');
  break;
  case 'assign': 
    let [ticket, user] = args;
    Jira.assign(ticket, user)
      .then(res => {
        if (res) {
          Jira.refreshCache(...bookmarks(), 'in-progress');
          console.log(res);
        }
      })
      .catch(console.log);
  break;
  case 'toggleWatch':
    let [issueId, currentState] = args;
    Jira.toggleWatch(issueId, currentState === 'true')
      .then(res => {
        console.log(res);
        Jira.refreshCache(...bookmarks(), 'in-progress');
      })
      .catch(console.log);
  break;
  case 'startProgress': 
    Jira.startProgress(args[0]);
  break;
  case 'stopProgress':
    Jira.stopProgress(args[0])
      .then(console.log)
      .catch(console.log)
  break;
  case 'comment': 
    let issue = args.shift();
    let comment = args.join(' ');
    Jira.comment(issue, comment)
      .then(console.log)
      .catch(console.log);
  break;
  case 'transition':
    let [ticketId, action] = args;
    Jira.transition(ticketId, action);
    Jira.clearCache(...bookmarks(), 'in-progress');
  break;
  case 'create-issue':
  case 'create-issue-open':
    Jira.createIssue().then(res => {
      console.log(`Created issue: ${res}`);
      if (query == 'create-issue-open') {
        openIssue(res);
      }
      Jira.clearCache(...bookmarks(), 'in-progress');
    }).catch(err => {
      log(err);
      console.log(err);
    });
  break;
}