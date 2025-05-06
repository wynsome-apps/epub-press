importScripts('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js')

const CACHE_VERSION = 'v1' // Increment this when you make changes
const CACHE_NAME = `my-app-cache-${CACHE_VERSION}`
const epubContents = new Map()

self.addEventListener('install', (event) => {
  self.skipWaiting();
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
})

const MIME_TYPES = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.xml': 'application/xml',
  '.xhtml': 'application/xhtml+xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/epub/')) {
    event.respondWith(
      (async () => {
        const filePath = url.pathname.substring(6) // Remove /epub/
        if (epubContents.has(filePath)) {
          // debugger;
          const content = epubContents.get(filePath)
          const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase()
          const contentType = MIME_TYPES[extension] || 'text/plain'
          console.log({
            filePath,
            content,
            extension,
            contentType,
          })
          return new Response(content, {
            headers: { 'Content-Type': contentType },
          })
        }
        return fetch(event.request)
      })(),
    )
  }
})

self.addEventListener('message', async (event) => {
  if (event.data.type === 'PROCESS_EPUB') {
    const fileName = event.data.fileName
    const file = event.data.file

    try {
      if (!file) {
        throw new Error('File is undefined or not provided')
      }
      const arrayBuffer = await file.arrayBuffer()
      const zip = await JSZip.loadAsync(arrayBuffer)
      const files = [];
      for (const zipFileName in zip.files) {
        let contentType = 'text';
        if (zipFileName.endsWith('.png')) {
          contentType = 'uint8array';
        }
        const file = zip.files[zipFileName]
        files.push({
          name: file.name,
          dir: file.dir,
          date: file.date,
          options: file.options,
        });
        const fileContent = await zip.files[zipFileName].async(contentType)
        epubContents.set(zipFileName, fileContent)
      }
      // const fileContents = await Promise.all(
      //   Object.keys(zip.files).map(async (path) => {
      //     const file = zip.files[path]
      //     return {
      //       path,
      //       content: file.dir ? null : await file.async('text'),
      //     }
      //   }),
      // )
      // epubContents.set(fileName, fileContents)
      const fileList = Object.keys(zip.files)

      event.source.postMessage({
        type: 'EPUB_PROCESSING_STATUS',
        fileName: fileName,
        status: 'success',
        fileList: fileList,
        files: files,
      })
    } catch (error) {
      event.source.postMessage({
        type: 'EPUB_PROCESSING_STATUS',
        fileName: fileName,
        status: 'error',
        error: error.message,
      })
    }
  }
})
