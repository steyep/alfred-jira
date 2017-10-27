const Jira = require('./jira');
const Workflow = require('./workflow');
const issues = require('./issues');
let wf = new Workflow();

module.exports = {
  formatTickets: function (tickets, query, workflow) {
    let self = this;

    let items = issues
      .format(tickets)
      .filter(s => new RegExp(':"[^"]*' + query + '[^"]*"', 'i').test(JSON.stringify(s).replace(/\\"/g,'')));

    workflow.addItems(items);

    return workflow.feedback();
  },

  myTickets: function (bmConfig, query) {
    let self = this;
    Jira.listAll(bmConfig).then( tickets => {
      self.formatTickets(tickets, query, wf);
    }).catch(wf.error.bind(wf));
  },

  users: query => {
    Jira.getUsers().then(users => {
      wf.addItems(
        users
          .filter(s => new RegExp(query,'i').test(s.name))
          .map( user => {
            return {
              title: user.name,
              valid: false
            };
          }));
      return wf.feedback();
    });
  },

  menu: function (query) {
    query = query.split(wf._sep).map(s => s.trim());
    if (query.length < 3) return wf.actionHandler.handle('mainMenu', query)
    var search = query.pop() || '';
    var context = query.pop() || '';
    wf.default({ 
      title: search.trim() ? 'No tickets found matching: ' + search : 'Your ticket queue is empty',
      valid: false,
      icon: 'inbox.png'
    })
    if (/bookmark/.test(context)) {
      this.myTickets(context, search);
    } else {
      wf.addItems(wf.storage.get(context).filter(s => new RegExp(search, 'i').test(s.wfId)));
      wf.feedback();
    }
  }
}
