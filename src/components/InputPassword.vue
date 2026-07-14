<template>
  <el-input :value="value" @input="handleInput" :type="inputType" :placeholder="placeholder">
    <i v-if="!hidepass" slot="suffix" class="toggler fa" :class="togglerIconClass" @click="togglePassword"></i>
  </el-input>
</template>

<script type="text/javascript">
export default {
  data() {
    return {
      inputType: 'password',
      hideTextTime: 6000,
    };
  },
  props: ['value', 'placeholder', 'hidepass'],
  computed: {
    // eye = hidden (click to reveal), eye-slash = revealed (click to hide)
    togglerIconClass() {
      return this.inputType == 'password' ? 'fa-eye' : 'fa-eye-slash toggler-active';
    },
  },
  methods: {
    handleInput(newValue) {
      this.$emit('input', newValue);
    },
    togglePassword() {
      clearTimeout(this.recoverTimer);

      // show text
      if (this.inputType == 'password') {
        this.inputType = 'text';

        // set time to hide text
        this.recoverTimer = setTimeout(() => {
          this.togglePassword();
        }, this.hideTextTime);
      }

      // back to password
      else {
        this.inputType = 'password';
      }
    },
  },
  destroyed() {
    clearTimeout(this.recoverTimer);
  },
};
</script>

<style type="text/css" scoped>
  .toggler {
    cursor: pointer;
    margin-right: 4px;
  }
  .toggler:hover {
    color: #6895ee;
  }
  .toggler.toggler-active {
    color: #6895ee;
  }
</style>
