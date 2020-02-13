const config = require('./config');
const auth = require('./auth');
const request = require('axios');
const log = require('../alfred-log');

module.exports = {
  getIssues: function(query) {
    let self = this;
    return new Promise((resolve, reject) => {

      // Escape escape characters (\)
      query = query.replace(/\\/g, '\\\\');

      query = encodeURIComponent(query);

      request
        .get(config.url + 'rest/api/2/search?jql=' + query, config.req)
        .then(function(res) {

          let issues = res.data.issues;

          let table = [];
          for (let i =0; i < issues.length; i++) {
            let issue = issues[i],
              fields = issue.fields;
            if (!fields.priority) {
              fields.priority = { name: '' };
            }

            if (!fields.status) {
              fields.status = { name: '' };
            }

            if (!fields.assignee) {
              fields.assignee = { displayName: '' };
            }

            if (!fields.status.statusCategory) {
              fields.status.statusCategory = { name: '' };
            }

            if (!fields.watches) {
              fields.watches = { isWatching: null };
            }

            table.push({
              'Key': issue.key,
              'Priority': fields.priority.name,
              'Summary': fields.summary,
              'Description': fields.description,
              'Status': fields.status.name,
              'StatCategory': fields.status.statusCategory.name,
              'Assignee': fields.assignee.displayName,
              'URL': config.url + 'browse/' + issue.key,
              'Watching': fields.watches.isWatching,
            });
          }

          resolve(table);
        })
        .catch(reject);
    });
  },

  findIssue: function(ticket){
    query = `issueKey="${ticket}"`;
    return this.getIssues(query);
  },

  search: function (query) {
    let options = config.options || {};
    let basicSearch = !options.advancedSearch;

    if (/^\w+-\d+$/.test(query.trim())) {
      return this.findIssue(query);
    }

    if (basicSearch) {
      let ignoredWords = ['a', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 's', 'such', 't', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'];
      ignoredWords = ignoredWords.filter(word => new RegExp('\\b' + word + '\\b', 'i').test(query));
      if (ignoredWords.length) {
        log('Warning: Your query contains the following reserved word(s). Unfortunately, they will be ignored by JIRA:\n'
          + '"' + ignoredWords.join(', ') + '"\n'
          + 'For more information: https://confluence.atlassian.com/jirasoftwareserver075/search-syntax-for-text-fields-935562918.html#Searchsyntaxfortextfields-reserved');
      }

      query = `summary ~ "${query}*"`
            + ` OR description ~ "${query}*"`
            + ` OR comment ~ "${query}*"`;
    }
    return this.getIssues(query);
  },
};
