<template>
  <main class="p-safe min-h-screen flex justify-center items-center">
    <RouterView class="" />
  </main>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>
<style>
body {
  background-attachment: fixed;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('@/assets/wallpaper.png');
  background-size: cover;
  background-repeat: no-repeat;
  padding: 0;
}
</style>
