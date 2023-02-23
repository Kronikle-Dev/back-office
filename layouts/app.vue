<script lang="ts" setup>
onBeforeMount (() => {
  window.twttr = (function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0],
    t = window.twttr || {};
  if (d.getElementById(id)) return t;
  js = d.createElement(s);
  js.id = id;
  js.src = "https://platform.twitter.com/widgets.js";
  fjs.parentNode.insertBefore(js, fjs);

  t._e = [];
  t.ready = function(f) {
    t._e.push(f);
  };

  return t;
}(document, "script", "twitter-wjs"));
}) 
</script>

<template>
  <div>
    <SideBar class="fixed top-20 z-40"></SideBar>
    <div class="h-20 mt-20 pl-20 pr-1 lg:pl-60">
      <slot />
    </div>
  </div>
</template>

<style scoped>
</style>
