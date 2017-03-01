const Jira = require('./jira');
const sh = require('./alfred-exec');

let args = process.argv.slice(2)[0].split(' ');
let query = args.shift();

switch(query) {
  case 'clearSettings':
    Jira.clearSettings();
  break;
  case 'update':
    Jira.refreshCache();
    let res = sh.exec('sh ./bin/update.sh');
  break;
  case 'editSettings':
    Jira.editSettings()
  break;
  case 'clearCache':
    Jira.clearCache();
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
          Jira.refreshCache('tickets', 'watchedTickets', 'in-progress');
          console.log(res);
        }
      })
      .catch(console.log);
  break;
  case 'toggleWatch':
    let [issueId, currentState] = args;
    Jira.toggleWatch(issueId, currentState === 'true')
      .then(console.log)
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
    Jira.clearCache('tickets', 'watchedTickets', 'in-progress');
  break;
  case 'createIssue':
    let [issueType, projectKey, summary] = args;
    Jira.createIssue(issueType, projectKey, summary)
      .then(console.log)
      .catch(console.log);
  break;
}