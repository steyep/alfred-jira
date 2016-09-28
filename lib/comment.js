var Jira = require('./jira');
var Workflow = require('./workflow');
var wf = new Workflow();

module.exports = query => {
  query = query.split(wf._sep).map(s => s.trim());
  let comment = query.pop() || '';
  let context = query.pop() || '';
  let data = wf.storage.get(context + '-comment');
  let key = data._key.replace('-comment', '');
  wf.default({ title: 'Begin typing a comment for: ' + key, icon: 'comment.png' });
  if (comment.trim()) {
    wf.addItem({
      title: comment.replace(/'/g, "\\'"),
      subtitle: key,
      valid: true,
      icon: 'comment.png',
      arg: ['comment', key, comment.replace(/'/g, "\\'")].join(' ')
    })
  }
  wf.feedback();
}