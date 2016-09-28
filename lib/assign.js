const Jira = require('./jira');
const Workflow = require('./workflow');
const fs = require('fs');

let wf = new Workflow();

let UserIcon = name => {
  let def = './resources/icons/assigned.png';
  let iconPath = './resources/user_icons/';
  if (!fs.existsSync(iconPath)) {
    return def;
  } 
  let icon = iconPath + name.replace(/[^a-z0-9]/gi,'_') + '.png';
  return fs.existsSync(icon) ? icon : def;
}

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
        .filter(s => s.name != currentUser && new RegExp(search, 'i').test(s.name.trim()))
        .map( user => {
        return {
          title: user.name,
          valid: true,
          icon: UserIcon(user.name),
          autocomplete: query.concat(context, user.name).join(' ' + wf._sep),
          arg: ['assign', ticket, user.username].join(' ')
        }
    }))
    wf.feedback();
  }).catch(wf.error.bind(wf))
}