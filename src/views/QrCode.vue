<script setup lang="ts">
import { computed, ref } from 'vue'
// 1. Definiamo un'interfaccia per i parametri di QuickChart
interface QRConfig {
  text: string
  size: number
  backgroundColor: string
  darkColor: string
  margin: number
  format: 'svg' | 'png'
  ecLevel: 'L' | 'M' | 'Q' | 'H'
}

// 2. Inizializziamo il ref con il tipo definito
const qrConfig = ref<QRConfig>({
  text: window.location.origin,
  size: 250,
  backgroundColor: '#ffffff', // Nota: QuickChart preferisce l'esadecimale senza # in alcuni casi
  darkColor: '#192029',
  margin: 1,
  format: 'svg',
  ecLevel: 'H',
})

// 3. Computed property tipizzata
const qrCodeUrl = computed<string>(() => {
  const baseUrl = 'https://quickchart.io/qr'

  // URLSearchParams accetta stringhe, quindi convertiamo i numeri
  const params = new URLSearchParams({
    text: qrConfig.value.text,
    size: qrConfig.value.size.toString(),
    light: qrConfig.value.backgroundColor,
    dark: qrConfig.value.darkColor,
    margin: qrConfig.value.margin.toString(),
    format: qrConfig.value.format,
    ecLevel: qrConfig.value.ecLevel,
  })

  return `${baseUrl}?${params.toString()}`
})
</script>

<template>
  <img :src="qrCodeUrl" alt="QR Code" />
</template>
