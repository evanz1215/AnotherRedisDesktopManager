<template>
  <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" :append-to-body='true' :close-on-click-modal='false' width='400px'>
    <el-form label-position="top" size="mini">
      <el-form-item :label="$t('message.new_group_prompt')" required>
        <el-input v-model="name" autocomplete="off" ref="nameInput" @keyup.enter.native="save"></el-input>
      </el-form-item>

      <el-form-item :label="$t('message.mark_icon')">
        <div class="icon-picker">
          <i
            v-for="item in iconOptions"
            :key="item"
            class="icon-picker-item fa"
            :class="[item, { 'is-selected': icon === item }]"
            @click="icon = item">
          </i>
        </div>
      </el-form-item>

      <el-form-item :label="$t('message.mark_color')">
        <el-color-picker
          v-model="color"
          :predefine="['#E6A23C', '#f56c6c', '#F5C800', '#409EFF', '#85ce61', '#c6e2ff', '#909399', '#9b59b6', '#00c1de', '#ff9f43', '#2e7d32', '#000000']">
        </el-color-picker>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">{{ $t('el.messagebox.cancel') }}</el-button>
      <el-button type="primary" @click="save">{{ $t('el.messagebox.confirm') }}</el-button>
    </div>
  </el-dialog>
</template>

<script type="text/javascript">
import storage from '@/storage.js';

const DEFAULT_COLOR = '#E6A23C';
const DEFAULT_ICON = 'fa-folder';
const ICON_OPTIONS = [
  'fa-folder', 'fa-database', 'fa-server', 'fa-cloud',
  'fa-star', 'fa-tags', 'fa-archive', 'fa-briefcase',
  'fa-globe', 'fa-lock', 'fa-flask', 'fa-cube',
];

export default {
  data() {
    return {
      dialogVisible: false,
      name: '',
      color: DEFAULT_COLOR,
      icon: DEFAULT_ICON,
      iconOptions: ICON_OPTIONS,
    };
  },
  props: {
    config: {
      default: _ => ({}),
    },
    editMode: {
      default: false,
    },
  },
  computed: {
    dialogTitle() {
      return this.editMode ? this.$t('message.edit_group') : this.$t('message.new_group');
    },
  },
  methods: {
    show() {
      this.dialogVisible = true;

      if (this.editMode) {
        this.name = this.config.name;
        this.color = this.config.color || DEFAULT_COLOR;
        this.icon = this.config.icon || DEFAULT_ICON;
      } else {
        this.name = '';
        this.color = DEFAULT_COLOR;
        this.icon = DEFAULT_ICON;
      }

      this.$nextTick(() => {
        this.$refs.nameInput.focus();
      });
    },
    save() {
      if (!this.name || !this.name.trim()) {
        return;
      }

      if (this.editMode) {
        storage.editConnectionItem(this.config, { name: this.name, color: this.color, icon: this.icon });
      } else {
        storage.addGroup(this.name, this.color, this.icon);
      }

      this.dialogVisible = false;
      this.$bus.$emit('refreshConnections');
    },
  },
};
</script>

<style type="text/css">
  .icon-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .icon-picker .icon-picker-item {
    width: 26px;
    height: 26px;
    line-height: 26px;
    text-align: center;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    color: #606266;
  }
  .icon-picker .icon-picker-item:hover {
    border-color: #409EFF;
  }
  .icon-picker .icon-picker-item.is-selected {
    border-color: #409EFF;
    background: #ecf5ff;
    color: #409EFF;
  }
  .dark-mode .icon-picker .icon-picker-item {
    border-color: #4a5a63;
    color: #f7f7f7;
  }
  .dark-mode .icon-picker .icon-picker-item.is-selected {
    background: #37474f;
  }
</style>
