const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const cache = require('./cache');

module.exports = function (issueType, projectKey, summary) {

  return new Promise((resolve, reject) => {
    let currentDate = new Date();
    let dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    let body = {
        fields: {
          project: { key: projectKey},
          issuetype: { name: issueType },
          summary: summary,
          priority: {name: "Medium"},
          description: summary,
          assignee: {name: config.user},
          reporter: {name: config.user},
          duedate: currentDate.getFullYear() + "-" + currentDate.getMonth() + "-" + currentDate.getDate(),
          customfield_10014: dueDate.getFullYear() + "-" + dueDate.getMonth() + "-" + dueDate.getDate()// 计划开始时间
        }
      };
    if ("任务" == issueType) {
        delete body.fields.reporter;
    }
    if ("Epic" == issueType) {
        body.fields.customfield_10003 = summary;
        delete body.fields.reporter;
        delete body.fields.assignee;
    }
    console.error(body);
    request
      .post( config.url + 'rest/api/2/issue', body, config.req)
      .then(res => {
        if (res.status != 201) {
          console.error(res);
          reject(new Error(res.statusText));
        }
        resolve(config.url + "browse/" + res.data.key);
        cache.clear();
      })
      .catch(res => {
          console.error(res.response.data.errors);
          reject(new Error(JSON.stringify( res.response.data.errors)));
      });
  });
}
