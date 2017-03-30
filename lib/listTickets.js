const Jira = require('./jira');
const Workflow = require('./workflow');
const fs = require('fs');
const config = require('./jira/config');
let wf = new Workflow();
let enabledItems = config.menuItems;

let options = Jira.getOptions();
if (options['enabled_menu_items']) {
  enabledItems = options['enabled_menu_items'];
}

module.exports = {
  formatTickets: function (tickets, query, workflow) {
    let self = this;
    workflow.addItems(
      tickets
        .filter(s => 
          new RegExp(':"[^"]*' + query + '[^"]*"', 'i')
            .test(JSON.stringify(s).replace(/\\"/g,'')))
        .map(
        ticket => {
          return {
            title: ticket.Key,
            subtitle: ticket.Summary,
            valid: false,
            autocomplete: wf._sep + 'tickets ' + wf._sep + ticket.Key + ' ' + wf._sep,
            data: self.getTicket(ticket),
            projectIcon: ticket.Key.replace(/-.*$/, '') + '.png'
          };
        }));
    return workflow.feedback();
  },

  myTickets: function (bmConfig, query) {
    let self = this;
    Jira.listAll(bmConfig).then( tickets => {
      self.formatTickets(tickets, query, wf);
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
      self.formatTickets(tickets, search, wf);
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
        icon: 'search.png'
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

  getTicket: function (ticket) {
    ticket = ticket || {};
    let menu = [];

    // Summary
    if (ticket.Summary) {
      let url = ticket.URL || null
      menu.push({ 
        title: ticket.Summary, 
        valid: url !== null, 
        arg:'openURL ' + url, 
        icon: 'title.png',
        wfId: 'summary'
      });
    }

    // Description
    if (ticket.Description) {
      menu.push({ 
        title: ticket.Description, 
        valid: false, 
        icon: 'description.png',
        wfId: 'description'
      })
    }

    // Progress
    let progress = Jira.getProgress(ticket.Key);
    let startProgress = progress === false;
    menu.push({
      title: startProgress ? 'Start Progress' : `Stop Progress (${progress})`,
      arg: startProgress ? `startProgress ${ticket.Key}` : `stopProgress ${ticket.Key}`,
      valid: true,
      icon: startProgress ? 'play.png' : 'stop.png',
      wfId: 'progress'
    })

    // Assignee
    let assignee = ticket.Assignee || 'Unassigned';
    menu.push({ 
      title: 'Assigned: ' + assignee, 
      valid: false, 
      userIcon: assignee.replace(/[^a-z0-9]/gi,'_') + '.png', 
      data: {
        '_key': ticket.Key + '-assign', 
        currentAssignee: assignee 
      }, 
      autocomplete: wf._sep + 'assign ' + wf._sep + ticket.Key + ' ' + wf._sep,
      wfId: 'assignee'
    });

    // Status
    if (ticket.Status) {
      menu.push({
        title: 'Status: ' + ticket.Status, 
        valid: false, 
        icon: ticket.StatCategory + '.png',
        data: { 
          '_key': ticket.Key + '-status'
        }, 
        autocomplete: wf._sep + 'status ' + wf._sep + ticket.Key + ' ' + wf._sep,
        wfId: 'status'
      });
    }

    // Comment
    menu.push({
      title: 'Add a comment', 
      valid: false, 
      icon: 'comment.png',
      data: { 
        '_key': ticket.Key + '-comment'
      },
      autocomplete: wf._sep + 'comment ' + wf._sep + ticket.Key + ' ' + wf._sep,
      wfId: 'comment'
    });

    // Watch
    if (ticket.Watching !== undefined) {
      menu.push({
        title: ticket.Watching ? 'Stop watching this issue' : 'Start watching this issue',
        valid: true,
        icon: ticket.Watching ? 'watch.png' : 'unwatch.png',
        arg: `toggleWatch ${ticket.Key} ${ticket.Watching}`,
        wfId: 'watch'
      });
    }

    // Priority
    if (ticket.Priority) {
      menu.push({
        title: ticket.Priority, 
        valid: false, 
        priorityIcon: ticket.Priority + '.png',
        wfId: 'priority'
      });
    }
    return menu.filter(issue => enabledItems.includes(issue.wfId));
  },

  menu: function (query) {
    query = query.split(wf._sep).map(s => s.trim());
    if (query.length < 3) return wf.actionHandler.handle('mainMenu', query)
    var search = query.pop() || '';
    var context = query.pop() || '';
    wf.default({ 
      title: search.trim() ? 'No tickets found matching: ' + search : 'Your ticket queue is empty',
      valid: false,
      icon: 'inbox.png'
    })
    if (/bookmark/.test(context)) {
      this.myTickets(context, search);
    } else {
      wf.addItems(wf.storage.get(context).filter(s => new RegExp(search, 'i').test(s.wfId)));
      wf.feedback();
    }
  }
}
