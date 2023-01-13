<script lang="ts" setup>
definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <DisplayForm></DisplayForm>
  </div>
</template>
