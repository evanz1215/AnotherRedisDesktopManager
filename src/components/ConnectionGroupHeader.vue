<template>
<div class="connection-group-header" :data-group-key="config.key">
  <div class="group-drag-handle group-title-row" @click="$emit('toggle')">
    <i class="group-expand-icon el-icon-arrow-right" :class="{ 'is-expanded': !collapsed }"></i>
    <i class="group-folder-icon fa" :class="folderIconClass" :style="{ color: config.color }"></i>
    <span class="group-name" :title="config.name">{{config.name}}</span>
    <span class="group-count">{{childCount}}</span>
  </div>

  <div class="group-opt-icons">
    <el-dropdown placement="bottom-start" :show-timeout=100 :hide-timeout=300>
      <i class="connection-right-icon el-icon-more" @click.stop></i>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item @click.native="$refs.editGroupDialog.show()">
          <span><i class="more-operate-ico el-icon-edit-outline"></i>&nbsp;{{ $t('message.edit_group') }}</span>
        </el-dropdown-item>
        <el-dropdown-item @click.native="deleteGroup">
          <span><i class="more-operate-ico el-icon-delete"></i>&nbsp;{{ $t('message.del_group') }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>

  <!-- edit folder dialog -->
  <GroupDialog editMode='true' :config='config' ref='editGroupDialog'></GroupDialog>
</div>
</template>

<script type="text/javascript">
import storage from '@/storage.js';
import GroupDialog from '@/components/GroupDialog';

export default {
  props: ['config', 'childCount', 'collapsed'],
  components: { GroupDialog },
  computed: {
    folderIconClass() {
      // custom icon stays fixed; the arrow already conveys expand/collapse
      if (this.config.icon) {
        return this.config.icon;
      }

      return this.collapsed ? 'fa-folder' : 'fa-folder-open';
    },
  },
  methods: {
    deleteGroup() {
      this.$confirm(
        this.$t('message.confirm_delete_group'),
        { type: 'warning' },
      ).then(() => {
        storage.deleteGroup(this.config.key);
        this.$bus.$emit('refreshConnections');

        this.$message.success({
          message: this.$t('message.delete_success'),
          duration: 1000,
        });
      }).catch(() => {});
    },
  },
};
</script>

<style type="text/css">
  .connection-group-header {
    position: relative;
    height: 34px;
    line-height: 34px;
    cursor: pointer;
  }
  .connection-group-header .group-title-row {
    padding-left: 8px;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #292f31;
  }
  .dark-mode .connection-group-header .group-title-row {
    color: #f7f7f7;
  }
  .connection-group-header .group-expand-icon {
    display: inline-block;
    transition: transform 0.2s;
    margin-right: 2px;
  }
  .connection-group-header .group-expand-icon.is-expanded {
    transform: rotate(90deg);
  }
  .connection-group-header .group-folder-icon {
    margin-right: 4px;
    color: #E6A23C;
  }
  .connection-group-header .group-count {
    margin-left: 6px;
    font-size: 85%;
    font-weight: normal;
    color: #a9a9ab;
  }
  .connection-group-header .group-opt-icons {
    position: absolute;
    right: 25px;
    top: 6px;
  }
  .connection-group-header .connection-right-icon {
    display: inline-block;
    font-size: 1.16em;
    padding: 3px;
    transition: background 0.2s;
  }
  .connection-group-header .connection-right-icon:hover {
    background: #dcdee0;
    border-radius: 3px;
  }
  .dark-mode .connection-group-header .connection-right-icon:hover {
    background: #58707b;
  }
  .connection-group-header:hover {
    background: #f5f7fa;
  }
  .dark-mode .connection-group-header:hover {
    background: #37474f;
  }
</style>
