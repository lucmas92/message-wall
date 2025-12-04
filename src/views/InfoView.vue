<template>
  <div class="min-h-screen bg-gray-50 p-6 sm:p-10 flex flex-col items-center">
    <div class="w-full max-w-2xl bg-white shadow-xl rounded-lg p-8 mt-10 text-gray-800">

      <h1 class="text-4xl font-extrabold text-indigo-700 text-center mb-4">
        Info & Istruzioni per la Bacheca Live
      </h1>
      <p class="text-center text-gray-500 mb-8">
        Qui trovi le istruzioni per inviare il tuo messaggio allo schermo gigante.
      </p>

      <div class="space-y-6">

        <div class="border-l-4 border-indigo-500 pl-4">
          <h2 class="text-2xl font-semibold mb-2 flex items-center">
            <span class="mr-3 text-indigo-500">1️⃣</span> Come Inviare
          </h2>
          <p class="text-gray-600">
            Per inviare il tuo messaggio, usa il link qui sotto o scansiona il QR Code che vedi sullo schermo principale.
            Ricorda che ogni messaggio deve essere approvato da un moderatore prima di apparire.
          </p>
        </div>

        <div class="border-l-4 border-red-500 pl-4">
          <h2 class="text-2xl font-semibold mb-2 flex items-center">
            <span class="mr-3 text-red-500">❌</span> Regole del Contenuto
          </h2>
          <ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Massimo 250 caratteri.</li>
            <li>È severamente vietato l'uso di parolacce, bestemmie o contenuti offensivi.</li>
            <li>Messaggi promozionali non autorizzati verranno rifiutati.</li>
          </ul>
        </div>

        <div class="pt-4 text-center">
          <router-link :to="{ name: 'submit' }"
             class="inline-block py-3 px-8 rounded-lg text-white font-bold text-lg transition duration-200 ease-in-out shadow-lg
                    bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/50">
            Vai alla Pagina di Invio Messaggio
          </router-link>
        </div>

      </div>

    </div>
  </div>
</template>
