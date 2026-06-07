<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isSidebarOpenMobile = ref(false)
const searchVal = ref('')

const menuItems = [
  { name: 'Dashboard', path: '/', icon: 'dashboard' },
  { name: 'Students', path: '/students', icon: 'students' },
  { name: 'Streams', path: '/streams', icon: 'streams' },
  { name: 'Subjects', path: '/subjects', icon: 'subjects' },
  { name: 'Assessments', path: '/assessments', icon: 'assessments' },
  { name: 'Reports', path: '/reports', icon: 'reports' }
]

const navigateTo = (path: string) => {
  router.push(path)
  isSidebarOpenMobile.value = false
}

const toggleSidebarMobile = () => {
  isSidebarOpenMobile.value = !isSidebarOpenMobile.value
}
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar Overlay for Mobile -->
    <div 
      v-if="isSidebarOpenMobile" 
      class="sidebar-overlay" 
      @click="isSidebarOpenMobile = false"
    ></div>

    <!-- Sidebar Navigation -->
    <aside :class="['sidebar', { 'mobile-open': isSidebarOpenMobile }]">
      <div class="sidebar-header">
        <div class="logo-container">
          <svg class="logo-icon" viewBox="0 0 24 24" width="28" height="28">
            <path d="M12 3L1 9L12 15L21 10V17H23V9L12 3Z" fill="var(--color-primary)"/>
            <path d="M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="var(--color-primary)" opacity="0.8"/>
          </svg>
          <span class="logo-text">Ikonex SMS</span>
        </div>
      </div>

      <!-- User Profile Box -->
      <div class="user-profile">
        <div class="avatar-container">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100" alt="Profile" class="avatar-img"/>
        </div>
        <div class="user-info">
          <h4 class="user-name">Md Jahidul Islam</h4>
          <span class="user-role">Administrator</span>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <button 
          v-for="item in menuItems" 
          :key="item.name"
          @click="navigateTo(item.path)"
          :class="['nav-link', { active: route.path === item.path }]"
        >
          <!-- Dashboard Icon -->
          <svg v-if="item.icon === 'dashboard'" class="nav-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13zm9-8.586 6 6V20H6v-9.586l6-6z"/>
            <path d="M12 18c2.206 0 4-1.794 4-4s-1.794-4-4-4-4 1.794-4 4 1.794 4 4 4zm0-6c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2z"/>
          </svg>
          <!-- Students Icon -->
          <svg v-else-if="item.icon === 'students'" class="nav-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
            <path d="M12 6c-1.93 0-3.5 1.57-3.5 3.5 0 1.58 1.05 2.92 2.5 3.37v2.13h2v-2.13c1.45-.45 2.5-1.79 2.5-3.37C15.5 7.57 13.93 6 12 6zm0 5c-.827 0-1.5-.673-1.5-1.5S11.173 8 12 8s1.5.673 1.5 1.5S12.827 11 12 11z"/>
          </svg>
          <!-- Streams Icon -->
          <svg v-else-if="item.icon === 'streams'" class="nav-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M19 13H5c-1.103 0-2 .897-2 2v4c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-4c0-1.103-.897-2-2-2zm0 6H5v-4h14v4zM19 3H5c-1.103 0-2 .897-2 2v4c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zm0 6H5V5h14v4z"/>
          </svg>
          <!-- Subjects Icon -->
          <svg v-else-if="item.icon === 'subjects'" class="nav-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M21 4H3c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h18c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zM3 18V6h5v12H3zm7 0V6h11v12H10z"/>
            <path d="M12 8h7v2h-7zm0 4h7v2h-7z"/>
          </svg>
          <!-- Assessments Icon -->
          <svg v-else-if="item.icon === 'assessments'" class="nav-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z"/>
            <path d="M3 4H2v16h20V4H3zm17 14H4V6h16v12z"/>
          </svg>
          <!-- Reports Icon -->
          <svg v-else-if="item.icon === 'reports'" class="nav-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zm0 16H5V5h14v14z"/>
            <path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
          </svg>
          <span class="nav-text">{{ item.name }}</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content Panel -->
    <div class="main-panel">
      <!-- Top Bar / Header -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" @click="toggleSidebarMobile">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M4 6H20V8H4V6ZM4 11H20V13H4V11ZM4 16H20V18H4V16Z" fill="currentColor"/>
            </svg>
          </button>
          
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8c1.85 0 3.54-.64 4.9-1.69l4.39 4.39 1.41-1.41-4.39-4.39C17.36 13.54 18 11.85 18 10c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search students, stream, or subjects..." 
              v-model="searchVal"
            />
          </div>
        </div>

        <div class="topbar-actions">
          <button class="icon-btn" title="Messages">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M20 2H4c-1.103 0-2 .897-2 2v18l5.333-4H20c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14H6.667L4 18V4h16v12z" fill="currentColor"/>
            </svg>
          </button>
          <button class="icon-btn notification" title="Notifications">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M19 13.586V10c0-3.217-2.185-5.927-5.145-6.742C13.562 2.52 12.846 2 12 2s-1.562.52-1.855 1.258C7.185 4.073 5 6.783 5 10v3.586l-1.707 1.707A.996.996 0 0 0 3 16v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2a.996.996 0 0 0-.293-.707L19 13.586zM19 17H5v-.586l1.707-1.707A.996.996 0 0 0 7 14v-4c0-2.757 2.243-5 5-5s5 2.243 5 5v4c0 .266.105.52.293.707L19 16.414V17zm-7 5a2.98 2.98 0 0 0 2.818-2H9.182A2.98 2.98 0 0 0 12 22z" fill="currentColor"/>
            </svg>
            <span class="dot"></span>
          </button>
          <div class="divider"></div>
          <button class="icon-btn logout" title="Log Out">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M16 13v-2H7V9h9V7l5 3-5 3zM2 19h10v2H2a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h10v2H2v14z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Main Layout Body -->
      <main class="content-body">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style>
