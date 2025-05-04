<script setup>
import TheWelcome from '../components/TheWelcome.vue'
import { ref, nextTick } from 'vue'
import { Book } from 'epubjs'

const showUpload = ref(true)
const tableOfContents = ref([])

const selectedFile = ref(null)
const errorMessage = ref('')
const bookContent = ref(null)
const selectedContent = ref(null)

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

const parseEpub = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const book = new Book(e.target.result)

    book.loaded.metadata
      .then((metadata) => {
        bookContent.value = {
          title: metadata.title,
          creator: metadata.creator,
          language: metadata.language,
          spine: book.spine,
          book: book,
        }
        book.loaded.navigation.then((toc) => {
          tableOfContents.value = toc.toc
          showUpload.value = false
        })
        // book.loaded.spine.then(async (data) => {
        //   // const content = await data.spineItems[0].render();
        //   console.log(data)
        // })
        // book.archive.getText('/index_split_001.html').then((text) => {
        //   console.log(text)
        // })
        // book.archive.request('/index_split_001.html').then((data) => {
        //   console.log(data)
        // })
      })
      .catch((err) => {
        errorMessage.value = 'Error parsing epub file: ' + err.message
      })
  }
  reader.onerror = (err) => {
    errorMessage.value = 'Error reading file: ' + err.message
  }
  reader.readAsArrayBuffer(file)
}

const handleTocClick = async (href) => {
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
    </div>
    <div v-else class="book-content">
      <div class="toc-panel">
        <h1>{{ bookContent.title }}</h1>
        <h2>Table of Contents</h2>
        <ul class="toc-list">
          <li v-for="(item, index) in tableOfContents" :key="index">
            <a @click.prevent="handleTocClick(item.href)" href="#" :data-href="item.href">{{
              item.label
            }}</a>
            <ul v-if="item.subitems?.length" class="subitems">
              <li v-for="(subitem, subIndex) in item.subitems" :key="subIndex">
                <a
                  @click.prevent="handleTocClick(subitem.href)"
                  href="#"
                  :data-href="subitem.href"
                  >{{ subitem.label }}</a
                >
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <div class="content-panel" v-if="selectedContent" v-html="selectedContent"></div>
    </div>
  </main>
</template>

<style>
.file-upload {
  margin: 20px;
  padding: 20px;
  border: 2px dashed #ccc;
  border-radius: 4px;
}

.file-input {
  margin-bottom: 10px;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.book-content {
  padding: 20px;
  display: flex;
  gap: 20px;
}

.toc-panel {
  flex: 0 0 300px;
}

.content-panel {
  flex: 1;
  padding: 20px;
  border-left: 1px solid #ccc;
  max-height: 80vh;
  overflow-y: auto;
}

.toc-list {
  list-style-type: none;
  padding-left: 0;
}

.subitems {
  list-style-type: none;
  padding-left: 20px;
}

.toc-list a {
  text-decoration: none;
  color: #2c3e50;
}

.toc-list li {
  margin: 10px 0;
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
