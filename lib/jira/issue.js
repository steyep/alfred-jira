const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const cache = require('./cache');

module.exports = function (issueType, projectKey, summary) {
  return new Promise((resolve, reject) => {
    let body = { 
        fields: {
          project: { key: projectKey},
          issuetype: { name: issueType },
          summary: summary,
          assignee: {name: config.user},
          priority: {name: "Medium"},
          description: summary,
          reporter: {name: config.user}
        }
      };
    console.error(body);
    request
      .post( config.url + 'rest/api/2/issue', body, config.req)
      .then(res => {
        if (res.status != 201) {
          reject(new Error(res.statusText));
        }
        resolve('Issue added as ' + res.data.key);
        cache.clear();
      })
      .catch(reject);
  });
}