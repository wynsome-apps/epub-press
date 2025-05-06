<template>
  <div class="file-edit">
    <div :class="['sidebar', { collapsed: !sidebarOpen }]">
      <button class="toggle-btn" @click="toggleSidebar">
        <svg-icon type="mdi" :path="sidebarButton"></svg-icon>
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SvgIcon from '@jamescoyle/vue-icon'
import { mdiBookOpen, mdiBookOpenOutline, mdiMenuClose, mdiMenuOpen } from '@mdi/js'

const props = defineProps({
  filesMeta: {
    type: Map,
    required: true,
  },
  filesContent: {
    type: Map,
    required: true,
  },
})

const sidebarButton = computed(() => {
  return sidebarOpen.value ? mdiMenuOpen : mdiMenuClose
})
const sidebarOpen = ref(true)
const selectedFile = ref(null)

const sortedFiles = computed(() => {
  return [...props.filesMeta]
    .filter(([_, meta]) => !meta.dir)
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
  display: flex;
  height: 100%;
}

.sidebar {
  position: relative;
  width: 250px;
  background: var(--color-background-soft);
  transition: width 0.3s ease;
  border-right: 1px solid var(--color-border);
}

.sidebar.collapsed {
  width: 40px;

  .file-list {
    opacity: 0.25;
    transition: opacity 0.3s ease;
  }
}

.toggle-btn {
  position: absolute;
  right: -12px;
  top: 20px;
  z-index: 1;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  cursor: pointer;
  color: var(--vt-c-text-dark-2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.file-list li {
  padding: 8px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  white-space: nowrap;
}

.file-list li.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-list li.active {
  background: var(--color-background-mute);
  color: var(--vt-c-green);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
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
  min-height: 400px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1rem;
  resize: both;
  flex-grow: 1;
}
</style>
