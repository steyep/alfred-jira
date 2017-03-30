const Jira = require('./jira');
const Workflow = require('./workflow');
let wf = new Workflow();
let actions = wf.actionHandler;

const reserved = {
  'clear': 'clear-inProgress'
};

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
