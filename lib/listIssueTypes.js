const Jira = require('./jira');
const Workflow = require('./workflow');
const fs = require('fs');
const config = require('./jira/config');
let wf = new Workflow();
let issueTypes = ["Bug", "Epic", "任务", "改进", "Test"];

module.exports = {

  menu: function (query) {
    query = query.split(wf._sep).map(s => s.trim());

    if (query.length < 3) return wf.actionHandler.handle('mainMenu', query)
    var search = query.pop() || '';
    var projectName = query.pop() || '';
    var context = query.pop() || '';
    if (context == 'project') {
      wf.addItems(
        issueTypes
        .filter(s => new RegExp(search,'i').test(s))
        .map(
          type => {
            return {
              title: type,
              //subtitle: ticket.Summary,
              valid: false,
              autocomplete: wf._sep + "create" + wf._sep + projectName + wf._sep + type + wf._sep,
              icon: 'project.png'
            };
        }));
    }
    wf.feedback();
  }
}
