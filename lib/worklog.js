const Jira = require('./jira');
const Workflow = require('./workflow');
const issues = require('./issues');

let wf = new Workflow();

module.exports = {
  inProgress: function(query) {
    query = query.split(wf._sep).map(s => s.trim());
    let search = query.pop() || '';
    let ticket = query.pop() || '';
    let self = this;
    Jira.inProgressInfo(ticket).then(res => {
      wf.addItems(
        issues.getTicket(res)
          .filter(issue => new RegExp(search, 'i').test(issue.wfId)));
      wf.feedback();
    }).catch(wf.error.bind(wf));
  },
};