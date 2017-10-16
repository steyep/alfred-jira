const Jira = require('./lib/jira');
Jira.getIssueTypes('FPMOD').then(console.log)