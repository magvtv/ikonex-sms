<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '../services/api'

interface Student {
  id?: string
  first_name: string
  last_name: string
  admission_number: string
  stream_id: string | null
  stream_name?: string
}

interface Stream {
  id: string
  name: string
  grade_level: string
}

const students = ref<Student[]>([])
const streams = ref<Stream[]>([])
const loading = ref(true)
const errorMsg = ref('')

// Modal state
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const activeStudentId = ref('')
const form = ref<Student>({
  first_name: '',
  last_name: '',
  admission_number: '',
  stream_id: null
})

// Filters
const searchQuery = ref('')
const selectedStreamFilter = ref('')

const fetchDirectory = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    const [studentsData, streamsData] = await Promise.all([
      api.get('/students'),
      api.get('/streams')
    ])
    students.value = studentsData
    streams.value = streamsData
  } catch (err: any) {
    console.error(err)
    errorMsg.value = 'Failed to load students directory.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDirectory()
})

const filteredStudents = computed(() => {
  return students.value.filter(student => {
    const nameMatch = `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase())
    const admMatch = student.admission_number
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase())
    const streamMatch = selectedStreamFilter.value === '' || student.stream_id === selectedStreamFilter.value

    return (nameMatch || admMatch) && streamMatch
  })
})

const openCreateModal = () => {
  modalMode.value = 'create'
  activeStudentId.value = ''
  form.value = {
    first_name: '',
    last_name: '',
    admission_number: '',
    stream_id: streams.value.length > 0 ? streams.value[0].id : null
  }
  showModal.value = true
}

const openEditModal = (student: Student) => {
  modalMode.value = 'edit'
  activeStudentId.value = student.id || ''
  form.value = {
    first_name: student.first_name,
    last_name: student.last_name,
    admission_number: student.admission_number,
    stream_id: student.stream_id
  }
  showModal.value = true
}

const submitForm = async () => {
  try {
    if (modalMode.value === 'create') {
      await api.post('/students', form.value)
    } else {
      await api.put(`/students/${activeStudentId.value}`, form.value)
    }
    showModal.value = false
    await fetchDirectory()
  } catch (err: any) {
    alert(err.message || 'Error saving student.')
  }
}

const deleteStudent = async (id: string) => {
  if (!confirm('Are you sure you want to delete this student record?')) return
  try {
    await api.delete(`/students/${id}`)
    await fetchDirectory()
  } catch (err: any) {
    alert(err.message || 'Error deleting student.')
  }
}
</script>

<template>
  <div class="directory-container">
    
    <!-- Header Area -->
    <div class="directory-header">
      <div>
        <h1 class="view-title">Students Directory</h1>
        <p class="view-subtitle">Manage student records, stream enrollments, and academic details.</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
        </svg>
        <span>Add Student</span>
      </button>
    </div>

    <!-- Error state -->
    <div v-if="errorMsg" class="error-banner">
      <span>{{ errorMsg }}</span>
      <button @click="fetchDirectory" class="btn-retry">Retry</button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading student profiles...</p>
    </div>

    <!-- Main Content Card -->
    <div v-else class="directory-card">
      
      <!-- Filters and Search Bar -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8c1.85 0 3.54-.64 4.9-1.69l4.39 4.39 1.41-1.41-4.39-4.39C17.36 13.54 18 11.85 18 10c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by name or admission number..." 
            v-model="searchQuery"
          />
        </div>

        <select v-model="selectedStreamFilter" class="filter-select">
          <option value="">All Class Streams</option>
          <option v-for="stream in streams" :key="stream.id" :value="stream.id">
            {{ stream.name }} ({{ stream.grade_level }})
          </option>
        </select>
      </div>

      <!-- Main Directory List -->
      <div class="table-wrapper">
        <table class="directory-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Admission No.</th>
              <th>Class Stream</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.id">
              <td data-label="Student Name">
                <div class="student-cell">
                  <div class="avatar-sm">
                    {{ student.first_name[0] }}{{ student.last_name[0] }}
                  </div>
                  <span class="student-name">{{ student.first_name }} {{ student.last_name }}</span>
                </div>
              </td>
              <td data-label="Admission No." class="code-font">{{ student.admission_number }}</td>
              <td data-label="Class Stream">
                <span class="stream-pill">{{ student.stream_name || 'Unassigned' }}</span>
              </td>
              <td data-label="Actions" class="actions-col">
                <div class="action-buttons">
                  <button @click="openEditModal(student)" class="btn-icon btn-edit" title="Edit Student">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="m18.988 2.012 3 3L19.7 7.3l-3-3zM8 16h3l8.687-8.688-3-3L8 13v3z"/>
                      <path d="M20 19H4V5h8V3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-8h-2v8z"/>
                    </svg>
                  </button>
                  <button @click="deleteStudent(student.id!)" class="btn-icon btn-delete" title="Delete Record">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8H5v12zM9 9h2v10H9V9zm4 0h2v10h-2V9zM3 5h4V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4v2H3V5zm5-1h8v1H8V4z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredStudents.length === 0">
              <td colspan="4" class="no-records">No student profiles found matching criteria.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Registration / Editing Slide-over Modal -->
    <div v-if="showModal" class="modal-backdrop" @click="showModal = false">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ modalMode === 'create' ? 'Register New Student' : 'Edit Student Details' }}</h3>
          <button @click="showModal = false" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label for="first_name">First Name</label>
              <input type="text" id="first_name" v-model="form.first_name" required placeholder="e.g. John"/>
            </div>
            <div class="form-group">
              <label for="last_name">Last Name</label>
              <input type="text" id="last_name" v-model="form.last_name" required placeholder="e.g. Smith"/>
            </div>
          </div>

          <div class="form-group">
            <label for="adm_no">Admission Number</label>
            <input 
              type="text" 
              id="adm_no" 
              v-model="form.admission_number" 
              required 
              placeholder="e.g. ADM001"
              :disabled="modalMode === 'edit'"
            />
          </div>

          <div class="form-group">
            <label for="stream_select">Assign Class Stream</label>
            <select id="stream_select" v-model="form.stream_id">
              <option :value="null">Unassigned</option>
              <option v-for="stream in streams" :key="stream.id" :value="stream.id">
                {{ stream.name }} ({{ stream.grade_level }})
              </option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Student</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
.directory-container {
  padding: var(--container-padding);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

.directory-header {
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

.directory-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex-grow: 1;
  max-width: 400px;
}

.search-input-wrapper .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input-wrapper input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  background-color: var(--bg-primary);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  transition: all var(--transition-fast);
}

.search-input-wrapper input:focus {
  border-color: var(--color-primary);
  background-color: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(15, 119, 255, 0.15);
}

.filter-select {
  padding: 10px 16px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.directory-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.directory-table th {
  padding: 14px 16px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  font-size: 0.85rem;
}

.directory-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.directory-table tbody tr:hover {
  background-color: var(--bg-hover);
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid rgba(15, 119, 255, 0.15);
}

.student-name {
  font-weight: 600;
}

.code-font {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stream-pill {
  display: inline-block;
  background-color: var(--bg-primary);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
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

/* Modals Backdrops & Forms */
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
  max-width: 500px;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  width: 100%;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--color-primary);
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

/* Error state banner styling */
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

/* Loading state styling */
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

.directory-table td.no-records {
  text-align: center !important;
  color: var(--text-secondary);
  padding: 32px 16px !important;
}
.directory-table td.no-records::before {
  display: none;
}

/* Small Viewports - Mobile Table Restructure (< 768px) */
@media (max-width: 767.98px) {
  .directory-table, 
  .directory-table thead, 
  .directory-table tbody, 
  .directory-table th, 
  .directory-table td, 
  .directory-table tr { 
    display: block; 
  }
  
  .directory-table thead tr { 
    position: absolute;
    top: -9999px;
    left: -9999px;
  }
  
  .directory-table tbody tr { 
    border: 1px solid var(--border-color); 
    margin-bottom: 16px;
    border-radius: var(--border-radius-md);
    background: var(--bg-secondary);
    padding: 8px 16px;
  }
  
  .directory-table td { 
    border: none;
    border-bottom: 1px dashed var(--border-color);
    position: relative;
    padding: 10px 0 10px 45%; 
    text-align: right;
  }
  
  .directory-table td:last-child {
    border-bottom: none;
  }
  
  .directory-table td::before { 
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
  
  .student-cell {
    justify-content: flex-end;
  }
  
  .avatar-sm {
    display: none;
  }
}
</style>
