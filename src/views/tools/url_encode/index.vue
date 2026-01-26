<template>
  <div class="iframe-container">
    <iframe 
      src="https://tool.chinaz.com/Tools/urlencode.aspx" 
      width="100%" 
      height="100%" 
      frameborder="0"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
// 即使没逻辑，保留这个标签也是好习惯，代表这是一个 Vue 组件
defineOptions({
  name: "UrlEncode" // 给组件起个名，方便调试
});
</script>

<style scoped>
.iframe-container {
  width: 100%;
  /* 如果您发现页面下方有滚动条，可以微调这个 120px */
  height: calc(100vh - 120px); 
  overflow: hidden;
  background-color: #fff; /* 加个白底，防止在暗色模式下看来奇怪 */
}
</style>