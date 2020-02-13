const config = require('./config');
const search = require('./search');
const auth = require('./auth');
const request = require('axios');
const cache = require('./cache');

const AvailableStatuses = () => ' AND status in ("' + config.options.available_issues_statuses.map(decodeURI).join('","') + '")';
const SearchInProjects = () => {
  let options = config.options || {},
    projects = options.available_projects || [];
  if (!projects.length) {
    return '';
  }
  return ' AND project in ("' + projects.join('","') + '")';
};

function IssueRequest(bookmark) {
  let query = (bookmark.query || '').trim();
  if (bookmark.sort) {
    query += ' order by ' + bookmark.sort.map(s => s.name + ' ' + (s.desc ? 'DESC' : 'ASC')).join(', ');
  }

  [query, sort] = query.split(/[\s\+]*order[\s\+]+by[\s\+]*/i);
 
  if (bookmark.limitProjects !== false) {
    query += SearchInProjects();
  }
  if (bookmark.limitStatuses !== false) {
    query += AvailableStatuses();
  }
  query = [query, sort].filter(Boolean).join(' order by ');
  
  this.query = query;
  var cache = bookmark.cache || 0;
  this.cacheId = bookmark.cacheId;
  this.setCache = cache > 0;
  if (this.setCache) {
    this.cacheLimit = bookmark.cache;
  }
}

let list = {

  getIssues: function(params) {
    let self = this;
    return new Promise((resolve, reject) => {
      if (params.setCache){
        let cachedData = cache.get(params.cacheId, params.cacheLimit);
        if (cachedData) {
          return resolve(cachedData);
        }
      }

      search.getIssues(params.query)
        .then(issues => {
          if (params.setCache) {
            cache.set(params.cacheId, issues);
          }
          resolve(issues);
        })
        .catch(reject);
    });
  },

  showAll: function (bookmarkConfig) {
    if (typeof bookmarkConfig == 'object') {
      bookmarkConfig.cache = 0;
    }
    else {
      let id = bookmarkConfig;
      let index = bookmarkConfig.replace(/[^\d]/g, '');
      bookmarkConfig = config.bookmarks[index];
      bookmarkConfig.cacheId = id;
    }
    return this.getIssues(new IssueRequest(bookmarkConfig));
  },

};

module.exports = list;
