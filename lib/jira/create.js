const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const storage = require('node-persist');

storage.initSync({
  dir: config.cfgPath
});


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
      if (issueConfig[key]) continue;
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

    let fields = { assignee, summary, reporter, project, issuetype };

    // POST the query to JIRA to create the issue.
    request
      .post(config.url + `rest/api/2/issue`, { fields }, config.req)
      .then(res => {
        if (res.status === 201) {
          resolve(res.data.key);
        }
        reject(res.statusText);
      })
      .catch(reject);

  });
}