<script setup>
import FileEdit from '@/components/FileEdit.vue'
import {
  ref,
  onMounted,
  // nextTick,
} from 'vue'
import { mdiDelete } from '@mdi/js'
import { Book } from 'epubjs'
import { db } from '@/db'

const showUpload = ref(true)
const tableOfContents = ref([])
const bookContent = ref(null)
const filesMeta = ref(new Map())
const filesContent = ref(new Map())
const selectedFile = ref(null)
const errorMessage = ref('')
const activeTab = ref('metadata')
const activeView = ref('display')
const storedBooks = ref([])
// const selectedContent = ref(null)

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

    /*if (navigator?.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PROCESS_EPUB',
        fileName: file.name,
        file: file,
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log(event);
        if (event.data.type === 'EPUB_PROCESSING_STATUS') {
          console.log(event.data);
          console.log(`EPUB processing ${event.data.status} for ${event.data.fileName}`);
        }
      })
    } else {
      console.warn('Service worker not found');
    }*/
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

/*const handleTocClick = async (href) => {
  try {
    const section = await bookContent.value.book.spine.get(href)
    let hrefParts = href.split('#')
    let archiveContent = await bookContent.value.book.archive.getText(`/${hrefParts[0]}`)
    selectedContent.value = archiveContent

    if (hrefParts.length > 1) {
      nextTick(() => {
        const element = document.getElementById(hrefParts[1])
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          element.parentElement.classList.add('highlight')
          setTimeout(() => {
            element.parentElement.classList.remove('highlight')
          }, 3000)
        }
      })
    }
  } catch (err) {
    errorMessage.value = 'Error loading content: ' + err.message
  }
}*/
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
      <FileEdit :book-content="bookContent" :files-content="filesContent" :files-meta="filesMeta" />
      <!--      <div class="tabs">
        <button
          v-for="tab in ['metadata', 'files', 'toc']"
          :key="tab"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab === 'toc' ? 'ToC' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>-->

      <!--      <div class="tab-content">
        <div v-if="activeTab === 'metadata'" class="metadata-panel">
          <div v-for="(value, key) in bookContent.metadata" :key="key" class="metadata-item">
            <label>{{ key }}:</label>
            <input type="text" :value="value" readonly />
          </div>
        </div>

      <div v-if="activeTab === 'files'" class="files-panel">
        <details v-for="[name, file] of filesMeta" :key="file.name" class="file-item">
          <summary>
            {{ file.name }}
          </summary>
          <div class="file-metadata">
            <p>Name: {{ file.name }}</p>
            <p>Type: {{ file.type }}</p>
            <p>Dir: {{ file.dir }}</p>
            <p>Date: {{ file.date }}</p>
            <div class="file-properties">
              <p>Properties:</p>
              <ul>
                <li v-for="(value, key) in Object.entries(file.options)" v-if="file.options" :key="key">
                  {{ key }}: {{ value }}
                </li>
              </ul>
            </div>
          </div>
          </details>
        </div>

        <div v-if="activeTab === 'toc'" class="toc-panel" style="display:none">
          <ul class="toc-list">
            <li v-for="(item, index) in tableOfContents" :key="index">
              <div class="toc-item">
              <a @click.prevent="handleTocClick(item.href)" href="#" :data-href="item.href">
                {{ item.label }}
              </a>
              <span class="href-subtitle">{{ item.href }}</span>
            </div>
            <ul v-if="item.subitems?.length" class="subitems">
              <li v-for="(subitem, subIndex) in item.subitems" :key="subIndex">
                <div class="toc-item">
                  <a
                    @click.prevent="handleTocClick(subitem.href)"
                    href="#"
                    :data-href="subitem.href"
                  >
                    {{ subitem.label }}
                  </a>
                  <span class="href-subtitle">{{ subitem.href }}</span>
                </div>
              </li>
            </ul>
            </li>
          </ul>
        </div>
      </div>-->
      <!--      <div class="view-tabs" v-if="selectedContent" style="display:none">
        <button :class="{ active: activeView === 'display' }" @click="activeView = 'display'">
          Display
      </button>
      <button :class="{ active: activeView === 'source' }" @click="activeView = 'source'">
        Source
      </button>
    </div>
    <div class="content-panel" v-if="selectedContent" style="display:none">
      <pre v-if="activeView === 'source'"><code contenteditable>{{ selectedContent }}</code></pre>
      <div v-else v-html="selectedContent"></div>
    </div>-->
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

  .tabs {
    margin-bottom: 20px;

    button {
      padding: 8px 16px;
      margin-right: 8px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;

      &.active {
        background: var(--vt-c-green);
        color: white;
        border-color: var(--vt-c-green);
      }
    }
  }

  .tab-content {
    border: 1px solid #ccc;
    padding: 20px;
    height: calc(100% - 80px);
    overflow-y: auto;
  }

  .metadata-item {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;

    label {
      min-width: 100px;
      font-weight: bold;
    }

    input {
      flex: 1;
      padding: 5px;
      border: 1px solid #ccc;
      background: #f5f5f5;
    }
  }

  .file-item {
    margin-bottom: 10px;

    summary {
      cursor: pointer;
      padding: 10px;
      background: var(--vt-c-indigo);
    }

    .file-metadata {
      padding: 10px;
      margin-left: 20px;
    }
  }

  .toc-item {
    display: flex;
    flex-direction: column;
    margin: 5px 0;

    .href-subtitle {
      font-size: 0.8em;
      color: #666;
      margin-left: 10px;
    }
  }

  .toc-panel {
    flex: 0 0 300px;
    grid-area: 1 / 1 / 3 / 2;
    overflow-y: auto;
  }

  .toc-list {
    list-style-type: none;
    padding-left: 0;

    li {
      margin: 10px 0;
    }

    a {
      text-decoration: none;
      color: #5b7fa4;
    }

    .subitems {
      list-style-type: none;
      padding-left: 20px;
    }
  }

  .view-tabs {
    margin-bottom: 10px;
    grid-area: 1 / 2 / 2 / 3;

    button {
      padding: 8px 16px;
      margin-right: 8px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;

      &.active {
        background: #2c3e50;
        color: white;
        border: 1px solid #2c3e50;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .content-panel {
    grid-area: 2 / 2 / 3 / 3;
    flex: 1;
    padding: 20px;
    border-left: 1px solid #ccc;
    max-height: 80vh;
    overflow-y: auto;

    pre {
      padding: 10px;
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
