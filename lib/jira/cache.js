const fs = require('fs');
const config = require('./config');

if (!fs.existsSync(config.cfgPath)) {
  fs.mkdirSync(config.cfgPath);
}

let cacheFile = config.cfgPath + config.cacheFile;
let exists = fs.existsSync(cacheFile);
let cache = exists ? JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) : {};
const persist = () => fs.writeFileSync(cacheFile, JSON.stringify(cache));

module.exports = {
  'set': (id, val) => {
    cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) : {};
    cache[id] = { value: val, time: Date.now() };
    persist();
  },

  'get': (id, expire) => {
    let exists = cache[id] !== undefined,
      cacheData = cache[id] || {},
      cachedAt = cacheData.time || 0,
      expiresAt = cachedAt + expire,
      expired = Date.now() > expiresAt;
    return exists && (!expired || !expire) ? cacheData.value : undefined;
  },

  'lastChecked': (id) => {
    let exists = cache[id] !== undefined,
      cacheData = cache[id] || {},
      cachedAt = cacheData.time || 0,
      time = cachedAt ? cachedAt : Date.now();
    return new Date(time).toLocaleString();
  },

  'clear': (ids) => {
    return new Promise((resolve, reject) => {
      ids = ids || [];
      if (typeof ids !== 'object') {
        ids = [ids];
      }
      if (ids.length) {
        for (let id of ids) {
          if (cache[id]) {
            delete cache[id];
          }
        }
        persist();
        return resolve(true);
      }
      else {
        if (fs.existsSync(cacheFile)) {
          fs.unlinkSync(cacheFile);
          return resolve(true);
        }
      }
    });
  },
};