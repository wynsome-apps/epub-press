<script setup>
import { ref, onMounted } from 'vue'
import { mdiDelete } from '@mdi/js'
import { Book } from 'epubjs'
import { db } from '@/db'
import { useRouter } from 'vue-router'

const router = useRouter()
const tableOfContents = ref([])
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

      let contentType = 'text'
      switch (type) {
        case 'png':
          contentType = 'uint8array'
          break
      }
      const fileContent = await book.archive.zip.files[zipFileName].async(contentType)

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

const navigateToEdit = (bookId) => {
  router.push(`/edit/${bookId}`)
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

      const bookId = await db.addBook({
        name: selectedFile.value.name,
        meta: metadata,
      })

      const navigation = await book.loaded.navigation
      tableOfContents.value = navigation.toc

      await processFiles(book, bookId)

      // Navigate to edit view after processing
      navigateToEdit(bookId)
    } catch (err) {
      errorMessage.value = 'Error parsing epub file: ' + err.message
    }
  }
  reader.onerror = (err) => {
    errorMessage.value = 'Error reading file: ' + err.message
  }
  reader.readAsArrayBuffer(file)
}
</script>

<template>
  <main>
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
          @click="navigateToEdit(book.id)"
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
</style>
