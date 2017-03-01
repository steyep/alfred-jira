const Jira = require('./jira');
const Workflow = require('./workflow');
const fs = require('fs');

let wf = new Workflow();

module.exports = (query) => {
  query = query.split(wf._sep).map(s => s.trim());
  let search = query.pop() || '';
  let context = query.pop() || '';
  let data = wf.storage.get(context + '-assign');
  
  if (!data) {
    return wf.actionHandler.handle('mainMenu', query);
  }
  
  let ticket = data._key.replace('-assign', '');
  let currentUser = data.currentAssignee;
  wf.default({ 
    title: 'No user found matching: "' + search + '"', 
    valid: false, 
    autocomplete: query.concat(context).join(wf._sep) + wf._sep
  });

  Jira.getUsers().then( users => {
    wf.addItems(
      users
        .filter(s => s.name != currentUser && new RegExp(search, 'i').test(s.username.trim()))
        .map( user => {
        return {
          title: user.name,
          valid: true,
          userIcon: user.name.replace(/[^a-z0-9]/gi,'_') + '.png',
          autocomplete: query.concat(context, user.name).join(' ' + wf._sep),
          arg: ['assign', ticket, user.username].join(' ')
        }
    }))
    wf.feedback();
  }).catch(wf.error.bind(wf))
}