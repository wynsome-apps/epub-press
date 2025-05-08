class Database {
  constructor() {
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('epub-press', 1)

      request.onerror = (event) => {
        console.error('Database error:', event.target.error)
        reject(event.target.error)
      }

      request.onupgradeneeded = (event) => {
        this.db = event.target.result
        if (!this.db.objectStoreNames.contains('books')) {
          this.db.createObjectStore('books', { keyPath: 'id', autoIncrement: true })
        }
        if (!this.db.objectStoreNames.contains('files')) {
          const filesStore = this.db.createObjectStore('files', {
            keyPath: 'id',
            autoIncrement: true,
          })
          filesStore.createIndex('bookId', 'bookId', { unique: false })
        }
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve()
      }
    })
  }

  async addBook(bookData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['books'], 'readwrite')
      const bookStore = transaction.objectStore('books')
      const request = bookStore.add(bookData)

      request.onsuccess = (event) => {
        resolve(event.target.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async addFile(fileData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readwrite')
      const filesStore = transaction.objectStore('files')
      const request = filesStore.add(fileData)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async addFilesForBook(bookId, files) {
    for (const file of files) {
      await this.addFile({
        bookId,
        ...file,
      })
    }
  }

  async getBookFiles(bookId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly')
      const filesStore = transaction.objectStore('files')
      const index = filesStore.index('bookId')
      const request = index.getAll(bookId)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async getBooks() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['books'], 'readonly')
      const bookStore = transaction.objectStore('books')
      const request = bookStore.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async deleteBook(bookId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files', 'books'], 'readwrite')
      const filesStore = transaction.objectStore('files')
      const booksStore = transaction.objectStore('books')

      const index = filesStore.index('bookId')
      const filesRequest = index.openCursor(bookId)

      filesRequest.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          const bookRequest = booksStore.delete(bookId)
          bookRequest.onsuccess = () => resolve()
          bookRequest.onerror = () => reject(bookRequest.error)
        }
      }

      filesRequest.onerror = () => reject(filesRequest.error)
    })
  }
}

export const db = new Database()
