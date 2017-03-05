const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require('fs');
const jira = require('../lib/jira');
const config = require('../lib/jira/config');
const cwd = process.cwd();

let win = null;
const icon = `${cwd}/icon.png`;
const package = fs.readFileSync(`${cwd}/package.json`, 'utf-8');
const appDetails = JSON.parse(package);
const appName = appDetails.name.replace(/([a-z])([a-z]+)/g, (a,b,c) => b.toUpperCase() + c);
const version = appDetails.version;
const loginOnly = process.argv[2] == 'login';

global['login-only'] = loginOnly;
global['app-name'] = appName;
global['version'] = version;
global['icon'] = icon;

const shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

if (shouldQuit) {
  app.quit();
  return;
}

// Prevent launching the app from CLI when not logged-in. 
if (!jira.checkConfig() && !loginOnly) {
  console.log('You need to authenticate through the workflow');
  return app.quit();
}

app.on('ready', function(){
  win = new BrowserWindow({
    width: 1045,
    height: 680,
    minWidth: 820,
    minHeight: 440,
    show: false
  });
  win.loadURL(`file://${__dirname}/index.html`);
  // win.webContents.openDevTools();
  win.once('ready-to-show', win.show);
})

app.setName(appName);
app.dock.setIcon(icon);

ipcMain.on('get-option', (event, option) => {
  if (!loginOnly) {
    if (option == 'enabled_menu_items') {
      event.sender.send('set-option', option, config.menuItems);
    } else {
      let method;
      switch(option){
        case 'available_issues_statuses':
          method = jira.getStatuses.bind(jira);
          break;
        case 'available_projects':
          method = jira.getProjects.bind(jira);
          break;
      }
      method().then(data => {
        if (data)
          event.sender.send('set-option', option, data);
      }).catch(console.error)
    }
  }
});

ipcMain.on('close', app.quit);

ipcMain.on('save-changes', (event, cb) => {
  let window = BrowserWindow.fromWebContents(event.sender);
  dialog.showMessageBox(window, {
    type: 'question',
    message: 'Save changes before you quit?',
    title: app.getName(),
    icon: icon,
    buttons: ['Yes','No','Cancel'],
    cancelId: 2
  }, res => {
    event.sender.send('close-client', res);
  });
});

ipcMain.on('credentials-saved', (event, response) => { 
  process.stderr.write(JSON.stringify(response));
  app.quit();
});