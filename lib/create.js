var Jira = require('./jira');
var Workflow = require('./workflow');
var log = require('./alfred-log');
var config = require('./jira/config');
var wf = new Workflow();
let storage = wf.storage;

let options = Jira.getOptions();

let projects = options.available_projects || [];

let defaults = options.create_issue_defaults || { assignee: config.user };

const feedback = (items, data) => {
  wf.addItems(items);
  wf.feedback();
  storage.set('create-config', data);
}

const Trim = str => str.trim();

module.exports = query => {
  let context = query.split(wf._sep);
  let search = context.pop() || '';

  context = context.map(Trim).filter(String);

  let issueConfig = storage.get('create-config') || {
    summary: '',
    assignee: defaults.assignee || '',
    project: defaults.project || '',
    issuetype: defaults.issuetype || ''
  };

  for (var key of ['project', 'assignee', 'issuetype']) {
    let projectIndex = context.findIndex(s => s.trim() == key);
    if (projectIndex > -1 && projectIndex < context.length - 2) {
      // Set Project
      issueConfig[key] = context[projectIndex + 1];
      // Remove it from the path.
      context.splice(projectIndex, 2);
    }
  }

  switch((context[context.length-1] || '').trim()) {
    case 'project':
      projects = projects
        .filter(s => new RegExp(search, 'i').test(s))
        .map(project => ({
          title: project,
          valid: false,
          autocomplete: wf.path(...context, project, 'create') + issueConfig.summary,
          projectIcon: project + '.png'
        }));

      feedback(projects, issueConfig);
      break;

    case 'assignee':
      Jira.getUsers().then(users => {
        users = users
          .filter(s => new RegExp(search, 'i').test(s.name))
          .sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
          .map(user => ({
            title: user.name,
            valid: false,
            userIcon: user.name.replace(/[^a-z0-9]/gi,'_') + '.png',
            autocomplete: wf.path(...context, user.username, 'create') + issueConfig.summary,
          }));

          feedback(users, issueConfig);
      });
      break;

    case 'issuetype':
      Jira.getIssueTypes(issueConfig.project).then(types => {
        types = types
          .filter(s => new RegExp(search, 'i').test(s.name))
          .map(type => ({
            title: type.name,
            valid: false,
            autocomplete: wf.path(...context, type.name, 'create') + issueConfig.summary,
            icon: type.name == issueConfig.issuetype ? 'label.png' : 'labeloutline.png'
          }));

          feedback(types, issueConfig);
      });
      break;

    default:
      Jira.getUsers().then(users => {
        issueConfig.summary = search.trim();

        if (!issueConfig.assignee) {
          issueConfig.assignee = config.user;
        }

        let assignee = (users.find(user => user.username == issueConfig.assignee) || { name: '' }).name;

        let menu = [{
            title: `Summary: ${issueConfig.summary}`,
            valid: false,
            autocomplete: wf.path('create') + issueConfig.summary,
            icon: 'title.png',
          },{
            title: `Assignee: ${assignee}`,
            valid: false,
            autocomplete: wf.path('create', 'assignee'),
            userIcon: assignee.replace(/[^a-z0-9]/gi,'_') + '.png',
          },{
            title: `Project: ${issueConfig.project}`,
            valid: false,
            projectIcon: `${issueConfig.project}.png`,
            autocomplete: wf.path('create', 'project'),
          },{
            title: `Issue Type: ${issueConfig.issuetype}`,
            valid: false,
            autocomplete: wf.path('create', 'issuetype'),
            icon: issueConfig.issuetype ? 'label.png' : 'labeloutline.png'
          }];

        // Show submit if all requirements have been met.
        if (issueConfig.summary && issueConfig.project && issueConfig.issuetype) {
          menu.unshift({
            title: 'Submit',
            valid: true,
            arg: 'create-issue',
            icon: 'good.png',
            subtitle: 'Press enter to create issue.',
            cmdMod: {
              subtitle: 'Press enter to create & open issue.',
              arg: 'create-issue-open'
            }
          });
        }

        feedback(menu, issueConfig);
      });

  }
}
