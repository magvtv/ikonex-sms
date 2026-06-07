<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

interface Subject {
  id?: string
  name: string
  code: string
  streams?: { id: string; name: string }[]
}

interface Stream {
  id: string
  name: string
}

const subjects = ref<Subject[]>([])
const streams = ref<Stream[]>([])
const loading = ref(true)
const errorMsg = ref('')

// Modal state
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const activeSubjectId = ref('')
const form = ref({
  name: '',
  code: '',
  stream_ids: [] as string[]
})

const fetchSubjects = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    const [subsRes, streamsRes] = await Promise.all([
      api.get('/subjects'),
      api.get('/streams')
    ])
    subjects.value = subsRes
    streams.value = streamsRes
  } catch (err: any) {
    console.error(err)
    errorMsg.value = 'Failed to load subjects.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSubjects()
})

const openCreateModal = () => {
  modalMode.value = 'create'
  activeSubjectId.value = ''
  form.value = {
    name: '',
    code: '',
    stream_ids: []
  }
  showModal.value = true
}

const openEditModal = (subject: Subject) => {
  modalMode.value = 'edit'
  activeSubjectId.value = subject.id || ''
  form.value = {
    name: subject.name,
    code: subject.code,
    stream_ids: subject.streams ? subject.streams.map(s => s.id) : []
  }
  showModal.value = true
}

const toggleStreamSelection = (id: string) => {
  const idx = form.value.stream_ids.indexOf(id)
  if (idx > -1) {
    form.value.stream_ids.splice(idx, 1)
  } else {
    form.value.stream_ids.push(id)
  }
}

const submitForm = async () => {
  try {
    if (modalMode.value === 'create') {
      await api.post('/subjects', form.value)
    } else {
      await api.put(`/subjects/${activeSubjectId.value}`, form.value)
    }
    showModal.value = false
    await fetchSubjects()
  } catch (err: any) {
    alert(err.message || 'Error saving subject.')
  }
}

const deleteSubject = async (id: string) => {
  if (!confirm('Are you sure you want to delete this subject? Academic records associated with it will also be lost.')) return
  try {
    await api.delete(`/subjects/${id}`)
    await fetchSubjects()
  } catch (err: any) {
    alert(err.message || 'Error deleting subject.')
  }
}
</script>

