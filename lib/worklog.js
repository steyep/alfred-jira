const Jira = require('./jira');
const Workflow = require('./workflow');
const ls = require('./listTickets');

let wf = new Workflow();

module.exports = {
  inProgress: function(query) {
    query = query.split(wf._sep).map(s => s.trim()).filter(String);
    var ticket = query.pop() || '';
    let self = this;
    Jira.search(ticket).then(res => {
      wf.addItems(ls.getTicket(res[0]))
      wf.feedback()
    }).catch(wf.error.bind(wf));
  }
};