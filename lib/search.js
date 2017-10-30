var Jira = require('./jira');
var Workflow = require('./workflow');
var log = require('./alfred-log');
var issues = require('./issues');

var wf = new Workflow();
var actions = wf.actionHandler;
let storage = wf.storage;
const Trim = str => str ? str.trim() : '';

const Search = {
  context: null,
  search: '',
  items: [],
  default: null,

  feedback: function () {
    wf.default(this.default);
    wf.addItems(this.items);
    wf.feedback();
  },

  mainMenu: function() {
    let items = [{
      title: `Search Jira for: "${this.search}"`,
      autocomplete: wf.path('search', this.search),
      valid: false,
      icon: 'search.png'
    }];

    this.items = items;
    this.feedback();
  },

  searchJira: function() {
    let self = this;
    Jira.search(self.context)
      .then(res => {
        storage.set('search-' + self.context, issues.format(res));
        self.searchResults();
      });
  },

  searchResults: function() {
    let autocomplete = this.search ? wf.path('search', this.context) : wf.path('search');
    this.default = {
      title: `No issues found for "${this.context}"`,
      valid: false,
      autocomplete: autocomplete,
      icon: 'warning.png'
    }

    let cache = storage.get('search-' + this.context);

    if (!cache) {
      return this.searchJira();
    }

    this.items = cache.filter(result =>
      new RegExp(':"[^"]*' + this.search + '[^"]*"', 'i')
      .test(JSON.stringify(result).replace(/\\"/g,''))
    );

    this.feedback();
  },

  run: function (query) {
    query = query.split(wf._sep);

    // Allows user to search for issues containing "login problem"
    // by typing "jira search login problem" in Alfred.
    if (query.length == 1) {
      query = query[0].match(/(\bsearch\b)(.*)/) || [];
    }

    let [context, search] = query.map(Trim).slice(-2);

    this.context = context || '';
    this.search = search || '';

    // If there is not context just pass control back to the mainMenu.
    if (!this.context) {
      return actions.handle('mainMenu', query.join(wf._sep));
    }

    switch (this.context) {
      case 'search':
        actions.onAction('main', this.mainMenu.bind(this));
        actions.handle('main');
        break;

      default:
        actions.onAction('searchJira', this.searchResults.bind(this));
        actions.handle('searchJira');
    }
  }

};

module.exports = function (query) {
  Search.run(query);
}