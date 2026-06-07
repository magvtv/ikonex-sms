<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '../services/api'

interface Stream {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  code: string
  streams?: { id: string }[]
}

interface ScoreRow {
  student_id: string
  first_name: string
  last_name: string
  admission_number: string
  score: number | null | string
  grade: string
  status: string
}

const streams = ref<Stream[]>([])
const subjects = ref<Subject[]>([])
const scores = ref<ScoreRow[]>([])

const loading = ref(false)
const fetchingConfig = ref(true)
const saving = ref(false)
const errorMsg = ref('')

// Selected matrix parameters
const selectedStream = ref('')
const selectedSubject = ref('')
const selectedTerm = ref('Term 1 - 2026')
const selectedType = ref('CAT 1')

const terms = ['Term 1 - 2026', 'Term 2 - 2026', 'Term 3 - 2026']
const assessmentTypes = ['CAT 1', 'CAT 2', 'Main Exam']

const fetchConfiguration = async () => {
  try {
    fetchingConfig.value = true
    const [streamsRes, subjectsRes] = await Promise.all([
      api.get('/streams'),
      api.get('/subjects')
    ])
    streams.value = streamsRes
    subjects.value = subjectsRes
    
    if (streams.value.length > 0) {
      selectedStream.value = streams.value[0].id
    }
  } catch (err: any) {
    console.error(err)
    errorMsg.value = 'Failed to load gradebook configurations.'
  } finally {
    fetchingConfig.value = false
  }
}

// Filter subjects available for the selected stream
const availableSubjects = computed(() => {
  if (!selectedStream.value) return []
  return subjects.value.filter(sub => 
    sub.streams && sub.streams.some(st => st.id === selectedStream.value)
  )
})

// Auto-select first available subject when stream changes
watch(selectedStream, () => {
  if (availableSubjects.value.length > 0) {
    selectedSubject.value = availableSubjects.value[0].id
  } else {
    selectedSubject.value = ''
  }
})

// Fetch score ledger for current filters
const fetchScores = async () => {
  if (!selectedStream.value || !selectedSubject.value || !selectedTerm.value || !selectedType.value) {
    scores.value = []
    return
  }

  try {
    loading.value = true
    errorMsg.value = ''
    
    const url = `/scores?stream_id=${selectedStream.value}&subject_id=${selectedSubject.value}&academic_term=${encodeURIComponent(selectedTerm.value)}&assessment_type=${encodeURIComponent(selectedType.value)}`
    const data = await api.get(url)
    
    // Map scores to be string inputs so users can delete values easily
    scores.value = data.map((d: any) => ({
      ...d,
      score: d.score !== null ? String(d.score) : ''
    }))
  } catch (err: any) {
    console.error(err)
    errorMsg.value = 'Failed to fetch score ledger.'
  } finally {
    loading.value = false
  }
}

// Watch filters and fetch automatically
watch([selectedStream, selectedSubject, selectedTerm, selectedType], () => {
  fetchScores()
}, { immediate: false })

onMounted(async () => {
  await fetchConfiguration()
  fetchScores()
})

const validateScoreInput = (val: string | number | null) => {
  if (val === '' || val === null) return true
  const num = Number(val)
  return !isNaN(num) && num >= 0 && num <= 100
}

