<template>
  <div class="px-6 max-w-2xl text-center">
    <h4 class="conqueror text-white text-4xl">
      Info & Istruzioni<br />
      per la Baceca Live
    </h4>

    <img src="@/assets/separator.png" alt="separator" class="w-1/2 mx-auto my-4" />

    <div class="text-left">
      <p class="text-white font-extrabold uppercase text-lg mb-4">COME INVIARE?</p>
      <p
        class="text-white/80 font-extralight"
        style="letter-spacing: 0.12rem; line-height: 1.2rem; font-size: 16px"
      >
        Per inviare il tuo messaggi, usa il link qui sotto o scansiona il QR Code che vedi sullo
        schermo principale. Ricorda che ogni messaggio deve essere approvato da un moderatore prima
        di apparire.
      </p>
    </div>

    <img src="@/assets/separator.png" alt="separator" class="w-1/2 mx-auto my-4" />

    <div class="text-left">
      <p class="text-white font-extrabold uppercase text-lg mb-4">REGOLE DEL CONTENUTO</p>
      <p
        class="text-white/80 font-extralight"
        style="letter-spacing: 0.12rem; line-height: 1.2rem; font-size: 16px"
      >
        È severamente vietato l'uso di parolacce, bestemmie o contenuti offensivi. Messaggi
        promozionali non autorizzatti verranno rifiutati.
      </p>
    </div>

    <router-link to="/">
      <button
        type="button"
        class="relative w-full overflow-hidden font-bold py-3 px-5 mt-12 rounded-full uppercase bg-gradient-to-t from-yellow-500 to-yellow-300 text-shadow-sm shadow-lg transform transition duration-150 shadow-yellow-300/50 active:scale-95"
      >
        SCRIVI UN MESSAGGIO
      </button>
    </router-link>
  </div>
</template>
