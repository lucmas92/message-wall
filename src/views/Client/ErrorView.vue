<template>
  <div class="px-6 max-w-2xl text-center">
    <h4 class="conqueror text-white text-4xl">Ops!</h4>
    <img src="@/assets/separator.png" alt="separator" class="w-1/2 mx-auto my-4" />

    <p
      class="text-white/80 px-4 font-extralight"
      style="letter-spacing: 0.12rem; line-height: 1.2rem; font-size: 16px"
    >
      Qualcosa è andato storto.
    </p>

    <router-link to="/">
      <button
        type="button"
        class="relative w-full overflow-hidden font-bold py-3 px-5 mt-6 rounded-full uppercase bg-gradient-to-t from-yellow-500 to-yellow-300 text-shadow-sm shadow-lg transform transition duration-150 shadow-yellow-300/50 active:scale-95"
      >
        riprova
      </button>
    </router-link>
  </div>
</template>

<script setup lang="ts"></script>
