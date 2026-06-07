<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api } from '../services/api'

interface RankRow {
  student_id: string
  first_name: string
  last_name: string
  admission_number: string
  stream_name: string
  mean_score: number
  term_rank: number
  overall_grade: string
}

interface Stream {
  id: string
  name: string
}

const streams = ref<Stream[]>([])
const rankings = ref<RankRow[]>([])
const loading = ref(false)
const fetchingConfig = ref(true)
const errorMsg = ref('')

const selectedStream = ref('')
const selectedTerm = ref('Term 1 - 2026')

const terms = ['Term 1 - 2026', 'Term 2 - 2026', 'Term 3 - 2026']

const fetchConfiguration = async () => {
  try {
    fetchingConfig.value = true
    streams.value = await api.get('/streams')
    
    if (streams.value.length > 0) {
      selectedStream.value = streams.value[0].id
    }
  } catch (err: any) {
    console.error(err)
    errorMsg.value = 'Failed to load streams config.'
  } finally {
    fetchingConfig.value = false
  }
}

const fetchRankings = async () => {
  if (!selectedTerm.value) return
  
  try {
    loading.value = true
    errorMsg.value = ''
    
    let url = `/reports/rankings?academic_term=${encodeURIComponent(selectedTerm.value)}`
    if (selectedStream.value) {
      url += `&stream_id=${selectedStream.value}`
    }

    rankings.value = await api.get(url)
  } catch (err: any) {
    console.error(err)
    errorMsg.value = 'Failed to fetch rankings ledger.'
  } finally {
    loading.value = false
  }
}

// Watch filters
watch([selectedStream, selectedTerm], () => {
  fetchRankings()
})

onMounted(async () => {
  await fetchConfiguration()
  fetchRankings()
})

const getDownloadUrl = (studentId: string) => {
  return `http://localhost:3000/api/reports/pdf/${studentId}?academic_term=${encodeURIComponent(selectedTerm.value)}`
}
</script>

<template>
  <div class="reports-container">
    <div class="reports-header">
      <div>
        <h1 class="view-title">Reports & Rankings</h1>
        <p class="view-subtitle">Compile term rankings using database window functions and generate printable PDF report cards.</p>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMsg" class="error-banner">
      <span>{{ errorMsg }}</span>
    </div>

    <!-- Filters -->
    <div class="filter-card">
      <div class="filter-group">
        <label for="term_select">Academic Term</label>
        <select id="term_select" v-model="selectedTerm">
          <option v-for="t in terms" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="stream_filter">Filter by Stream</label>
        <select id="stream_filter" v-model="selectedStream" :disabled="fetchingConfig">
          <option value="">All Streams (School Rankings)</option>
          <option v-for="st in streams" :key="st.id" :value="st.id">{{ st.name }}</option>
        </select>
      </div>
    </div>

    <!-- Rankings Card -->
    <div class="rankings-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Calculating term rankings...</p>
      </div>

      <div v-else-if="rankings.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="var(--text-muted)">
          <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
          <path d="M11 11h2v6h-2zm0-4h2v2h-2z"/>
        </svg>
        <p>No assessment data recorded for this term. Add scores in Gradebook first to see ranking results.</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="rankings-table">
          <thead>
            <tr>
              <th class="rank-col">Rank</th>
              <th>Student Name</th>
              <th>Admission No.</th>
              <th>Class Stream</th>
              <th class="score-col">Mean Score</th>
              <th class="grade-col">Overall Grade</th>
              <th class="actions-col">Report Card</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rankings" :key="row.student_id">
              <td class="rank-col">
                <span :class="['rank-badge', { 
                  'rank-first': row.term_rank === 1,
                  'rank-second': row.term_rank === 2,
                  'rank-third': row.term_rank === 3
                }]">
                  #{{ row.term_rank }}
                </span>
              </td>
              <td>
                <div class="student-cell">
                  <div class="avatar-sm">
                    {{ row.first_name[0] }}{{ row.last_name[0] }}
                  </div>
                  <span class="student-name">{{ row.first_name }} {{ row.last_name }}</span>
                </div>
              </td>
              <td class="code-font">{{ row.admission_number }}</td>
              <td>{{ row.stream_name }}</td>
              <td class="score-col bold-font">{{ row.mean_score }}%</td>
              <td class="grade-col">
                <span :class="['grade-badge', { 
                  'grade-high': ['A', 'A-', 'B+'].includes(row.overall_grade), 
                  'grade-mid': ['B', 'B-', 'C+', 'C', 'C-'].includes(row.overall_grade),
                  'grade-low': ['D+', 'D', 'D-', 'E'].includes(row.overall_grade)
                }]">
                  {{ row.overall_grade }}
                </span>
              </td>
              <td class="actions-col">
                <a 
                  :href="getDownloadUrl(row.student_id)" 
                  class="btn-download" 
                  download 
                  target="_blank"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  <span>PDF Download</span>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-container {
  padding: var(--container-padding);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
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

/* Filter card */
.filter-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.rankings-card {
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

.rankings-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.rankings-table th {
  padding: 14px 16px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  font-size: 0.85rem;
}

.rankings-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.rankings-table tbody tr:hover {
  background-color: var(--bg-hover);
}

.rank-col {
  width: 90px;
  text-align: center;
}

.rank-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.rank-first {
  background-color: #fef3c7;
  color: #d97706;
  border-color: #fde68a;
}

.rank-second {
  background-color: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}

.rank-third {
  background-color: #ffedd5;
  color: #ea580c;
  border-color: #fed7aa;
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

.score-col {
  width: 130px;
  text-align: right;
}

.bold-font {
  font-weight: 700;
}

.grade-col {
  width: 140px;
  text-align: center;
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

.actions-col {
  text-align: right;
  width: 160px;
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);
}

.btn-download:hover {
  background-color: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 4px 8px rgba(15, 119, 255, 0.15);
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

@media (max-width: 640px) {
  .filter-card {
    grid-template-columns: 1fr;
  }
}
</style>
