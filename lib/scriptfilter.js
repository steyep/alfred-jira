
// Install npm dependencies if they're missing.
process.on('uncaughtException', function (error) {
  const sh = require('./alfred-exec');
  console.error(error);
  if (error.code === 'MODULE_NOT_FOUND') {
    let feedback = '<?xml version="1.0"?><items><item valid="no"><title>%s</title></item></items>';
    console.log(feedback, 'Installing npm dependencies...');
    sh.spawn('npm', ['install'], { detached: true, stdio: 'ignore' }).unref();
  }
});

const Jira = require('./jira');
const Workflow = require('./workflow');
const list = require('./listTickets');
const settings = require('./settings');
const assign = require('./assign');
const comment = require('./comment');
const status = require('./status');
const worklog = require('./worklog');
const extendedMenu = require('./extendedMenu'); 

let wf = new Workflow();
let actions = wf.actionHandler;
let query = process.argv.slice(2)[0];

actions.onAction('tickets', list.menu.bind(list));
actions.onAction('settings', settings.menu.bind(settings));
actions.onAction('search', list.getSearchString.bind(list));
actions.onAction('assign', assign);
actions.onAction('comment', comment);
actions.onAction('status', status);
actions.onAction('in-progress', worklog.inProgress.bind(worklog));

actions.onAction('mainMenu', query => {
  query = query.trim();
  let search = { title: 'Search Jira', valid: false, autocomplete: wf._sep + 'search ' + wf._sep + ' ' + query, icon: 'search.png' };
  if (Jira.checkConfig()) {
    // Kick off background process
    Jira.fetchData();
    wf.default(search);

    // Include "in-progress" tickets for easy access
    let inProgress = Jira.listInProgress();
    if (inProgress) {
      wf.addItems(inProgress
        .map(issue => {
          return {
            title: issue.id + ' (In Progress)',
            subtitle: issue.runTime,
            valid: false,
            autocomplete: wf._sep + 'in-progress ' + wf._sep + issue.id + ' ' + wf._sep,
            projectIcon: issue.id.replace(/-.*$/, '') + '.png',
            cmdMod: {
              subtitle: 'Stop progress without logging time',
              arg: `clearProgress ${issue.id}`
            }
          }
        }))
    }
    
    let bookmarks = Jira.getBookmarks().map((s,p) => {
      return {
        title: s.name,
        valid: false,
        autocomplete: wf._sep + `bookmark-${p} ` + wf._sep,
        bookmarkIcon: s.icon || 'bookmark.png',
      }
    });

    wf.addItems(bookmarks.concat([
      search,
      { title: 'Settings', valid: false, autocomplete: wf._sep + 'settings ' + wf._sep, icon: 'config.png' }
    ]));
    
    // Before performing a search, 
    // check the user's bookmarks for the query
    if (query) {
      wf.items = [];
      Jira.getAllBookmarks()
        .then(vals => {
          let result = {};
          [].concat(...vals).forEach( s => result[s.Key] = s)
          list.formatTickets(Object.values(result), query, wf);
        }).catch( err => wf.error(err, 'Check the syntax of your bookmarks.'));
    } else {
      wf.feedback();
      wf.storage.clear();
    }
  } else {
    wf.addItem({
      title: 'Login',
      valid: true, 
      arg: 'login',
      icon: 'login.png'
    })
    wf.feedback();
  }
});

switch(true) {
  case extendedMenu.reserved(query):
    break;
  case /tickets/.test(query):
  case /bookmark-\d+/.test(query):
    actions.handle('tickets', query)
    break;
  case /search/.test(query):
    actions.handle('search', query);
    break;
  case /settings/.test(query):
    actions.handle('settings', query);
    break;
  case /assign/.test(query):
    actions.handle('assign', query);
    break;
  case /comment/.test(query):
    actions.handle('comment', query);
    break;
  case /status/.test(query):
    actions.handle('status', query);
    break;
  case /in-progress/.test(query):
    actions.handle('in-progress', query);
    break;
  default: 
    actions.handle('mainMenu', query);
};
