<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

interface Stream {
  id?: string
  name: string
  grade_level: string
  student_count?: number
}

const streams = ref<Stream[]>([])
const loading = ref(true)
const errorMsg = ref('')

const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const activeStreamId = ref('')
const form = ref<Stream>({
  name: '',
  grade_level: 'Form 1'
})

const gradeLevels = ['Form 1', 'Form 2', 'Form 3', 'Form 4']

const fetchStreams = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    streams.value = await api.get('/streams')
  } catch (err: any) {
    console.error(err)
    errorMsg.value = 'Failed to load streams.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStreams()
})

const openCreateModal = () => {
  modalMode.value = 'create'
  activeStreamId.value = ''
  form.value = {
    name: '',
    grade_level: 'Form 1'
  }
  showModal.value = true
}

const openEditModal = (stream: Stream) => {
  modalMode.value = 'edit'
  activeStreamId.value = stream.id || ''
  form.value = {
    name: stream.name,
    grade_level: stream.grade_level
  }
  showModal.value = true
}

const submitForm = async () => {
  try {
    if (modalMode.value === 'create') {
      await api.post('/streams', form.value)
    } else {
      await api.put(`/streams/${activeStreamId.value}`, form.value)
    }
    showModal.value = false
    await fetchStreams()
  } catch (err: any) {
    alert(err.message || 'Error saving stream.')
  }
}

const deleteStream = async (id: string) => {
  if (!confirm('Are you sure you want to delete this stream? Students in this stream will be unassigned.')) return
  try {
    await api.delete(`/streams/${id}`)
    await fetchStreams()
  } catch (err: any) {
    alert(err.message || 'Error deleting stream.')
  }
}
</script>

<template>
  <div class="streams-container">
    <div class="streams-header">
      <div>
        <h1 class="view-title">Class Streams</h1>
        <p class="view-subtitle">Manage class streams, grade levels, and monitor student counts.</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
        </svg>
        <span>Add Stream</span>
      </button>
    </div>

    <!-- Error state -->
    <div v-if="errorMsg" class="error-banner">
      <span>{{ errorMsg }}</span>
      <button @click="fetchStreams" class="btn-retry">Retry</button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading streams...</p>
    </div>

    <!-- Stream Cards Grid -->
    <div v-else class="streams-grid">
      <div v-for="stream in streams" :key="stream.id" class="stream-card">
        <div class="stream-card-body">
          <span class="stream-grade-badge">{{ stream.grade_level }}</span>
          <h3 class="stream-name">{{ stream.name }}</h3>
          
          <div class="stream-stat">
            <span class="stat-number">{{ stream.student_count || 0 }}</span>
            <span class="stat-label">Enrolled Students</span>
          </div>
        </div>

        <div class="stream-card-actions">
          <button @click="openEditModal(stream)" class="action-btn edit-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="m18.988 2.012 3 3L19.7 7.3l-3-3zM8 16h3l8.687-8.688-3-3L8 13v3z"/>
              <path d="M20 19H4V5h8V3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-8h-2v8z"/>
            </svg>
            <span>Edit</span>
          </button>
          <button @click="deleteStream(stream.id!)" class="action-btn delete-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8H5v12zM9 9h2v10H9V9zm4 0h2v10h-2V9zM3 5h4V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4v2H3V5zm5-1h8v1H8V4z"/>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div v-if="streams.length === 0" class="no-records-card">
        <p>No streams configured yet. Click "Add Stream" to start.</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-backdrop" @click="showModal = false">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ modalMode === 'create' ? 'Create Class Stream' : 'Edit Stream' }}</h3>
          <button @click="showModal = false" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-group">
            <label for="stream_name">Stream Name</label>
            <input type="text" id="stream_name" v-model="form.name" required placeholder="e.g. Form 1 Alpha"/>
          </div>

          <div class="form-group">
            <label for="grade_level">Grade Level</label>
            <select id="grade_level" v-model="form.grade_level">
              <option v-for="level in gradeLevels" :key="level" :value="level">{{ level }}</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Stream</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.streams-container {
  padding: var(--container-padding);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

.streams-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.view-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
}

.view-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 2px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: #fff;
  padding: 10px 18px;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(15, 119, 255, 0.2);
  transition: background-color var(--transition-fast);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.streams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.stream-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stream-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.stream-card-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-grow: 1;
}

.stream-grade-badge {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.stream-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.stream-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stream-card-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-hover);
}

.action-btn {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.edit-btn:hover {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.delete-btn {
  border-left: 1px solid var(--border-color);
}

.delete-btn:hover {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.no-records-card {
  grid-column: 1 / -1;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 48px;
  text-align: center;
  color: var(--text-secondary);
  border: 1px dashed var(--border-color);
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  width: 100%;
  max-width: 450px;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.close-btn {
  font-size: 1.5rem;
  color: var(--text-secondary);
  padding: 4px;
}

.modal-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.btn-secondary {
  padding: 10px 16px;
  border-radius: var(--border-radius-sm);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-weight: 600;
}

.error-banner {
  background-color: var(--color-danger-bg);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-danger-text);
  padding: 12px 16px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-retry {
  margin-left: auto;
  background-color: var(--color-danger);
  color: #fff;
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: var(--text-secondary);
  gap: 16px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
