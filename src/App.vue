<template>
  <main class="p-safe min-h-screen flex justify-center items-center">
    <RouterView class="max-w-2xl" />
  </main>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>
<style>
body {
  background-attachment: fixed;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 1)), url('@/assets/wallpaper.png');
  background-size: cover;
  background-repeat: no-repeat;
  padding: 0;
}
</style>
