var Jira = require('./jira');
var Workflow = require('./workflow');
var wf = new Workflow();

module.exports = query => {

  // Query assignable users
  Jira.getUsers()
    .then(users => {
      let alfredContent = query;
      query = query.split(wf._sep).map(s => s.trim());
      let comment = query.pop() || '';
      let context = query.pop() || '';
      let data = wf.storage.get(context + '-comment');
      let key = data._key.replace('-comment', '');

      // Default script filter result
      wf.default({
        title: 'Begin typing a comment for: ' + key,
        icon: 'comment.png',
        valid: false
      });

      // Return @mention suggestions
      if (/@/.test(comment) && users.length) {
        let name = comment.split('@').pop();
        wf.addItems(users
          .filter(user => new RegExp('^' + name, 'i').test(user.name))
          .map(user => {
          return {
            title: user.name,
            valid: false,
            userIcon: user.username.replace(/[^a-z0-9]/gi,'_') + '.png',
            autocomplete: alfredContent.replace(/@\w+$/, `[~${user.username}]`)
          }
        }))
      }

      // Return a preview of the comment string that will be sent to JIRA
      // Pressing enter will POST comment to JIRA
      if (comment.trim()) {
        wf.addItem({
          title: comment.replace(/'/g, "\\'"),
          subtitle: key,
          valid: true,
          icon: 'comment.png',
          arg: ['comment', key, comment.replace(/'/g, "\\'")].join(' ')
        })
      }

      // Return the workflow feedback
      wf.feedback();

    });
}
