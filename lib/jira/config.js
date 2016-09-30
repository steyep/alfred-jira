process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

module.exports = {
  cfgPath: process.env.HOME + '/.alfred-jira/',
  cfgFile: 'config.json',
  cacheFile: 'cache.json',
  iconPath: './resources/icons/',
  userIconPath: './resources/user_icons/',
  projectIconPath: './resources/project_icons/',
  priorityIconPath: './resources/priority_icons/',
  url: '',
  user: '',
  projects: [],
  options: {},
};