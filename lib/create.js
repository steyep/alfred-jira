const Jira = require('./jira');
const Workflow = require('./workflow');
const fs = require('fs');

let wf = new Workflow();

module.exports = (query) => {
  query = query.split(wf._sep).map(s => s.trim());
  
  let summary = query.pop() || '';
  let projectKey = query.pop() || '';
  let context = query.pop() || '';
  let issueType = 'Bug';

  wf.default({ 
    title: 'Create ' + issueType, 
    valid: false, 
    autocomplete: query.concat(context).join(wf._sep) + wf._sep,
    icon: issueType + '.png'
  });

  // Return a preview of the summary string that will be sent to JIRA
  // Pressing enter will POST issue to JIRA
  if (summary.trim()) {
    wf.addItem({
      title: summary.replace(/'/g, "\\'"),
      subtitle: projectKey + ' -> ' + issueType,
      valid: true,
      icon: issueType + '.png',
      arg: ['createIssue', issueType, projectKey, summary.replace(/'/g, "\\'")].join(' ')
    })
  }

  wf.feedback();
}