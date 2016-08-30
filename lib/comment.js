var Jira = require('./jira');
var Workflow = require('./workflow');
var wf = new Workflow();

module.exports = query => {
  query = query.split(wf._sep).map(s => s.trim());
  let comment = query.pop() || '';
  let context = query.pop() || '';
  let data = wf.storage.get(context);
  let icon = './resources/icons/comment.png';
  wf.default({ title: 'Begin typing a comment for: ' + data._key, icon: icon });
  if (comment.trim()) {
    wf.addItem({
      title: comment.replace(/'/g, "\\'"),
      subtitle: data._key,
      valid: true,
      icon: icon,
      arg: ['comment', data._key, comment.replace(/'/g, "\\'")].join(' ')
    })
  }
  wf.feedback();
}