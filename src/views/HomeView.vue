<script setup>
import TheWelcome from '../components/TheWelcome.vue'
import { ref } from 'vue'

const selectedFile = ref(null)
const errorMessage = ref('')

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.name.endsWith('.epub')) {
    selectedFile.value = file
    errorMessage.value = ''
  } else {
    selectedFile.value = null
    errorMessage.value = 'Please select a valid .epub file'
  }
}
</script>

<template>
  <main>
    <TheWelcome />
    <div class="file-upload">
      <input type="file" accept=".epub" @change="handleFileUpload" class="file-input" />
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p v-if="selectedFile">Selected file: {{ selectedFile.name }}</p>
    </div>
  </main>
</template>

<style scoped>
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
</style>
