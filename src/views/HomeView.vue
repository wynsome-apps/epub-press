<script setup>
import FileEdit from '@/components/FileEdit.vue'
import {
  ref,
  onMounted,
} from 'vue'
import { mdiArrowLeft, mdiDelete, mdiExport } from '@mdi/js'
import { Book } from 'epubjs'
import { db } from '@/db'
import SvgIcon from '@jamescoyle/vue-icon'

const showUpload = ref(true)
const tableOfContents = ref([])
const bookContent = ref(null)
const filesMeta = ref(new Map())
const filesContent = ref(new Map())
const selectedFile = ref(null)
const errorMessage = ref('')
const storedBooks = ref([])

onMounted(async () => {
  try {
    await db.init()
    storedBooks.value = await db.getBooks()
  } catch (error) {
    console.error('Failed to initialize database:', error)
    errorMessage.value = 'Failed to initialize database: ' + error.message
  }
})

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.name.endsWith('.epub')) {
    selectedFile.value = file
    errorMessage.value = ''
    parseEpub(file)
  } else {
    selectedFile.value = null
    errorMessage.value = 'Please select a valid .epub file'
  }
}

const processFiles = async (book, bookId) => {
  for (const zipFileName in book.archive.zip.files) {
    try {
      const file = book.archive.zip.files[zipFileName]
      const type = zipFileName.split('.').pop() || 'unknown'
      const metadata = {
        name: file.name,
        type: type,
        dir: file.dir,
        date: file.date,
        options: file.options,
        isText: /^(html|xhtml|xml|txt|css|ncx|opf)$/i.test(type),
      }
      filesMeta.value.set(zipFileName, metadata)

      let contentType = 'text'
      switch (type) {
        case 'png':
          contentType = 'uint8array'
          break
      }
      const fileContent = await book.archive.zip.files[zipFileName].async(contentType)
      filesContent.value.set(zipFileName, fileContent)

      await db.addFile({
        bookId: bookId,
        name: zipFileName,
        meta: metadata,
        content: fileContent,
      })
    } catch (err) {
      console.error(`Error processing file ${zipFileName}:`, err)
    }
  }
}

const loadStoredBook = async (book) => {
  try {
    const files = await db.getBookFiles(book.id)
    bookContent.value = {
      title: book.meta.title,
      creator: book.meta.creator,
      language: book.meta.language,
      metadata: book.meta,
    }

    filesMeta.value = new Map()
    filesContent.value = new Map()

    files.forEach((file) => {
      filesMeta.value.set(file.name, file.meta)
      filesContent.value.set(file.name, file.content)
    })

    showUpload.value = false
  } catch (error) {
    errorMessage.value = 'Error loading stored book: ' + error.message
  }
}

const deleteBook = async (book, event) => {
  event.stopPropagation()
  try {
    await db.deleteBook(book.id)
    storedBooks.value = storedBooks.value.filter((b) => b.id !== book.id)
  } catch (error) {
    errorMessage.value = 'Error deleting book: ' + error.message
  }
}

const parseEpub = (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const book = new Book(e.target.result)

    try {
      const metadata = await book.loaded.metadata
      bookContent.value = {
        title: metadata.title,
        creator: metadata.creator,
        language: metadata.language,
        spine: book.spine,
        book: book,
        metadata: metadata,
      }

      const bookId = await db.addBook({
        name: selectedFile.value.name,
        meta: metadata,
      })

      const navigation = await book.loaded.navigation
      tableOfContents.value = navigation.toc
      showUpload.value = false

      await processFiles(book, bookId)
    } catch (err) {
      errorMessage.value = 'Error parsing epub file: ' + err.message
    }
  }
  reader.onerror = (err) => {
    errorMessage.value = 'Error reading file: ' + err.message
  }
  reader.readAsArrayBuffer(file)
}

const handleExport = async () => {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  for (const [fileName, content] of filesContent.value.entries()) {
    zip.file(fileName, content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'export.epub'
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

const handleBack = () => {
  showUpload.value = true
  bookContent.value = null
  filesMeta.value = new Map()
  filesContent.value = new Map()
  selectedFile.value = null
  errorMessage.value = ''
}
</script>

<template>
  <main>
    <div v-if="showUpload">
      <div class="file-upload">
        <input type="file" accept=".epub" @change="handleFileUpload" class="file-input" />
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="selectedFile">Selected file: {{ selectedFile.name }}</p>
      </div>
      <div v-if="storedBooks.length" class="stored-books">
        <h3>Previous Books:</h3>
        <ul>
          <li
            v-for="book in storedBooks"
            :key="book.id"
            @click="loadStoredBook(book)"
            class="stored-book"
          >
            {{ book.name }}
            <svg
              @click="deleteBook(book, $event)"
              class="delete-icon"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path :d="mdiDelete"></path>
            </svg>
          </li>
        </ul>
      </div>
    </div>
    <div v-else class="book-content">
      <div class="book-header">
        <button class="back-btn" @click="handleBack">
          <svg-icon type="mdi" :path="mdiArrowLeft"></svg-icon>
        </button>
        <h2>{{ bookContent.title }}</h2>
        <button class="export-btn" @click="handleExport">
          <svg-icon type="mdi" :path="mdiExport"></svg-icon><span class="label">Export</span>
        </button>
      </div>
      <FileEdit :book-content="bookContent" :files-content="filesContent" :files-meta="filesMeta" />
    </div>
  </main>
</template>

<style>
main {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.file-upload {
  margin: 1rem;
  padding: 1rem;
  border: 2px dashed #ccc;
  border-radius: 4px;

  .file-input {
    margin-bottom: 10px;
  }

  .error-message {
    color: red;
    margin-top: 5px;
  }
}

.stored-books {
  padding: 1rem;

  ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }

  .stored-book {
    background-color: var(--vt-c-black-mute);
    padding: 1rem;
    display: flex;
    justify-content: space-between;

    &:hover {
      background-color: var(--vt-c-black-soft);
      cursor: pointer;
    }

    .delete-icon {
      fill: var(--vt-c-white);
      cursor: pointer;

      &:hover {
        fill: var(--vt-c-danger);
      }
    }
  }
}

.book-content {
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .book-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    margin-bottom: 1rem;

    background: var(--color-background-soft);
    border-right: 1px solid var(--color-border);

    .back-btn {
      display: flex;
      align-items: center;
      background-color: transparent;
      border: none;
      color: white;
    }
    h2 {
      position: relative;
      flex: 1;
      margin: 0;
      padding: 0;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(100% - 100px);
    }

    .export-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: var(--vt-c-green);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  }
}

@keyframes flash {
  0%,
  100% {
    background-color: rgba(113, 113, 0, 0);
  }
  50% {
    background-color: rgba(113, 113, 0, 1);
  }
}

.highlight {
  animation: flash 1s 3;
  background-color: rgba(113, 113, 0, 0);
  transition: background-color 3s ease;
}
</style>
