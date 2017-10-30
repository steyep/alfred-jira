const Jira = require('./jira');
const Workflow = require('./workflow');
const config = require('./jira/config');

let wf = new Workflow();
let enabledItems = config.menuItems;
let options = Jira.getOptions();

if (options['enabled_menu_items']) {
  enabledItems = options['enabled_menu_items'];
}

module.exports = {

  format: function (issues) {
    let self = this;
    issues = issues
      .map(issue => ({
        title: issue.Key,
        subtitle: issue.Summary,
        valid: false,
        autocomplete: wf.path('tickets', issue.Key),
        data: self.getTicket(issue),
        projectIcon: issue.Key.replace(/-.*$/, '') + '.png',
        cmdMod: {
          subtitle: 'Open issue in browser',
          arg: `openIssue ${issue.Key}`
        }
      }));

    return issues;
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
      wfId: 'progress',
      cmdMod: startProgress ? null : {
        subtitle: 'Stop progress without logging time',
        arg: `clearProgress ${ticket.Key}`
      }
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
      autocomplete: wf.path('assign', ticket.Key),
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
        autocomplete: wf.path('status', ticket.Key),
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
      autocomplete: wf.path('comment', ticket.Key),
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
  }

}