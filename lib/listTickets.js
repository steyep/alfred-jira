const Jira = require('./jira');
const Workflow = require('./workflow');

let wf = new Workflow();

let ProjectIcon = project => {
  const fs = require('fs');
  let def = './resources/icons/default.png';
  let iconPath = './resources/project_icons/';
  if (!fs.existsSync(iconPath)) {
    return def;
  }
  let icon = iconPath + project + '.png';
  return fs.existsSync(icon) ? icon : def;
}

module.exports = {
  formatTickets: function (tickets, query) {
    let self = this;
    wf.addItems(
      tickets
        .filter(s => new RegExp(query,'i').test(s.Key))
        .map(
        ticket => {
          return {
            title: ticket.Key,
            subtitle: ticket.Summary,
            valid: false,
            autocomplete: wf._sep + 'tickets ' + wf._sep + ticket.Key + ' ' + wf._sep,
            data: self.getTicket(ticket),
            icon: ProjectIcon(ticket.Key.replace(/-.*$/, ''))
          };
        }));
    return wf.feedback();
  },

  myTickets: function (query) {
    let self = this;
    Jira.listAll().then( tickets => {
      self.formatTickets(tickets, query);
    }).catch(wf.error.bind(wf));
  },

  issuesByStatus: function (query) {
    let status = 'Ready for CR';
    wf.default({ title: 'No recent tickets found with status: ' + status, valid: false });
    query = query.split(wf._sep).map(s => s.trim());
    if (query.length < 3) return wf.actionHandler.handle('mainMenu', query)
    let search = query.pop() || '';
    let context = query.pop() || '';
    let self = this;
    Jira.listByStatus(status).then( tickets => {
      self.formatTickets(tickets, search);
    }).catch(wf.error.bind(wf));
  },

  search: function(context, search) {
    wf.default({ 
      title: 'No results found for: "' + context + '"', 
      valid: false, 
      autocomplete: wf._sep + 'search ' + wf._sep 
    });
    let self = this;
    Jira.search(context).then(tickets => {
      self.formatTickets(tickets, search);
    }).catch(wf.error.bind(wf));
  },

  watchedIssues: function(query) {
    query = query.split(wf._sep).map(s => s.trim());
    if (query.length < 3) return wf.actionHandler.handle('mainMenu', query)
    let search = query.pop() || '';
    let context = query.pop() || '';
    let self = this;
    wf.default({ 
      title: search.trim() ? "You aren't watching any issues matching: " + search : "You aren't watching any issues",
      valid: false,
      icon: './resources/icons/inbox.png'
    })
    Jira.listWatched().then( tickets => {
      self.formatTickets(tickets, search);
    }).catch(wf.error.bind(wf));
  },

  getSearchString: function(query) {
    query = query.split(wf._sep).map(s => s.trim());
    if (query.length < 3) return wf.actionHandler.handle('mainMenu', query)
    let search = query.pop() || '';
    let context = query.pop() || '';
    if (context == 'search') {
      wf.addItem({
        title: 'Search Jira for: "' + search + '"',
        valid: false,
        autocomplete: wf._sep + 'search ' + wf._sep + search + ' ' + wf._sep,
        icon: './resources/icons/search.png'
      });
      wf.feedback()
    } else {
      this.search(context, search);
    }
  },

  users: query => {
    Jira.getUsers().then(users => {
      wf.addItems(
        users
          .filter(s => new RegExp(query,'i').test(s.name))
          .map( user => {
            return {
              title: user.name,
              valid: false
            };
          }));
      return wf.feedback();
    });
  },

  getTicket: ticket => {
    ticket = ticket || {};
    summary = ticket.Summary || null,
    description = ticket.Description || null,
    status = ticket.Status || null,
    statusIcon = ticket.StatCategory || null,
    assignee = ticket.Assignee || 'Unassigned', 
    priority = ticket.Priority || null,
    watched = ticket.Watching === undefined ? null : ticket.Watching,
    url = ticket.URL;
    let watch = ticket.Watching === undefined ? '' :
      {
        title: ticket.Watching ? 'Stop watching this issue' : 'Start watching this issue',
        valid: true,
        icon: ticket.Watching ? './resources/icons/watch.png' : './resources/icons/unwatch.png',
        arg: 'toggleWatch ' + ticket.Key + ' ' + ticket.Watching
      };
    return [
      { title: summary, valid: false, valid: true, arg:'openURL ' + url, icon: './resources/icons/title.png'},
      { title: 'Assigned: ' + assignee, valid: false, icon: './resources/icons/assigned.png', 
        data: {'_key': ticket.Key + '-assign', currentAssignee: assignee }, 
        autocomplete: wf._sep + 'assign ' + wf._sep + ticket.Key + ' ' + wf._sep },
      { title: 'Status: ' + status, valid: false, icon: './resources/icons/' + statusIcon + '.png',
        data: { '_key': ticket.Key + '-status'}, autocomplete: wf._sep + 'status ' + wf._sep + ticket.Key + ' ' + wf._sep},
      { title: 'Add a comment', valid: false, arg:'openURL ' + url, icon: './resources/icons/comment.png',
        data: { '_key': ticket.Key + '-comment'}, autocomplete: wf._sep + 'comment ' + wf._sep + ticket.Key + ' ' + wf._sep },
      watch,
      { title: priority, valid: false, icon: './resources/icons/' + priority + '.png' },
    ];
  },

  menu: function (query) {
    query = query.split(wf._sep).map(s => s.trim());
    if (query.length < 3) return wf.actionHandler.handle('mainMenu', query)
    var search = query.pop() || '';
    var context = query.pop() || '';
    wf.default({ 
      title: search.trim() ? 'No tickets found matching: ' + search : 'Your ticket queue is empty',
      valid: false,
      icon: './resources/icons/inbox.png'
    })
    if (context == 'tickets') {
      this.myTickets(search);
    } else {
      wf.addItems(wf.storage.get(context));
      wf.feedback();
    }
  }
}