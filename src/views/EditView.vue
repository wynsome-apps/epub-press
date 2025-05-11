<script setup>
import FileEdit from '@/components/FileEdit.vue'
import {
  ref,
  onMounted,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mdiArrowLeft, mdiExport } from '@mdi/js'
import { db } from '@/db'
import SvgIcon from '@jamescoyle/vue-icon'

const route = useRoute()
const router = useRouter()
const bookId = parseInt(route.params.id)

const bookContent = ref(null)
const filesMeta = ref(new Map())
const filesContent = ref(new Map())
const errorMessage = ref('')

onMounted(async () => {
  try {
    await db.init()
    await loadBook()
  } catch (error) {
    console.error('Failed to initialize database:', error)
    errorMessage.value = 'Failed to initialize database: ' + error.message
  }
})

const loadBook = async () => {
  try {
    // Get all books
    const books = await db.getBooks()

    // Find the book with the matching ID
    const book = books.find(b => b.id === bookId)

    if (!book) {
      errorMessage.value = 'Book not found'
      return
    }

    // Get the book's files
    const files = await db.getBookFiles(bookId)

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
  } catch (error) {
    errorMessage.value = 'Error loading book: ' + error.message
  }
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
  router.push('/')
}
</script>

<template>
  <header v-if="bookContent">
    <button class="back-btn" @click="handleBack">
      <svg-icon type="mdi" :path="mdiArrowLeft"></svg-icon>
    </button>
    <h2>{{ bookContent.title }}</h2>
    <button class="export-btn" @click="handleExport">
      <svg-icon type="mdi" :path="mdiExport"></svg-icon><span class="label">Export</span>
    </button>
  </header>
  <main>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-else-if="bookContent" class="book-content">
      <FileEdit :book-content="bookContent" :files-content="filesContent" :files-meta="filesMeta" />
    </div>
    <div v-else class="loading">
      Loading...
    </div>
  </main>
</template>

<style scoped>
main {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.error-message {
  color: red;
  margin: 1rem;
  padding: 1rem;
  border: 1px solid red;
  border-radius: 4px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.5rem;
  color: var(--color-text);
}

.book-header, header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--vt-c-green);
  color: white;

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
    background-color: white;
    color: var(--vt-c-green);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
}

.book-content {
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
</style>
