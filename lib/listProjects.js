const Jira = require('./jira');
const Workflow = require('./workflow');
const fs = require('fs');
const config = require('./jira/config');
let wf = new Workflow();
let enabledProjects = config.projects;

try {
  let settings = JSON.parse(fs.readFileSync(config.cfgPath + config.cfgFile, 'utf-8'));
  enabledProjects = settings.options['available_projects'] || config.projects;
} catch (e) {
  console.error(e);
}

module.exports = {

  menu: function (query) {
    query = query.split(wf._sep).map(s => s.trim());

    if (query.length < 3) return wf.actionHandler.handle('mainMenu', query)
    var search = query.pop() || '';
    var context = query.pop() || '';
    wf.default({
      title: search.trim() ? 'No projects found matching: ' + search : 'Your projects queue is empty',
      valid: false,
      icon: 'inbox.png'
    })
    if (context == 'create issue') {
      wf.addItems(
        enabledProjects
        .filter(s => new RegExp(search,'i').test(s))
        .map(
          project => {
            return {
              title: project,
              //subtitle: ticket.Summary,
              valid: false,
              autocomplete: wf._sep + 'project' + wf._sep + project + wf._sep,
              icon: 'project.png'
            };
        }));
    }
    wf.feedback();
  }
}