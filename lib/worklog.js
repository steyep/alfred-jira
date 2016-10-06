const Jira = require('./jira');
const Workflow = require('./workflow');
const ls = require('./listTickets');

let wf = new Workflow();

module.exports = {
  inProgress: function(query) {
    query = query.split(wf._sep).map(s => s.trim());
    let search = query.pop() || '';
    let ticket = query.pop() || '';
    let self = this;
    Jira.inProgressInfo(ticket).then(res => {
      wf.addItems(ls.getTicket(res))
      wf.feedback()
    }).catch(wf.error.bind(wf));
  }
};