/* Define responsive padding on wrapper */
:root {
  --container-padding: clamp(1rem, 3vw, 2rem);
}
</style>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  background-color: var(--bg-primary);
}

/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 40;
  display: none;
}

/* Sidebar Styles */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  transition: transform var(--transition-normal), width var(--transition-normal);
}

.sidebar-header {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

/* User Profile box */
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.avatar-container {
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  border: 2px solid var(--border-color);
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Nav Menu */
.sidebar-nav {
  padding: 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
  width: 100%;
  text-align: left;
  transition: all var(--transition-fast);
}

.nav-link:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.nav-link.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.nav-icon {
  fill: currentColor;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.nav-link:hover .nav-icon {
  transform: scale(1.05);
}

/* Main Panel styling */
.main-panel {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-normal);
}

/* Header bar */
.topbar {
  height: var(--topbar-height);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--container-padding);
  position: sticky;
  top: 0;
  z-index: 30;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-grow: 1;
  max-width: 500px;
}

.hamburger-btn {
  display: none;
  color: var(--text-secondary);
  padding: 4px;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 9px 12px 9px 40px;
  background-color: var(--bg-primary);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  transition: all var(--transition-fast);
}

.search-box input:focus {
  border-color: var(--color-primary);
  background-color: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(15, 119, 255, 0.15);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  position: relative;
  padding: 8px;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.icon-btn.notification .dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background-color: var(--color-danger);
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}

.topbar-actions .divider {
  width: 1px;
  height: 24px;
  background-color: var(--border-color);
  margin: 0 4px;
}

.icon-btn.logout:hover {
  color: var(--color-danger);
  background-color: var(--color-danger-bg);
}

/* Content Frame */
.content-body {
  flex-grow: 1;
  min-height: calc(100vh - var(--topbar-height));
}

/* ==========================================================================
   Media Queries & Responsiveness
   ========================================================================== */

/* 1. Tablet Resolution (768px to 1024px) */
/* Mobile & Tablet Viewports (< 1024px) */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .sidebar-overlay {
    display: block;
  }
  
  .main-panel {
    margin-left: 0;
  }
  
  .hamburger-btn {
    display: block;
  }
  
  .search-box input {
    font-size: 0.85rem;
  }
  
  /* Hide minor header components to fit search */
  .topbar-actions .divider,
  .icon-btn.logout {
    display: none;
  }
}
</style>
