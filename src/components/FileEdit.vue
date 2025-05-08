<template>
  <div class="file-edit">
    <div class="main-content">
      <div v-if="selectedFile" class="file-container">
        <div class="title-row">
          <h3 class="file-title">{{ selectedFile }}</h3>
          <button class="save-button" :disabled="!isModified" @click="handleSave">Save</button>
        </div>
        <textarea
          class="file-content"
          v-model="fileContent"
          @input="handleContentChange"
        ></textarea>
      </div>
    </div>
    <div :class="['bottom-sheet', { expanded: sidebarOpen }]">
      <button class="expand-btn" @click="toggleSidebar">
        <svg-icon type="mdi" :path="sidebarOpen ? mdiChevronDown : mdiChevronUp"></svg-icon>
      </button>
      <ul class="file-list">
        <li
          v-for="[key, meta] in sortedFiles"
          :key="key"
          :class="{ active: selectedFile === key, disabled: !meta.isText }"
          @click="meta.isText && selectFile(key)"
        >
          {{ key }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SvgIcon from '@jamescoyle/vue-icon'
import { mdiChevronUp, mdiChevronDown } from '@mdi/js'

const props = defineProps({
  filesMeta: {
    type: Map,
    required: true,
  },
  filesContent: {
    type: Map,
    required: true,
  },
  bookContent: {
    type: Object,
    required: true,
  },
})

const sidebarOpen = ref(true)
const selectedFile = ref(null)

const sortedFiles = computed(() => {
  return [...props.filesMeta]
    .filter(([, meta]) => !meta.dir)
    .sort((a, b) => a[0].localeCompare(b[0]))
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const fileContent = ref('')
const isModified = ref(false)
const emit = defineEmits(['update:content', 'save'])

const selectFile = (fileName) => {
  selectedFile.value = fileName
  fileContent.value = props.filesContent.get(fileName)
  isModified.value = false
  sidebarOpen.value = false
}

const handleContentChange = () => {
  isModified.value = true
  emit('update:content', { file: selectedFile.value, content: fileContent.value })
}

const handleSave = () => {
  props.filesContent.set(selectedFile.value, fileContent.value)
  isModified.value = false
  sidebarOpen.value = true
  emit('save', { file: selectedFile.value, content: fileContent.value })
}
</script>

<style scoped>
.file-edit {
  --animation-duration: 0.5s;
  display: flex;
  height: 100%;
  position: relative;
}

.sidebar {
  position: relative;
  width: 250px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--color-background-soft);
  transition: width var(--animation-duration) ease;
  border-right: 1px solid var(--color-border);
}

.sidebar.collapsed {
  width: 0px;

  .file-list {
    opacity: 0.25;
    transition: opacity var(--animation-duration) ease;
  }

  & + .main-content {
    padding-inline: 0;

    .book-header {
      .toggle-btn,
      h2 {
        left: 0;
      }
    }

    .save-button {
      visibility: visible;
    }
  }

  .export-btn {
    opacity: 0;
    pointer-events: none;
  }
}

.toggle-btn {
  position: relative;
  //right: -20px;
  //top: 0px;
  left: -2rem;
  z-index: 1;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  cursor: pointer;
  color: var(--vt-c-text-dark-2);
  margin-inline: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: left var(--animation-duration) ease;
}

.file-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  overflow: auto;
  scrollbar-width: thin;

  li {
    padding: 8px;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    white-space: nowrap;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    &.active {
      background: var(--color-background-mute);
      color: var(--vt-c-green);
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;

  transition: padding-inline var(--animation-duration) ease;
}

.file-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  margin-inline: 1rem;
  transition: margin-inline-start var(--animation-duration) ease;
}

.file-title {
  margin: 0;
  color: var(--color-heading);
}

.save-button {
  padding: 0.5rem 1rem;
  background-color: var(--vt-c-green);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity var(--animation-duration) ease visibility var(--animation-duration) ease;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-content {
  white-space: nowrap;
  font-family: monospace;
  color: var(--vt-c-text-dark-2);
  line-height: 1.4;
  width: 100%;
  box-sizing: border-box;
  min-height: 400px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1rem;
  resize: both;
  flex-grow: 1;
}

.bottom-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  background: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
  transition: height var(--animation-duration) ease;
  /*overflow: hidden;*/
  height: 2rem;

  .file-list {
    opacity: 0.5;
    transition: opacity var(--animation-duration) ease;
  }
  &.expanded {
    height: 50vh;
    .file-list {
      opacity: 1;
    }
  }

  .expand-btn {
    --animation-duration: 1s;
    position: absolute;
    top: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem;
    background: var(--color-background-mute);
    border: solid 1px var(--color-border);
    border-radius: 50%;
    color: var(--vt-c-text-dark-2);
    cursor: pointer;
    transition: top var(--animation-duration) ease;
  }
}
</style>
