import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView
  },
  {
    path: '/students',
    name: 'students',
    component: () => import('../views/StudentsView.vue')
  },
  {
    path: '/streams',
    name: 'streams',
    component: () => import('../views/StreamsView.vue')
  },
  {
    path: '/subjects',
    name: 'subjects',
    component: () => import('../views/SubjectsView.vue')
  },
  {
    path: '/assessments',
    name: 'assessments',
    component: () => import('../views/AssessmentsView.vue')
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('../views/ReportsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
