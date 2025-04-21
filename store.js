const Store = require('electron-store').default;

const store = new Store({
  defaults: {
    trackedApps: [],
    timeStats: {}
  }
});

module.exports = store;
