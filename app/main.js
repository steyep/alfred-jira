const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require('fs');
const sh = require('child_process');
const path = require('path');
const jira = require('../lib/jira');
const config = require('../lib/jira/config');
const Extras = require('../lib/jira/grab-images');
const cwd = process.cwd();

let win = null;
const icon = `${cwd}/icon.png`;
const package = fs.readFileSync(`${cwd}/package.json`, 'utf-8');
const appDetails = JSON.parse(package);
const appName = appDetails.name.replace(/([a-z])([a-z]+)/g, (a,b,c) => b.toUpperCase() + c);
const version = appDetails.version;
const loginOnly = process.argv[2] == 'login';
const update = process.argv[2] == 'update';
const tmp = {
  dir: process.env.TMPDIR || config.cfgPath,
  prefix: 'bookmark',
};

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
    show: false,
    titleBarStyle: 'hidden'
  });
  win.loadURL(`file://${__dirname}/index.html`);
  // win.webContents.openDevTools();
  
  // Open links in browser (not Electron)
  win.webContents.on('new-window', (event, requestedURL) => {
    event.preventDefault();
    sh.exec('open ' + requestedURL, err => {
      if (err) throw err;
    });
  })

  win.once('ready-to-show', () => {
    if (update) {
      win.focus();
      dialog.showMessageBox({
        type: 'question',
        message: 'Your workflow has been updated!',
        detail: 'In order for the changes to take effect, you may need to restart Alfred.',
        title: app.getName(),
        icon: icon,
        buttons: ['Restart','Later'],
        cancelId: 1
      }, res => {
        if (res === 0) {
          process.stdout.write(res.toString());
        }
        app.quit();
      });
    } else {
      win.show();
    }
  });

  app.on('before-quit', () => {
    // Clean up after ourselves. 
    sh.execSync(`rm ${path.join(tmp.dir, tmp.prefix)}*png`);
  });
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

ipcMain.on('logout', event => {
  let window = BrowserWindow.fromWebContents(event.sender);
  dialog.showMessageBox(window, {
    type: 'warning',
    message: `This will remove all settings associated with ${app.getName()}`,
    detail: 'Are you sure you want to continue?',
    title: app.getName(),
    icon: icon,
    buttons: ['OK','Cancel'],
    cancelId: 1
  }, res => {
    if (res === 0) {
      jira.clearSettings();
      event.sender.send('close-client', 1);
    }
  });
})

ipcMain.on('clearCache', event => {
  jira.clearCache().then(res => {
    dialog.showMessageBox(BrowserWindow.fromWebContents(event.sender), {
      type: 'info',
      message: 'Cache cleared!',
      title: app.getName(),
      icon: icon
    })
  })
})

ipcMain.on('download-imgs', (event, type) => {
  Extras(type, () => {
    event.sender.send('download-complete', type);
  });
});

ipcMain.on('get-bookmark-icon', (event, index) => {
  let window = BrowserWindow.fromWebContents(event.sender);
  dialog.showOpenDialog(window, {
    title: app.getName(),
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
  }, res => {
    if (res) {
      res = res[0];
      let parsedPath = path.parse(res);
      let dest = path.join(tmp.dir, parsedPath.base);
      let tmpFile = path.join(tmp.dir + tmp.prefix) + new Date().getTime() + '.png';
      sh.exec(`qlmanage -t -s 48 -o "${tmp.dir}" "${res}" 1>&2
        test -f "${dest}.png" && mv "${dest}.png" "${tmpFile}"`,
      err => {
        if (err) throw err;
        event.sender.send('set-bookmark-icon', tmpFile);
      })
    }
  })
});