export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      console.log('ServiceWorker registration')
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('ServiceWorker registration successful:', registration.scope)

        return registration
      } catch (error) {
        console.error('ServiceWorker registration failed:', error)
        throw error
      }
    })
  }
}

export function sendFileToServiceWorker(fileName) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PROCESS_EPUB',
      fileName: fileName
    })
  }
}
