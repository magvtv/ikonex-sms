<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../services/api'

const searchQuery = ref('')
const loading = ref(true)
const errorMsg = ref('')

const stats = ref({
  students: 0,
  streams: 0,
  subjects: 0,
  averageScore: 0,
  distribution: {
    high: 0,
    mid: 0,
    low: 0
  }
})

const assessments = ref<any[]>([])

const fetchDashboardData = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    
    // Concurrently fetch dashboard analytics and recent scores
    const [statsRes, scoresRes] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get('/scores/recent')
    ])
    
    stats.value = statsRes
    assessments.value = scoresRes
  } catch (err: any) {
    console.error(err)
    errorMsg.value = 'Failed to load dashboard data from backend server.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

// Compute stats cards configuration dynamically
const statCards = computed(() => [
  { 
    title: 'Total Students', 
    count: String(stats.value.students), 
    percent: stats.value.students > 0 ? Math.min(Math.round((stats.value.students / 80) * 100), 100) : 0, 
    label: 'Enrollment capacity (max 80)', 
    color: '#0f77ff',
    bg: 'rgba(15, 119, 255, 0.08)',
    type: 'gauge'
  },
  { 
    title: 'Absent Today', 
    count: '0', 
    percent: 0, 
    label: 'Requires follow-up', 
    color: '#ef4444',
    bg: '#fdf2f2',
    type: 'badge'
  },
  { 
    title: 'Streams Covered', 
    count: `${stats.value.streams}/12`, 
    percent: Math.min(Math.round((stats.value.streams / 12) * 100), 100), 
    label: 'Configured stream units', 
    color: '#8b5cf6',
    bg: '#f5f3ff',
    type: 'gauge'
  },
  { 
    title: 'Subjects Offered', 
    count: String(stats.value.subjects), 
    percent: Math.min(Math.round((stats.value.subjects / 15) * 100), 100), 
    label: 'Configured subjects', 
    color: '#f59e0b',
    bg: '#fffbeb',
    type: 'gauge'
  },
  { 
    title: 'Mean Score', 
    count: stats.value.averageScore > 0 ? `${stats.value.averageScore}%` : '0%', 
    percent: Math.round(stats.value.averageScore), 
    label: 'School wide average', 
    color: '#10b981',
    bg: '#e6f7f0',
    type: 'gauge'
  },
  { 
    title: 'Grading Done', 
    count: String(assessments.value.length), 
    percent: Math.min(Math.round((assessments.value.length / 10) * 100), 100), 
    label: 'Graded submissions', 
    color: '#64748b',
    bg: '#f8fafc',
    type: 'gauge'
  }
])

// Filter table data by search query
const filteredAssessments = computed(() => {
  if (!searchQuery.value) return assessments.value
  const query = searchQuery.value.toLowerCase()
  return assessments.value.filter(item => 
    item.name.toLowerCase().includes(query) || 
    item.adm.toLowerCase().includes(query) || 
    item.stream.toLowerCase().includes(query) || 
    item.subject.toLowerCase().includes(query) ||
    item.grade.toLowerCase().includes(query)
  )
})
</script>

<template>
  <div class="dashboard-container">
    
    <!-- Header Block -->
    <div class="welcome-header">
      <div>
        <h1 class="welcome-title">Dashboard Overview</h1>
        <p class="welcome-subtitle">Here's a breakdown of academic progress and grades today.</p>
      </div>
      <div class="term-badge">
        <span>Academic Year: 2026 - Term 1</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="errorMsg" class="error-banner">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <span>{{ errorMsg }}</span>
      <button @click="fetchDashboardData" class="retry-btn">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching dashboard analytics...</p>
    </div>

    <!-- Main Grid Section -->
    <div v-else class="dashboard-grid">
      
      <!-- Left: Grid of 6 Stat Cards -->
      <section class="stats-cards-grid">
        <div 
          v-for="card in statCards" 
          :key="card.title" 
          class="stat-card"
          :style="{ '--card-accent-color': card.color }"
        >
          <div class="card-details">
            <span class="card-title">{{ card.title }}</span>
            <div class="card-number-row">
              <span class="card-count">{{ card.count }}</span>
              <span v-if="card.type === 'badge'" class="absent-badge">Normal</span>
            </div>
            <span class="card-label">{{ card.label }}</span>
          </div>

          <!-- Custom Inline SVG gauge -->
          <div v-if="card.type === 'gauge'" class="circle-gauge" :style="{ color: card.color }">
            <svg viewBox="0 0 36 36" width="56" height="56">
              <path
                class="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                stroke-width="3"
              />
              <path
                class="circle"
                :stroke-dasharray="`${card.percent}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                :stroke="card.color"
                stroke-width="3.2"
                stroke-linecap="round"
              />
            </svg>
            <div class="circle-gauge-value">{{ card.percent }}%</div>
          </div>

          <!-- Circular Icon Badge for absolute counts -->
          <div v-else class="count-badge-indicator" :style="{ backgroundColor: card.bg, color: card.color }">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
              <path d="M12 6c-1.93 0-3.5 1.57-3.5 3.5 0 1.58 1.05 2.92 2.5 3.37v2.13h2v-2.13c1.45-.45 2.5-1.79 2.5-3.37C15.5 7.57 13.93 6 12 6zm0 5c-.827 0-1.5-.673-1.5-1.5S11.173 8 12 8s1.5.673 1.5 1.5S12.827 11 12 11z"/>
            </svg>
          </div>
        </div>
      </section>

      <!-- Right: Overall Performance Radial/Donut -->
      <section class="performance-card">
        <h3 class="card-heading">Overall Performance</h3>
        <p class="card-subheading">Mean grade and achievement rate</p>

        <!-- Donut SVG representation -->
        <div class="donut-chart-container">
          <div class="radial-donut">
            <svg viewBox="0 0 36 36" width="160" height="160">
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#f1f5f9"
                stroke-width="3"
              />
              <!-- Needs Improvement segment (Low) -->
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="var(--color-danger)"
                stroke-width="3.5"
                :stroke-dasharray="`${stats.distribution.low} 100`"
                :stroke-dashoffset="25"
              />
              <!-- Average Pass segment (Mid) -->
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="var(--color-warning)"
                stroke-width="3.5"
                :stroke-dasharray="`${stats.distribution.mid} 100`"
                :stroke-dashoffset="25 - stats.distribution.low"
              />
              <!-- High Achievers segment (High) -->
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="var(--color-success)"
                stroke-width="3.5"
                :stroke-dasharray="`${stats.distribution.high} 100`"
                :stroke-dashoffset="25 - stats.distribution.low - stats.distribution.mid"
                stroke-linecap="round"
              />
            </svg>
            <div class="donut-center-text">
              <span class="donut-big-text">{{ stats.averageScore > 0 ? Math.round(stats.averageScore) : 0 }}%</span>
              <span class="donut-sub-text">Mean Score</span>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="donut-legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: var(--color-success)"></div>
            <span class="legend-text">Pro Learner (A/B)</span>
            <span class="legend-value">{{ stats.distribution.high }}%</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: var(--color-warning)"></div>
            <span class="legend-text">High Achievers (C/D)</span>
            <span class="legend-value">{{ stats.distribution.mid }}%</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: var(--color-danger)"></div>
            <span class="legend-text">Needs Improvement (E)</span>
            <span class="legend-value">{{ stats.distribution.low }}%</span>
          </div>
        </div>
      </section>

    </div>

    <!-- Bottom: Table Ledger -->
    <section v-if="!loading" class="ledger-section">
      <div class="ledger-header">
        <h3 class="card-heading">Recent Assessment Scores</h3>
        <div class="ledger-search">
          <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8c1.85 0 3.54-.64 4.9-1.69l4.39 4.39 1.41-1.41-4.39-4.39C17.36 13.54 18 11.85 18 10c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search within assessments..." 
            v-model="searchQuery"
          />
        </div>
      </div>

      <!-- Scrollable Data Table / Responsive cards on mobile -->
      <div class="table-wrapper">
        <table class="assessment-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Admission No.</th>
              <th>Stream</th>
              <th>Subject</th>
              <th>Assessment</th>
              <th class="number-col">Score</th>
              <th class="center-col">Grade</th>
              <th class="center-col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredAssessments" :key="item.adm + item.subject + item.type">
              <td data-label="Student Name">
                <div class="student-cell">
                  <div class="avatar-sm">
                    {{ item.name.split(' ').map((n: string) => n[0]).join('') }}
                  </div>
                  <span class="student-name">{{ item.name }}</span>
                </div>
              </td>
              <td data-label="Admission No." class="code-font">{{ item.adm }}</td>
              <td data-label="Stream">{{ item.stream }}</td>
              <td data-label="Subject">{{ item.subject }}</td>
              <td data-label="Assessment">{{ item.type }}</td>
              <td data-label="Score" class="number-col bold-font">
                {{ item.score !== null ? item.score.toFixed(2) : '--' }}
              </td>
              <td data-label="Grade" class="center-col">
                <span :class="['grade-badge', { 
                  'grade-high': ['A', 'A-', 'B+'].includes(item.grade), 
                  'grade-mid': ['B', 'B-', 'C+', 'C', 'C-'].includes(item.grade),
                  'grade-low': ['D+', 'D', 'D-', 'E'].includes(item.grade)
                }]">
                  {{ item.grade }}
                </span>
              </td>
              <td data-label="Status" class="center-col">
                <span :class="['badge', { 
                  'badge-success': item.status === 'Completed', 
                  'badge-danger': item.status === 'Absent', 
                  'badge-warning': item.status === 'Pending' 
                }]">
                  {{ item.status }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredAssessments.length === 0">
              <td colspan="8" class="no-records">No assessments match your search criteria.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </div>
</template>

<style scoped>
.dashboard-container {
  padding: var(--container-padding);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

/* Error banner styling */
.error-banner {
  background-color: var(--color-danger-bg);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-danger-text);
  padding: 12px 16px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.retry-btn {
  margin-left: auto;
  background-color: var(--color-danger);
  color: #fff;
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  transition: opacity var(--transition-fast);
}

.retry-btn:hover {
  opacity: 0.9;
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

/* Welcome Block */
.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.welcome-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
}

.welcome-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 2px;
}

.term-badge {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* Grid layout for cards and performance */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

/* Left Grid */
.stats-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--card-accent-color);
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.card-number-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-count {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
}

.absent-badge {
  background-color: var(--color-success-bg);
  color: var(--color-success);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.card-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Circle Progress SVG styling */
.circle-gauge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.circle-gauge svg {
  transform: rotate(-90deg);
}

.circle-bg {
  stroke: #e2e8f0;
}

.circle {
  stroke-dasharray: 0, 100;
  transition: stroke-dasharray 0.5s ease-in-out;
}

.circle-gauge-value {
  position: absolute;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.count-badge-indicator {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Performance Donut card */
.performance-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.card-heading {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card-subheading {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 2px;
  margin-bottom: 24px;
}

.donut-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  padding: 12px 0;
}

.radial-donut {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
}

.radial-donut svg {
  transform: rotate(-90deg);
}

.donut-center-text {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.donut-big-text {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.donut-sub-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 4px;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 24px;
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
}

.legend-text {
  color: var(--text-secondary);
  flex-grow: 1;
}

.legend-value {
  font-weight: 600;
  color: var(--text-primary);
}

/* Ledger Table styling */
.ledger-section {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.ledger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.ledger-search {
  position: relative;
  width: 280px;
}

.ledger-search .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.ledger-search input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  background-color: var(--bg-primary);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.85rem;
  outline: none;
  transition: all var(--transition-fast);
}

.ledger-search input:focus {
  border-color: var(--color-primary);
  background-color: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(15, 119, 255, 0.15);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.assessment-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.assessment-table th {
  padding: 14px 16px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  font-size: 0.85rem;
  white-space: nowrap;
}

.assessment-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.assessment-table tbody tr:hover {
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
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  border: 1px solid rgba(15, 119, 255, 0.15);
}

.student-name {
  font-weight: 600;
  color: var(--text-primary);
}

.code-font {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.bold-font {
  font-weight: 600;
}

.number-col {
  text-align: right;
}

.center-col {
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

.no-records {
  text-align: center;
  color: var(--text-secondary);
  padding: 32px !important;
}

/* ==========================================================================
   Responsive Adaptations
   ========================================================================== */

/* 1. Large Screens & Tablets (max-width: 1024px) */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .performance-card {
    height: auto;
  }
  
  .donut-chart-container {
    padding: 24px 0;
  }
}

/* 2. Narrower Devices (max-width: 640px) */
@media (max-width: 640px) {
  .stats-cards-grid {
    grid-template-columns: 1fr;
  }
  
  .ledger-search {
    width: 100%;
  }
  
  .welcome-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .term-badge {
    align-self: flex-start;
  }
}

/* 3. Small Viewports - Mobile Table Restructure (< 768px) */
@media (max-width: 767.98px) {
  .assessment-table, 
  .assessment-table thead, 
  .assessment-table tbody, 
  .assessment-table th, 
  .assessment-table td, 
  .assessment-table tr { 
    display: block; 
  }
  
  /* Hide headers for screen readers only, or remove visually */
  .assessment-table thead tr { 
    position: absolute;
    top: -9999px;
    left: -9999px;
  }
  
  .assessment-table tbody tr { 
    border: 1px solid var(--border-color); 
    margin-bottom: 16px;
    border-radius: var(--border-radius-md);
    background: var(--bg-secondary);
    padding: 8px 16px;
    box-shadow: var(--shadow-sm);
  }
  
  .assessment-table td { 
    border: none;
    border-bottom: 1px dashed var(--border-color);
    position: relative;
    padding: 10px 0 10px 45%; 
    text-align: right;
    font-size: 0.85rem;
  }
  
  .assessment-table td:last-child {
    border-bottom: none;
  }
  
  /* Inject header labels */
  .assessment-table td::before { 
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
  
  /* Alignment corrections for block layout */
  .number-col, .center-col {
    text-align: right;
  }
  
  .student-cell {
    justify-content: flex-end;
  }
  
  .avatar-sm {
    display: none; /* Hide small avatar on card layout to save space */
  }
}
</style>
