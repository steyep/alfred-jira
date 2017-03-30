const fs = require('fs');
const Jira = require('./jira');
const Workflow = require('./workflow');
const config = require('./jira/config');
const cfgFile = config.cfgPath + config.cfgFile;

let wf = new Workflow();
let actions = wf.actionHandler;

const reserved = {
  'clear': 'clear-inProgress',
  'open': 'open-in-browser'
};

actions.onAction('open-in-browser', params => {
  if (Jira.checkConfig()) {
    let data = JSON.parse(fs.readFileSync(cfgFile, 'utf-8'));
    let issue = params[0] || '';
    wf.addItem({
      title: 'Open in a browser',
      subtitle: issue ? `Open ${issue} in browser` : 'Enter an issue key to open.',
      valid: issue !== '',
      autocomplete: 'open ' + wf._sep + issue.toUpperCase(),
      arg: `openURL ${data.url}browse/${issue}`
    });
    wf.feedback();
  }
});

actions.onAction('clear-inProgress', () => {
  wf.default({
    title: 'No issues in progress',
    valid: false,
    autocomplete: ''
  });
  let progress = Jira.listInProgress();
  if (progress) {
    wf.addItems(progress
      .map(issue => {
        return {
          title: `Clear progress on ${issue.id}`,
          subtitle: issue.runTime,
          valid: true,
          autocomplete: 'clear',
          projectIcon: issue.id.replace(/-.*$/, '') + '.png',
          arg: `clearProgress ${issue.id}`
        }
      }));
  }
  wf.feedback();
});

module.exports = {
  reserved: query => {
    let [context,...params] = query
      .split(new RegExp('[\\s' + wf._sep + ']+', ''))
      .map(s => s.trim())
      .filter(String);
    let extension = Object.keys(reserved)
      .find(key => new RegExp('^' + key + '$', 'i').test(context));
    if (!extension || /^\s/.test(query)) return false;

    actions.handle(reserved[extension], params);
  }
}