<template>
  <div class="subjects-container">
    <div class="subjects-header">
      <div>
        <h1 class="view-title">Subjects Directory</h1>
        <p class="view-subtitle">Manage subject courses, codes, and map them to class streams.</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
        </svg>
        <span>Add Subject</span>
      </button>
    </div>

    <!-- Error state -->
    <div v-if="errorMsg" class="error-banner">
      <span>{{ errorMsg }}</span>
      <button @click="fetchSubjects" class="btn-retry">Retry</button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading subjects...</p>
    </div>

    <!-- Subjects Card / Table -->
    <div v-else class="subjects-card">
      <div class="table-wrapper">
        <table class="subjects-table">
          <thead>
            <tr>
              <th>Subject Name</th>
              <th>Subject Code</th>
              <th>Mapped Streams</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subject in subjects" :key="subject.id">
              <td data-label="Subject Name" class="bold-font">{{ subject.name }}</td>
              <td data-label="Subject Code" class="code-font">{{ subject.code }}</td>
              <td data-label="Mapped Streams">
                <div class="streams-pills-row">
                  <span v-for="st in subject.streams" :key="st.id" class="stream-badge-pill">
                    {{ st.name }}
                  </span>
                  <span v-if="!subject.streams || subject.streams.length === 0" class="muted-text">
                    No streams mapped
                  </span>
                </div>
              </td>
              <td data-label="Actions" class="actions-col">
                <div class="action-buttons">
                  <button @click="openEditModal(subject)" class="btn-icon btn-edit" title="Edit Subject">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="m18.988 2.012 3 3L19.7 7.3l-3-3zM8 16h3l8.687-8.688-3-3L8 13v3z"/>
                      <path d="M20 19H4V5h8V3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-8h-2v8z"/>
                    </svg>
                  </button>
                  <button @click="deleteSubject(subject.id!)" class="btn-icon btn-delete" title="Delete Subject">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8H5v12zM9 9h2v10H9V9zm4 0h2v10h-2V9zM3 5h4V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4v2H3V5zm5-1h8v1H8V4z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="subjects.length === 0">
              <td colspan="4" class="no-records">No subjects configured. Add one above.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-backdrop" @click="showModal = false">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ modalMode === 'create' ? 'Add New Subject' : 'Edit Subject Mapping' }}</h3>
          <button @click="showModal = false" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-group">
            <label for="sub_name">Subject Name</label>
            <input type="text" id="sub_name" v-model="form.name" required placeholder="e.g. Chemistry"/>
          </div>

          <div class="form-group">
            <label for="sub_code">Subject Code</label>
            <input type="text" id="sub_code" v-model="form.code" required placeholder="e.g. CHEM101"/>
          </div>

          <div class="form-group">
            <label>Map to Streams</label>
            <div class="checkbox-grid">
              <label 
                v-for="st in streams" 
                :key="st.id" 
                class="checkbox-item-label"
                :class="{ 'checkbox-checked': form.stream_ids.includes(st.id) }"
              >
                <input 
                  type="checkbox" 
                  :value="st.id" 
                  :checked="form.stream_ids.includes(st.id)"
                  @change="toggleStreamSelection(st.id)"
                />
                <span>{{ st.name }}</span>
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Subject</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subjects-container {
  padding: var(--container-padding);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

.subjects-header {
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

.subjects-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.subjects-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.subjects-table th {
  padding: 14px 16px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  font-size: 0.85rem;
}

.subjects-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.subjects-table tbody tr:hover {
  background-color: var(--bg-hover);
}

.bold-font {
  font-weight: 600;
}

.code-font {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.streams-pills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stream-badge-pill {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid rgba(15, 119, 255, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.muted-text {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.actions-col {
  text-align: right;
  width: 120px;
}

.action-buttons {
  display: inline-flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-edit {
  color: var(--color-info-text);
  background-color: var(--color-info-bg);
}

.btn-edit:hover {
  background-color: #e5dbff;
}

.btn-delete {
  color: var(--color-danger-text);
  background-color: var(--color-danger-bg);
}

.btn-delete:hover {
  background-color: #fee2e2;
}

/* Modal Checkbox Grid */
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: var(--border-radius-sm);
  background: var(--bg-primary);
}

.checkbox-item-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color var(--transition-fast);
}

.checkbox-item-label:hover {
  background-color: var(--bg-hover);
}

.checkbox-checked {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
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

.no-records {
  text-align: center;
  color: var(--text-secondary);
  padding: 32px !important;
}

/* Small Viewports - Mobile Table Restructure (< 768px) */
@media (max-width: 767.98px) {
  .subjects-table, 
  .subjects-table thead, 
  .subjects-table tbody, 
  .subjects-table th, 
  .subjects-table td, 
  .subjects-table tr { 
    display: block; 
  }
  
  .subjects-table thead tr { 
    position: absolute;
    top: -9999px;
    left: -9999px;
  }
  
  .subjects-table tbody tr { 
    border: 1px solid var(--border-color); 
    margin-bottom: 16px;
    border-radius: var(--border-radius-md);
    background: var(--bg-secondary);
    padding: 8px 16px;
  }
  
  .subjects-table td { 
    border: none;
    border-bottom: 1px dashed var(--border-color);
    position: relative;
    padding: 10px 0 10px 45%; 
    text-align: right;
  }
  
  .subjects-table td:last-child {
    border-bottom: none;
  }
  
  .subjects-table td::before { 
    position: absolute;
    left: 0;
    width: 40%; 
    padding-right: 10px; 
    white-space: nowrap;
    text-align: left;
    font-weight: 600;
    color: var(--text-secondary);
    content: attr(data-label);
  }
  
  .actions-col {
    width: 100%;
    text-align: right;
  }
  
  .streams-pills-row {
    justify-content: flex-end;
  }
}
</style>