const saveScores = async () => {
  // Validate all inputs first
  const invalid = scores.value.some(s => !validateScoreInput(s.score))
  if (invalid) {
    alert('Please correct invalid scores. Scores must be numbers between 0 and 100.')
    return
  }

  try {
    saving.value = true
    errorMsg.value = ''

    const payload = {
      subject_id: selectedSubject.value,
      academic_term: selectedTerm.value,
      assessment_type: selectedType.value,
      scores: scores.value.map(s => ({
        student_id: s.student_id,
        score: s.score === '' ? null : Number(s.score)
      }))
    }

    await api.post('/scores/bulk', payload)
    await fetchScores() // reload to get new grades mapped
    alert('Grade sheet saved successfully.')
  } catch (err: any) {
    console.error(err)
    errorMsg.value = err.message || 'Failed to save scores.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="gradebook-container">
    <div class="gradebook-header">
      <div>
        <h1 class="view-title">Assessments Gradebook</h1>
        <p class="view-subtitle">Enter student scores, compile grades, and manage exam matrices.</p>
      </div>
      <button 
        @click="saveScores" 
        class="btn-primary" 
        :disabled="scores.length === 0 || saving"
      >
        <svg v-if="saving" class="spinner-btn" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M7 19h10V10H7v9zm3-7h4v5h-4v-5zm-5-7v16h14V5H5zm12 2v2H7V7h10z"/>
        </svg>
        <span>{{ saving ? 'Saving...' : 'Save Grade Sheet' }}</span>
      </button>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMsg" class="error-banner">
      <span>{{ errorMsg }}</span>
    </div>

    <!-- Filter selectors matrix -->
    <div class="matrix-filter-card">
      <div class="filter-group">
        <label for="stream">Class Stream</label>
        <select id="stream" v-model="selectedStream" :disabled="fetchingConfig">
          <option value="" disabled>Select Stream</option>
          <option v-for="st in streams" :key="st.id" :value="st.id">{{ st.name }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="subject">Subject Offered</label>
        <select id="subject" v-model="selectedSubject" :disabled="fetchingConfig || !selectedStream">
          <option value="" disabled>Select Subject</option>
          <option v-for="sub in availableSubjects" :key="sub.id" :value="sub.id">
            {{ sub.name }} ({{ sub.code }})
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="term">Academic Term</label>
        <select id="term" v-model="selectedTerm">
          <option v-for="t in terms" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="type">Assessment Type</label>
        <select id="type" v-model="selectedType">
          <option v-for="type in assessmentTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
    </div>

    <!-- Score ledger sheet -->
    <div class="gradebook-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching class ledger...</p>
      </div>
      
      <div v-else-if="!selectedStream || !selectedSubject" class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="var(--text-muted)">
          <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zm-8 4h6v2h-6V7zm0 4h6v2h-6v-2zm-4-4h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4 2h6v-2h-6v2z"/>
        </svg>
        <p>Select a class stream and corresponding subject above to load the grading matrix.</p>
      </div>

      <div v-else-if="scores.length === 0" class="empty-state">
        <p>No students enrolled in this stream. Go to Students page to enroll students first.</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="grade-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Admission No.</th>
              <th>Term / Exam Type</th>
              <th class="score-input-col">Score (0 - 100)</th>
              <th class="grade-col">Calculated Grade</th>
              <th class="status-col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in scores" :key="row.student_id">
              <td>
                <div class="student-cell">
                  <div class="avatar-sm">
                    {{ row.first_name[0] }}{{ row.last_name[0] }}
                  </div>
                  <span class="student-name">{{ row.first_name }} {{ row.last_name }}</span>
                </div>
              </td>
              <td class="code-font">{{ row.admission_number }}</td>
              <td class="muted-text">{{ selectedTerm }} / {{ selectedType }}</td>
              <td class="score-input-col">
                <input 
                  type="text" 
                  v-model="row.score" 
                  class="score-input"
                  :class="{ 'input-invalid': !validateScoreInput(row.score) }"
                  placeholder="--"
                  maxlength="6"
                />
              </td>
              <td class="grade-col">
                <span :class="['grade-badge', { 
                  'grade-high': ['A', 'A-', 'B+'].includes(row.grade), 
                  'grade-mid': ['B', 'B-', 'C+', 'C', 'C-'].includes(row.grade),
                  'grade-low': ['D+', 'D', 'D-', 'E'].includes(row.grade)
                }]">
                  {{ row.grade }}
                </span>
              </td>
              <td class="status-col">
                <span :class="['badge', row.score !== '' ? 'badge-success' : 'badge-warning']">
                  {{ row.score !== '' ? 'Completed' : 'Pending' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gradebook-container {
  padding: var(--container-padding);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

.gradebook-header {
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
  transition: all var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-btn {
  animation: spin 1s linear infinite;
}

/* Matrix layout filter */
.matrix-filter-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-group select {
  padding: 10px 12px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.filter-group select:focus {
  border-color: var(--color-primary);
}

.gradebook-card {
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

.grade-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.grade-table th {
  padding: 14px 16px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  font-size: 0.85rem;
}

.grade-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
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

.muted-text {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.score-input-col {
  width: 140px;
}

.score-input {
  width: 90px;
  padding: 8px 12px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: right;
  outline: none;
  transition: all var(--transition-fast);
}

.score-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(15, 119, 255, 0.15);
}

.input-invalid {
  border-color: var(--color-danger) !important;
  background-color: var(--color-danger-bg) !important;
  color: var(--color-danger-text) !important;
}

.grade-col, .status-col {
  width: 150px;
}

.grade-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
}

.grade-high {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.grade-mid {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
}

.grade-low {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: var(--text-muted);
  gap: 16px;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
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

.error-banner {
  background-color: var(--color-danger-bg);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-danger-text);
  padding: 12px 16px;
  border-radius: var(--border-radius-md);
  font-weight: 500;
}

/* Responsive Grid adaptations */
@media (max-width: 1024px) {
  .matrix-filter-card {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .matrix-filter-card {
    grid-template-columns: 1fr;
  }
}
</style>
