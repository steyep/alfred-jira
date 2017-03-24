const config = require('./config');
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
}

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

  // Query cleanup
  let parensWithoutQuotes = query.match(/\([^\(\)"]+\)/g);
  if (parensWithoutQuotes) {
    parensWithoutQuotes.forEach(group => {
      if (/,/.test(group)) {
        let clean = group.split(/[\(\),]/);
        group = group.replace(/([\(\)])/g, '\\$1');
        clean = clean.map(s => s.trim()).filter(String).join('","')
        clean = `("${clean}")`
        query = query.replace(new RegExp(group, ''), clean);
      }
    });
  }
  // Replace all spaces that aren't in quotes with +
  query = query.replace(/\s+(?=((\\[\\"]|[^\\"])*"(\\[\\"]|[^\\"])*")*(\\[\\"]|[^\\"])*$)/g, '+');

  // Escape escape characters (\)
  query = query.replace(/\\/g, '\\\\');

  // Log query to help with debugging.
  console.error('Searching for query:\n%s', query);
  
  this.query = 'rest/api/2/search?jql=' + encodeURI(query);
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
      request
        .get(config.url + params.query, config.req)
        .then(function(res) {
          if (res.status != 200) {
            reject(new Error(res.statusText));
          }

          let issues = res.data.issues;
          let table = [];
          for (let i =0; i < issues.length; i++) {
            let issue = issues[i],
                fields = issue.fields;
            if (!fields.priority) {
              fields.priority = { name: '' }
            }

            if (!fields.status) {
              fields.status = { name: '' }
            }

            if (!fields.assignee) {
              fields.assignee = { displayName: '' }
            }

            if (!fields.status.statusCategory) {
              fields.status.statusCategory = { name: '' }
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
              'Watching': fields.watches.isWatching
            });
          }
          if (params.setCache) {
            cache.set(params.cacheId, table);
          }
          resolve(table);
        })
        .catch(res => {
          let err = res.response;
          console.error(err)
          if (!err) { 
            reject('Unable to receive response from: ' + 
              config.url + ' ' + '\n' + res)
          }
          if (err.status === 401) {
            auth.logout();
          }
          if (err.status === 403) {
            console.error('Too many failed login attempts: \n%s', 
              err.headers['x-authentication-denied-reason'])
          }
          reject(err.status + ': ' + err.statusText);
        })
    });
  },

  showAll: function (bookmarkConfig) {
    let id = bookmarkConfig;
    let index = bookmarkConfig.replace(/[^\d]/g, '');
    bookmarkConfig = config.bookmarks[index];
    bookmarkConfig.cacheId = id;
    return this.getIssues(new IssueRequest(bookmarkConfig));
  },

  findIssue: function(ticket){
    let req = new IssueRequest({
      cache: 0,
      query: `issueKey="${ticket}"`,
      limitStatuses: false,
      limitProjects: false
    });
    return this.getIssues(req);
  },

  search: function (query) {
    let options = config.options || {};
    let basicSearch = !options.advancedSearch;

    if (/^\w+-\d+$/.test(query.trim())) {
      return this.findIssue(query);
    }
    
    if (basicSearch) {
      query = 'summary+~+"' + query + '"'
            + '+OR+description+~+"' + query + '"'
            + '+OR+comment+~+"' + query + '"';
    }
    let req = new IssueRequest({
      query: query,
      cacheId: 'search',
      cache: 45*1000, // 45 seconds
      limitStatuses: false,
      limitProjects: false
    })
    return this.getIssues(req);
  }
};

module.exports = list;