const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const storage = require('node-persist');
const log = require('../alfred-log');

storage.initSync({
  dir: config.cfgPath,
});

const createIssue = fields => {
  // POST the query to JIRA to create the issue.
  return new Promise((resolve, reject) => {
    request.post(config.url + 'rest/api/2/issue', { fields }, config.req)
      .then(res => {
        if (res.status === 201) {
          resolve(res.data.key);
        }
      })
      .catch(err => {
        err = err.response;
        if (err.status === 400) {
          let errors = err.data.errors;
          // Issue creation can fail if we tried to set a field that Jira isn't expecting.
          // We can check the errors to see if that's what happened, remove the unexpected
          // field(s) and then try to create the issue again.
          for (let key in errors) {
            let message = errors[key];
            if (new RegExp(`Field '${key}' cannot be set.`, '').test(message) && fields[key]) {
              delete fields[key];
            }
            else {
              // The request failed for some other reason.
              return reject(errors);
            }
          }
          // Try again.
          resolve(createIssue(fields));
        }
      });
  });
};

module.exports = function () {
  let issueConfig = storage.getItemSync('create-config');
  let errors = [];
  return new Promise((resolve, reject) => {
    if (!issueConfig) {
      reject('Unable to create issue: no issue defined.');
    }

    // Required fields.
    let required = ['project', 'summary', 'issuetype'];

    for (let key of required) {
      if (issueConfig[key]) {
        continue;
      }
      errors.push(`Missing required field: "${key}"`);
    }
    if (errors.length) {
      reject(errors.join('\n'));
    }

    let assignee = issueConfig.assignee ? { name: issueConfig.assignee } : null;
    let summary = issueConfig.summary;
    let description = issueConfig.description || null;
    let reporter = { name: config.user };
    let project = { key: issueConfig.project };
    let issuetype = { name: issueConfig.issuetype };

    resolve(createIssue({ assignee, summary, reporter, project, issuetype }));
  });
};
