process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const iconPath = process.cwd() + '/resources/icons/';
const cfgPath = process.env.HOME + '/.alfred-jira/';
module.exports = {
  cfgPath: cfgPath,
  cfgFile: 'config.json',
  cacheFile: 'cache.json',
  iconPath: iconPath,
  userIconPath: './resources/user_icons/',
  projectIconPath: './resources/project_icons/',
  priorityIconPath: './resources/priority_icons/',
  plistFile: process.env.HOME + '/Library/LaunchAgents/com.alfred-jira.helper.plist',
  plistFileLog: cfgPath + 'alfred-jira.log',
  plistFileErr: cfgPath + 'alfred-jira_err.log',
  menuItems: [
    { name: 'summary', enabled: true },
    { name: 'description', enabled: true },
    { name: 'progress', enabled: true },
    { name: 'assignee', enabled: true },
    { name: 'status', enabled: true },
    { name: 'comment', enabled: true },
    { name: 'watch', enabled: true },
    { name: 'priority', enabled: true },
  ],
  url: '',
  user: '',
  projects: [],
  options: {},
  sort: [
    { name: 'Priority', desc: true },
    { name: 'Key', desc: true },
  ],
  'bookmarks': [
    {
      name: 'My Tickets',
      query: 'assignee=currentUser()',
      cache: 900000,
      sort: [
        { name: 'Priority', desc: true },
        { name: 'Key', desc: true },
      ],
      limitProjects: true,
      limitStatuses: true,
      icon: iconPath + 'inbox.png',
    },
    {
      name: 'Watched Issues',
      query: 'issueKey IN watchedIssues()',
      cache: 900000,
      sort: [
        { name: 'Priority', desc: true },
        { name: 'Key', desc: true },
      ],
      limitProjects: true,
      limitStatuses: true,
      icon: iconPath + 'watched.png',
    },
  ],
};
