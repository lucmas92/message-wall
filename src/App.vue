<template>
  <header>
    <nav>
      <RouterLink to="/">Invio Messaggio (Cliente)</RouterLink>

      <RouterLink to="/admin">Pannello Admin</RouterLink>

      <RouterLink to="/screen">Schermo Gigante</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
// Non c'è bisogno di dichiarare componenti, Vue Router gestisce l'iniezione
</script>

<style>
/* Aggiungi qui gli stili globali se necessario, oppure usa un file CSS separato */
/* Esempio per il layout di base: */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 1rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}
</style>
