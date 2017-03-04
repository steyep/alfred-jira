const config = require('../lib/jira/config');
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

const appName = remote.getGlobal('app-name');
const version = remote.getGlobal('version');
const icon = remote.getGlobal('icon');

let app = angular.module('alfred-jira', []);

app.controller('ctrl', ['$scope', '$timeout', ($scope, $timeout) => {
  let data = getData();

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

  $scope.save = () => {
    $scope.data.url = $scope.data.url.replace(/(.)\/*$/, '$1/');
    fs.writeFileSync(cfgFile, JSON.stringify($scope.data, null, 2));
    ipcRenderer.send('close');
  }

  // Prompt user to save before closing.
  let promptUser = 0; // Only ask once.
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
