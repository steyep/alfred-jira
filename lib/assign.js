var Jira = require('./jira');
var Workflow = require('./workflow');
var wf = new Workflow();

module.exports = (query) => {
  query = query.split(wf._sep).map(s => s.trim());
  let search = query.pop() || '';
  let context = query.pop() || '';
  let data = wf.storage.get(context);
  
  if (!data) {
    return wf.actionHandler.handle('mainMenu', query);
  }
  
  let ticket = data._key;
  let currentUser = data.currentAssignee;
  wf.default({ 
    title: 'No user found matching: "' + search + '"', 
    valid: false, 
    autocomplete: query.concat(context).join(wf._sep) + wf._sep
  });

  Jira.getUsers().then( users => {
    wf.addItems(
      users
        .filter(s => s.name != currentUser && new RegExp(search, 'i').test(s.name.trim()))
        .map( user => {
        return {
          title: user.name,
          valid: true,
          icon: './resources/icons/assigned.png',
          autocomplete: query.concat(context, user.name).join(' ' + wf._sep),
          arg: ['assign', ticket, user.username].join(' ')
        }
    }))
    wf.feedback();
  }).catch(wf.error.bind(wf))
}