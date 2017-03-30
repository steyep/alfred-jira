const Jira = require('./jira');
const sh = require('./alfred-exec');

let args = process.argv.slice(2)[0].split(' ');
let query = args.shift();
const bookmarks = () => Jira.getBookmarks().map((s,p) => `bookmark-${p}`);

switch(query) {
  case 'update':
    Jira.refreshCache();
    sh.exec('sh ./bin/update.sh');
  break;
  case 'editSettings':
    Jira.editSettings()
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
    let url = args[0] || '';
    if (url) {
      sh.exec('open ' + url);
    }
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
    let [ticketId, action, token] = args;
    Jira.transition(ticketId, action, token);
    Jira.clearCache(...bookmarks(), 'in-progress');
  break;
}