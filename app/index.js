const config = require('../lib/jira/config');
const keychain = require('../lib/jira/keychain');
const cfgFile = config.cfgPath + config.cfgFile;
const fs = require('fs');
const { ipcRenderer, remote } = require('electron');

require('angular');

const getData = () => {
  let data = {};
  if (fs.existsSync(cfgFile)) {
    data = JSON.parse(fs.readFileSync(cfgFile, 'utf-8'));
  }
  return data;
}

const ValidateOptions = (obj) => {
  ['available_projects', 'enabled_menu_items', 'available_issues_statuses'].forEach(key => {
    let options = obj[key][0];
    if (options && options.name && options.enabled !== undefined) {
      return;
    }
    ipcRenderer.send('get-option', key);
  })
}

const loginOnly = remote.getGlobal('login-only');
const appName = remote.getGlobal('app-name');
const version = remote.getGlobal('version');
const icon = remote.getGlobal('icon');

let app = angular.module('alfred-jira', []);

app.controller('ctrl', ['$scope', '$timeout', '$element', ($scope, $timeout, $element) => {
  
  // Cancel login when esc is pressed.
  $element.bind("keydown keypress", function (event) {
    if (event.key === 'Escape' || event.which === 27) {
      $timeout($scope.cancelLogin, 0);
    }
  });

  let data = getData();

  $scope.showLogin = loginOnly;
  $scope.appName = appName;
  $scope.version = version;
  $scope.icon = icon;

  $scope.data = data;
  $scope.options = data.options || {
    available_projects: [],
    enabled_menu_items: [],
    available_issues_statuses: []
  };
  ValidateOptions($scope.options);

  let protocol = ($scope.data.url || '').match(/http:\/\//);
  if ($scope.ssl === undefined) {
    $scope.ssl = !protocol;
  }

  const removeProtocol = url => (url || '').replace(/\s+|https?:\/\//gi, '');
  $scope.loginData = {
    user: $scope.data.user,
    url: $scope.data.url
  };

  $scope.$watch('loginData.url', 
    () => $scope.loginData.url = removeProtocol($scope.loginData.url));

  $scope.login = () => {
    let user = $scope.loginData.user;
    let pass = $scope.loginData.password;
    let protocol = $scope.ssl ? 'https://' : 'http://';
    $scope.data.url = protocol + $scope.loginData.url.replace(/(.)\/*$/, '$1/');

    if (user && pass && $scope.data.url) {
      let token = new Buffer(user + ':' + pass).toString('base64');
      keychain.save(token);
      delete $scope.loginData.password;
      if (loginOnly) {
        ipcRenderer.send('credentials-saved', {
          url: $scope.data.url,
          user: user
        });
      }
      $scope.showLogin = false;
    }
  }

  $scope.cancelLogin = () => {
    if (loginOnly) ipcRenderer.send('close');
    let data = getData();
    $scope.loginData.user = data.user;
    $scope.loginData.url = data.url;
    delete $scope.loginData.password;
    $scope.showLogin = false;
  }

  $scope.save = () => {
    $scope.data.url = $scope.data.url.replace(/(.)\/*$/, '$1/');
    fs.writeFileSync(cfgFile, JSON.stringify($scope.data, null, 2));
    ipcRenderer.send('close');
  }

  $scope.clearCache = () => ipcRenderer.send('clearCache');

  $scope.logout = function() {
    ipcRenderer.send('logout');
    window.onbeforeunload = undefined;
  }

  // Prompt user to save before closing.
  let promptUser = loginOnly; // Only ask once.
  window.onbeforeunload = e => {
    if (!angular.equals($scope.data, getData()) && !promptUser++) {
      e.returnValue = true;
      ipcRenderer.send('save-changes');
    } else {
      return undefined;
    }
  }

  ipcRenderer.on('set-option', (channel, key, data) => {
    data = data.map(opt => {
      opt.enabled = $scope.options[key].includes(opt.name);
      return opt;
    });
    $timeout(() => $scope.options[key] = data, 0);
  })

  ipcRenderer.on('close-client', (channel, res) => {
    // user canceled the close.
    if (res === 2) {
      promptUser = 0;
      return;
    }
    if (res === 0) $scope.save();
    ipcRenderer.send('close');
  });
}]);
