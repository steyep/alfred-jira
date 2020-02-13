var Jira = require('./jira');
var Workflow = require('./workflow');
var wf = new Workflow();

module.exports = query => {
  query = query.split(wf._sep).map(s => s.trim());
  if (query.length < 3) {
    return wf.actionHandler.handle('mainMenu', query);
  }
  let search = query.pop() || '';
  let context = query.pop() || '';
  let data = wf.storage.get(context + '-status');
  let key = data._key.replace('-status', '');
  
  Jira.status(key).then( transitions => {
    wf.addItems(transitions
      .filter( s => new RegExp(search, 'i').test(s.name))
      .map( transition => {
        return {
          title: transition.name,
          valid: true,
          autocomplete: wf.path(...query, context) + transition.name,
          icon: transition.category + '.png',
          arg: ['transition', transition.ticketId, transition.action, transition.token].join(' '),
        };
      }));
    wf.feedback();
  })
    .catch(wf.error.bind(wf));
};