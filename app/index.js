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

app.controller('ctrl', ['$scope', '$timeout', '$element', '$location', '$anchorScroll', ($scope, $timeout, $element, $location, $anchorScroll) => {
  
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
    if ($scope.data.bookmarks) {
      $scope.data.bookmarks = $scope.data.bookmarks
        .map((bookmark, index) => {
          let dest = config.cfgPath + 'bookmark-' + index + '.png';
          if (bookmark.icon && bookmark.icon != dest && !/resources/.test(bookmark.icon)) {
            fs.renameSync(bookmark.icon, dest);
            bookmark.icon = dest;
          }
          return bookmark;
        });
    }
    fs.writeFile(cfgFile, JSON.stringify($scope.data, null, 2), err => {
      let text = document.body.getElementsByClassName('save')[0].lastChild.textContent;
      document.body.getElementsByClassName('save')[0].lastChild.textContent = 'SAVED!';
      setTimeout(() => {
        document.body.getElementsByClassName('save')[0].lastChild.textContent = text;
      }, 1000);
    });
  }

  $scope.clearCache = () => ipcRenderer.send('clearCache');

  $scope.logout = function() {
    ipcRenderer.send('logout');
    window.onbeforeunload = undefined;
  }

  $scope.inProgress = {};
  
  $scope.download = type => {
    ipcRenderer.send('download-imgs', type);
    $timeout(() => $scope.inProgress[type] = true, 0);
  }

  $scope.sortFields = pos => {
    return [
      'Assignee',
      'Created',
      'DueDate',
      'IssueType',
      'Key',
      'Priority',
      'Reporter',
      'Resolution',
      'Status',
      'Updated'
    ].filter(ele => {
      return ele == pos || !$scope.selectedBookmark.sort.map(s => s.name).includes(ele);
    })
  };

  const getTime = mil => {
    s = mil/1000;
    m = s/60;
    h = m/60;
    d = h/24;
    return [d,h,m,s].map((time, index) => {
      time = Math.floor(time);
      if (index) {
        time %= index === 1 ? 24 : 60;
      }
      return time ? time + ' ' + ['days','hours','minutes','seconds'][index] : 0;
    }).filter(Boolean).join(' ');
  }

  if (!$scope.data.bookmarks) {
    $scope.data.bookmarks = config.bookmarks;
  }

  // Default to 15 minute cache time.
  class Bookmark {
    constructor(obj) {
      obj = obj || {};
      this.name = obj.name || null;
      this.query = obj.query || null;
      this.cache = obj.cache || 900000;
      this.sort = obj.sort || [{ name: 'Updated', desc: true }];
      this.limitStatuses = obj.limitStatuses !== false;
      this.limitProjects = obj.limitProjects !== false;
      this.icon = obj.icon || null;
    }
  }  

  $scope.getBookmarkIcon = index => {
    if (index === undefined) {
      index = $scope.data.bookmarks.length;
    }
    ipcRenderer.send('get-bookmark-icon', index);
  }
  
  $scope.bookmarkIcon = fileName => {
    if (fileName && fs.existsSync(fileName)) {
      return fileName;
    }
    return '../resources/icons/bookmark.png';
  }

  $scope.editBookmark = (bookmark, index) => {
    $scope.bookmarkInEdit = true;
    $scope.selectedBookmarkIndex = index;
    $scope.selectedBookmark = new Bookmark(bookmark);
    $scope.selectedIcon = $scope.selectedBookmark.icon
    $scope.cacheConversion = getTime($scope.selectedBookmark.cache);
    $location.hash('bookmark-form');
    $anchorScroll();
  }

  $scope.addBookmark = bookmark => {
    if ($scope.selectedIcon != bookmark.icon) {
      bookmark.icon = $scope.selectedIcon;
    }
    if ($scope.selectedBookmarkIndex !== undefined) {
      $scope.data.bookmarks[$scope.selectedBookmarkIndex] = bookmark;
      delete $scope.selectedBookmarkIndex;
    } else {
      $scope.data.bookmarks.push(bookmark);
    }
    delete $scope.selectedIcon;
    $scope.selectedBookmark = new Bookmark();
    $scope.bookmarkInEdit = false;
  }

  $scope.deleteBookmark = index => $scope.data.bookmarks.splice(index,1);

  $scope.testBookmark = bookmark => {
    $scope.inProgress.testConfig = true;
    $scope.testSuccessful = false;
    ipcRenderer.send('test-bookmark', bookmark);
  }

  $scope.selectedBookmark = $scope.selectedBookmark || new Bookmark();

  $scope.selectAllLabel = category => !$scope.options[category].every(opt => opt.enabled) ? 'Select All' : 'Deselect All';

  $scope.selectAll = category => {
    let enabled = $scope.selectAllLabel(category) == 'Select All';

    $scope.options[category].map(opt => {
      opt.enabled = enabled;
      return opt;
    });
  }

  $scope.$watch("selectedBookmark.cache",
    val => $scope.cacheConversion = getTime(val));

  $scope.$watch("selectedBookmark.query", val => { 
      $scope.testSuccessful = false;
      $scope.selectedBookmark.hideSort = /order.+by/i.test(val)
  });

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

  ipcRenderer.on('download-complete', (channel, type) => {
    $timeout(() => $scope.inProgress[type] = false, 0);
    new Notification(appName, {
      body: `Finished downloading icons: ${type}`,
      icon: icon
    });
  });

  ipcRenderer.on('set-bookmark-icon', (channel, fileName) => {
    $timeout(() => {
      $scope.selectedIcon = fileName;
    }, 0);
  });

  ipcRenderer.on('bookmark-validation', (channel, result) => {
    $timeout(() => {
      $scope.inProgress.testConfig = false;
      $scope.testSuccessful = result === true;
      if (!$scope.testSuccessful) 
        alert(`Bookmark Config Invalid:\n\n${result}`);
    }, 0);
  });
}]);
