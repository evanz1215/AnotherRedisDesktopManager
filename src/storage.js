import utils from './util';

const { randomString } = utils;

export default {
  getSetting(key) {
    let settings = localStorage.getItem('settings');
    settings = settings ? JSON.parse(settings) : {};

    return key ? settings[key] : settings;
  },
  saveSettings(settings) {
    settings = JSON.stringify(settings);
    return localStorage.setItem('settings', settings);
  },
  getFontFamily() {
    let fontFamily = this.getSetting('fontFamily');

    // set to default font-family
    if (
      !fontFamily || !fontFamily.length
      || fontFamily.toString() === 'Default Initial'
    ) {
      fontFamily = ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica',
        'Arial', 'sans-serif', 'Microsoft YaHei', 'Apple Color Emoji', 'Segoe UI Emoji'];
    }

    return fontFamily.map(line => `"${line}"`).join(',');
  },
  getCustomFormatter(name = '') {
    let formatters = localStorage.getItem('customFormatters');
    formatters = formatters ? JSON.parse(formatters) : [];

    if (!name) {
      return formatters;
    }

    for (const line of formatters) {
      if (line.name === name) {
        return line;
      }
    }
  },
  saveCustomFormatters(formatters = []) {
    return localStorage.setItem('customFormatters', JSON.stringify(formatters));
  },
  addConnection(connection) {
    this.editConnectionByKey(connection, '');
  },
  getConnections(returnList = false) {
    let connections = localStorage.connections || '{}';

    connections = JSON.parse(connections);

    if (returnList) {
      connections = Object.keys(connections).map(key => connections[key]);
      this.sortConnections(connections);
    }

    return connections;
  },
  editConnectionByKey(connection, oldKey = '') {
    oldKey = connection.key || oldKey;

    const connections = this.getConnections();
    delete connections[oldKey];

    this.updateConnectionName(connection, connections);
    const newKey = this.getConnectionKey(connection, true);
    connection.key = newKey;

    // new added has no order, add it. do not add when edit mode
    // order is scoped to siblings sharing the same parentId (root level or same folder)
    if (!oldKey && isNaN(connection.order)) {
      const siblings = Object.values(connections).filter(item => (item.parentId || '') === (connection.parentId || ''));
      const maxOrder = Math.max(...siblings.map(item => (!isNaN(item.order) ? item.order : 0)));
      connection.order = (maxOrder > 0 ? maxOrder : 0) + 1;
    }

    connections[newKey] = connection;
    this.setConnections(connections);
  },
  editConnectionItem(connection, items = {}) {
    const key = this.getConnectionKey(connection);
    const connections = this.getConnections();

    if (!connections[key]) {
      return;
    }

    Object.assign(connection, items);
    Object.assign(connections[key], items);
    this.setConnections(connections);
  },
  updateConnectionName(connection, connections) {
    let name = this.getConnectionName(connection);

    for (const key in connections) {
      // if 'name' same with others, add random suffix
      if (this.getConnectionName(connections[key]) == name) {
        name += ` (${randomString(3)})`;
        break;
      }
    }

    connection.name = name;
  },
  getConnectionName(connection) {
    return connection.name || `${connection.host}@${connection.port}`;
  },
  setConnections(connections) {
    localStorage.connections = JSON.stringify(connections);
  },
  deleteConnection(connection) {
    const connections = this.getConnections();
    const key = this.getConnectionKey(connection);

    delete connections[key];

    this.hookAfterDelConnection(connection);
    this.setConnections(connections);
  },
  addGroup(name) {
    const connections = this.getConnections();
    const rootItems = Object.values(connections).filter(item => !item.parentId);
    const maxOrder = Math.max(...rootItems.map(item => (!isNaN(item.order) ? item.order : 0)));

    const group = {
      key: `group_${new Date().getTime()}_${randomString(5)}`,
      type: 'group',
      name,
      order: (maxOrder > 0 ? maxOrder : 0) + 1,
    };

    connections[group.key] = group;
    this.setConnections(connections);

    return group;
  },
  renameGroup(key, name) {
    const connections = this.getConnections();

    if (!connections[key]) {
      return;
    }

    connections[key].name = name;
    this.setConnections(connections);
  },
  deleteGroup(key) {
    const connections = this.getConnections();
    delete connections[key];

    // ungroup children back to root level, do not delete them
    for (const connKey in connections) {
      if (connections[connKey].parentId === key) {
        delete connections[connKey].parentId;
      }
    }

    this.setConnections(connections);
  },
  getConnectionKey(connection, forceUnique = false) {
    if (Object.keys(connection).length === 0) {
      return '';
    }

    if (connection.key) {
      return connection.key;
    }

    if (forceUnique) {
      return `${new Date().getTime()}_${randomString(5)}`;
    }

    return connection.host + connection.port + connection.name;
  },
  sortConnections(connections) {
    connections.sort((a, b) => {
      // drag ordered
      if (!isNaN(a.order) && !isNaN(b.order)) {
        return parseInt(a.order) <= parseInt(b.order) ? -1 : 1;
      }

      // no ordered, by key
      if (a.key && b.key) {
        return a.key < b.key ? -1 : 1;
      }

      return a.key ? 1 : (b.key ? -1 : 0);
    });
  },
  // items must be the full flat list (all connections + groups), each already
  // carrying its current parentId; order is recomputed per parentId bucket
  reOrderAndStore(items = []) {
    const orderCounters = {};
    const newConnections = {};

    for (const item of items) {
      const bucket = item.parentId || '';
      orderCounters[bucket] = orderCounters[bucket] || 0;
      item.order = orderCounters[bucket]++;

      newConnections[this.getConnectionKey(item, true)] = item;
    }

    this.setConnections(newConnections);

    return newConnections;
  },
  getStorageKeyMap(type) {
    const typeMap = {
      cli_tip: 'cliTips',
      last_db: 'lastSelectedDb',
      custom_db: 'customDbName',
      search_tip: 'searchTips',
    };

    return type ? typeMap[type] : typeMap;
  },
  initStorageKey(prefix, connectionName) {
    return `${prefix}_${connectionName}`;
  },
  getStorageKeyByName(type = 'cli_tip', connectionName = '') {
    return this.initStorageKey(this.getStorageKeyMap(type), connectionName);
  },
  hookAfterDelConnection(connection) {
    const connectionName = this.getConnectionName(connection);
    const types = Object.keys(this.getStorageKeyMap());

    const willRemovedKeys = [];

    for (const type of types) {
      willRemovedKeys.push(this.getStorageKeyByName(type, connectionName));
    }

    willRemovedKeys.forEach(k => localStorage.removeItem(k));
  },
};
