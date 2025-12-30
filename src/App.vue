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
  font-family: 'Montserrat', sans-serif;
  background-attachment: fixed;
  background-position: center center;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('@/assets/wallpaper-min.png');
  background-size: cover;
  background-repeat: no-repeat;
  padding: 0;
}
</style>
