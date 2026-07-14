<template>
  <div class="connections-wrap">
    <!-- search connections input -->
    <div v-if="connections.length>=filterEnableNum" class="filter-input">
      <el-input
        v-model="filterMode"
        suffix-icon="el-icon-search"
        :placeholder="$t('message.search_connection')"
        clearable
        size="mini">
      </el-input>
    </div>

    <!-- connections list -->
    <div class="connections-list">
      <template v-for="item of displayItems">
        <ConnectionGroupHeader
          v-if="item.type === 'group'"
          :key="item.key"
          :config='item'
          :childCount="groupChildCount(item.key)"
          :collapsed="collapsedGroups.has(item.key)"
          @toggle="toggleGroup(item.key)">
        </ConnectionGroupHeader>
        <ConnectionWrapper
          v-else
          v-show="!isHiddenByCollapsedGroup(item)"
          :key="item.key ? item.key : item.connectionName"
          :globalSettings="globalSettings"
          :config='item'>
        </ConnectionWrapper>
      </template>
    </div>

    <ScrollToTop parentNum='1' :posRight='false'></ScrollToTop>
  </div>
</template>

<script type="text/javascript">
import storage from '@/storage.js';
import ConnectionWrapper from '@/components/ConnectionWrapper';
import ConnectionGroupHeader from '@/components/ConnectionGroupHeader';
import ScrollToTop from '@/components/ScrollToTop';
import Sortable from 'sortablejs';


export default {
  data() {
    return {
      connections: [],
      globalSettings: this.$storage.getSetting(),
      filterEnableNum: 4,
      filterMode: '',
      collapsedGroups: new Set(),
    };
  },
  components: { ConnectionWrapper, ConnectionGroupHeader, ScrollToTop },
  created() {
    this.$bus.$on('refreshConnections', () => {
      this.initConnections();
    });
    this.$bus.$on('reloadSettings', (settings) => {
      this.globalSettings = settings;
    });
  },
  computed: {
    // single flat list: root-level items (folders + ungrouped connections) in
    // order, with each folder's children spliced in right after it. This is
    // the ONLY list SortableJS drags within, so moving a connection in/out of
    // a folder is always a same-list reorder and never remounts a live session
    displayItems() {
      if (this.filterMode) {
        const keyword = this.filterMode.toLowerCase();

        return this.connections.filter(item => {
          return item.type !== 'group' && item.name.toLowerCase().includes(keyword);
        });
      }

      const roots = this.connections
        .filter(item => !item.parentId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const items = [];

      for (const item of roots) {
        items.push(item);

        if (item.type !== 'group') {
          continue;
        }

        const children = this.connections
          .filter(child => child.parentId === item.key)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        items.push(...children);
      }

      return items;
    },
  },
  methods: {
    initConnections() {
      const connections = storage.getConnections(true);
      const slovedConnections = [];
      // this.connections = [];

      for (const item of connections) {
        // groups have no host/port, only real connections need this
        if (item.type !== 'group') {
          item.connectionName = storage.getConnectionName(item);
          // fix history bug, prevent db into config
          delete item.db;
        }

        slovedConnections.push(item);
      }

      this.connections = slovedConnections;
    },
    groupChildCount(key) {
      return this.connections.filter(item => item.parentId === key).length;
    },
    isHiddenByCollapsedGroup(item) {
      return !!(item.parentId && this.collapsedGroups.has(item.parentId));
    },
    toggleGroup(key) {
      this.collapsedGroups.has(key) ? this.collapsedGroups.delete(key) : this.collapsedGroups.add(key);
      // Set mutations aren't reactive in Vue2, force a new reference
      this.collapsedGroups = new Set(this.collapsedGroups);
    },
    sortOrder() {
      const dragWrapper = document.querySelector('.connections-list');
      Sortable.create(dragWrapper, {
        handle: '.el-submenu__title, .group-drag-handle',
        animation: 400,
        direction: 'vertical',
        onEnd: (e) => {
          // displayItems is a filtered subset while searching; reordering it
          // would wipe every non-matching connection out of storage. Bail out
          // and snap the DOM back to the persisted order instead.
          if (this.filterMode) {
            return this.initConnections();
          }

          const { newIndex, oldIndex } = e;
          const items = this.displayItems.slice();
          const [movedItem] = items.splice(oldIndex, 1);

          let newParentId;

          // folders are single-level only, always stay at root
          if (movedItem.type === 'group') {
            newParentId = undefined;
          } else {
            // items has not had movedItem re-inserted yet, so items[newIndex-1]
            // and items[newIndex] are exactly its future prev/next neighbors
            const prevItem = items[newIndex - 1];
            const nextItem = items[newIndex];

            if (prevItem && prevItem.type === 'group') {
              // dropped right after a header - becomes its first child
              newParentId = prevItem.key;
            } else if (nextItem && nextItem.type === 'group') {
              // dropped right before another header - stays at root
              newParentId = undefined;
            } else if (prevItem) {
              newParentId = prevItem.parentId;
            } else {
              newParentId = undefined;
            }
          }

          movedItem.parentId = newParentId;
          items.splice(newIndex, 0, movedItem);

          this.$storage.reOrderAndStore(items);
          this.initConnections();
        },
      });
    },
  },
  mounted() {
    this.initConnections();
    this.sortOrder();
  },
};
</script>

<style type="text/css">
  .connections-wrap {
    height: calc(100vh - 59px);
    overflow-y: auto;
    margin-top: 11px;
  }
  .connections-wrap .filter-input {
    padding-right: 13px;
    margin-bottom: 4px;
  }
  /* set drag area min height, target to the end will be correct */
  .connections-wrap .connections-list {
    min-height: calc(100vh - 110px);
  }
</style>
