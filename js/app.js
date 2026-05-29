// Main Application Orchestrator
// Handles routing, layout toggles, themes, navigation and event delegation

class App {
  constructor() {
    this.currentUser = null;
    this.currentView = 'dashboard'; // 'dashboard', 'citas', 'profile'
    
    // Cache DOM Elements
    this.authScreen = document.getElementById('auth-screen');
    this.dashboardScreen = document.getElementById('dashboard-screen');
    
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.loginContainer = document.getElementById('login-container');
    this.registerContainer = document.getElementById('register-container');
    
    this.goToRegisterBtn = document.getElementById('go-to-register');
    this.goToLoginBtn = document.getElementById('go-to-login');
    
    this.themeToggleAuth = document.getElementById('theme-toggle-auth');
    this.themeToggleDashboard = document.getElementById('theme-toggle-dashboard');
    this.roleSimulatorBtn = document.getElementById('role-simulator-btn');
    
    this.sidebar = document.getElementById('sidebar');
    this.sidebarBackdrop = document.getElementById('sidebar-backdrop');
    this.openSidebarBtn = document.getElementById('open-sidebar');
    this.closeSidebarBtn = document.getElementById('close-sidebar');
    this.logoutBtn = document.getElementById('logout-btn');
    
    this.navBtnDashboard = document.getElementById('nav-btn-dashboard');
    this.navBtnCitas = document.getElementById('nav-btn-citas');
    this.navBtnProfile = document.getElementById('nav-btn-profile');
    this.navTextCitas = document.getElementById('nav-text-citas');
    
    this.headerTitle = document.getElementById('header-title');
    this.userDisplayName = document.getElementById('user-display-name');
    this.userRoleBadge = document.getElementById('user-role-badge');
    this.userAvatar = document.getElementById('user-avatar');
    this.headerUserAvatar = document.getElementById('header-user-avatar');

    this.init();
  }

  init() {
    // 1. Initialize Theme (Dark/Light)
    this.initTheme();

    // 2. Setup Event Listeners
    this.setupEventListeners();

    // 3. Authenticate / Route
    this.checkSession();
  }

  // --- Theme Management ---
  initTheme() {
    const savedTheme = localStorage.getItem('barber_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('barber_theme', 'light');
      this.showToast('Modo Claro activado', 'info');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('barber_theme', 'dark');
      this.showToast('Modo Oscuro activado', 'info');
    }
  }

  // --- Authentication ---
  checkSession() {
    this.currentUser = window.mockService.getCurrentUser();
    if (this.currentUser) {
      this.showDashboard();
    } else {
      this.showAuth();
    }
  }

  showAuth() {
    this.authScreen.classList.remove('hidden');
    this.dashboardScreen.classList.add('hidden');
    this.loginContainer.classList.remove('hidden');
    this.registerContainer.classList.add('hidden');
    this.loginForm.reset();
    this.registerForm.reset();
  }

  showDashboard() {
    this.authScreen.classList.add('hidden');
    this.dashboardScreen.classList.remove('hidden');
    
    // Update user profile info in UI
    this.userDisplayName.textContent = this.currentUser.name;
    this.userRoleBadge.textContent = this.currentUser.role === 'admin' ? 'Barbero / Admin' : 'Cliente';
    
    const initial = this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U';
    this.userAvatar.textContent = initial;
    this.headerUserAvatar.textContent = initial;

    // Adjust navigation text based on Role
    if (this.currentUser.role === 'admin') {
      this.navTextCitas.textContent = 'Gestión de Citas';
      this.roleSimulatorBtn.classList.remove('hidden');
    } else {
      this.navTextCitas.textContent = 'Mis Reservas';
      this.roleSimulatorBtn.classList.remove('hidden'); // Show for client too to allow swapping
    }

    // Default View inside Dashboard
    this.switchView('dashboard');
  }

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    
    const result = window.mockService.login(email, 'password');
    if (result.success) {
      this.currentUser = result.user;
      this.showToast(`¡Bienvenido de nuevo, ${this.currentUser.name}!`, 'success');
      this.showDashboard();
    } else {
      this.showToast(result.message || 'Error al iniciar sesión', 'error');
    }
  }

  handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;

    const result = window.mockService.register(name, email, phone);
    if (result.success) {
      this.currentUser = result.user;
      this.showToast('Cuenta creada con éxito', 'success');
      this.showDashboard();
    } else {
      this.showToast(result.message || 'Error al registrarse', 'error');
    }
  }

  handleLogout() {
    window.mockService.logout();
    this.currentUser = null;
    this.showToast('Sesión cerrada correctamente', 'info');
    this.showAuth();
  }

  // --- Role Simulation Switcher ---
  simulateRoleSwap() {
    if (!this.currentUser) return;
    
    const newRole = this.currentUser.role === 'admin' ? 'client' : 'admin';
    
    // Update local state and mock db
    this.currentUser.role = newRole;
    if (newRole === 'client') {
      // Re-map as Juan Perez for demonstration as a real client
      const juan = window.mockService.getClients().find(c => c.email.includes('juan'));
      if (juan) {
        this.currentUser = { ...juan, role: 'client' };
      } else {
        this.currentUser.name = 'Juan Pérez';
        this.currentUser.email = 'juan.perez@email.com';
        this.currentUser.phone = '+34600111222';
      }
    } else {
      // Re-map as Admin
      this.currentUser.name = 'Administrador Principal';
      this.currentUser.email = 'admin@barberia.com';
    }
    
    localStorage.setItem('barber_current_user', JSON.stringify(this.currentUser));
    
    this.showToast(`Simulando vista de: ${newRole === 'admin' ? 'Barbero/Admin' : 'Cliente'}`, 'success');
    this.showDashboard();
  }

  // --- View Switching inside Dashboard ---
  switchView(viewName) {
    this.currentView = viewName;
    
    // Update Sidebar Navigation state
    const navItems = [
      { btn: this.navBtnDashboard, name: 'dashboard' },
      { btn: this.navBtnCitas, name: 'citas' },
      { btn: this.navBtnProfile, name: 'profile' }
    ];

    navItems.forEach(item => {
      if (item.name === viewName) {
        item.btn.classList.add('bg-amber-500/10', 'text-amber-600', 'dark:text-amber-500');
        item.btn.classList.remove('text-slate-600', 'dark:text-zinc-400', 'hover:bg-slate-100', 'dark:hover:bg-zinc-800');
      } else {
        item.btn.classList.remove('bg-amber-500/10', 'text-amber-600', 'dark:text-amber-500');
        item.btn.classList.add('text-slate-600', 'dark:text-zinc-400', 'hover:bg-slate-100', 'dark:hover:bg-zinc-800');
      }
    });

    // Update Header Title
    let title = 'Panel de Control';
    if (viewName === 'dashboard') title = 'Panel General';
    if (viewName === 'citas') title = this.currentUser.role === 'admin' ? 'Gestión de Citas' : 'Mis Citas';
    if (viewName === 'profile') title = 'Datos de Cuenta';
    
    this.headerTitle.textContent = title;

    // Load corresponding view content using our view script
    if (window.adminDashboardView) {
      window.adminDashboardView.render(viewName);
    }

    // Close sidebar on mobile after clicking
    this.closeMobileSidebar();
  }

  // --- Mobile Sidebar Controls ---
  openMobileSidebar() {
    this.sidebar.classList.remove('-translate-x-full');
    this.sidebar.classList.add('translate-x-0');
    this.sidebarBackdrop.classList.remove('hidden');
  }

  closeMobileSidebar() {
    this.sidebar.classList.add('-translate-x-full');
    this.sidebar.classList.remove('translate-x-0');
    this.sidebarBackdrop.classList.add('hidden');
  }

  // --- Event Listeners Mapping ---
  setupEventListeners() {
    // Auth Forms Toggles
    this.goToRegisterBtn.addEventListener('click', () => {
      this.loginContainer.classList.add('hidden');
      this.registerContainer.classList.remove('hidden');
    });

    this.goToLoginBtn.addEventListener('click', () => {
      this.registerContainer.classList.add('hidden');
      this.loginContainer.classList.remove('hidden');
    });

    // Theme toggles
    this.themeToggleAuth.addEventListener('click', () => this.toggleTheme());
    this.themeToggleDashboard.addEventListener('click', () => this.toggleTheme());

    // Login/Register Submit
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    
    // Logout
    this.logoutBtn.addEventListener('click', () => this.handleLogout());

    // Role Simulator
    this.roleSimulatorBtn.addEventListener('click', () => this.simulateRoleSwap());

    // Navigation clicks
    this.navBtnDashboard.addEventListener('click', () => this.switchView('dashboard'));
    this.navBtnCitas.addEventListener('click', () => this.switchView('citas'));
    this.navBtnProfile.addEventListener('click', () => this.switchView('profile'));

    // Mobile Sidebar Toggles
    this.openSidebarBtn.addEventListener('click', () => this.openMobileSidebar());
    this.closeSidebarBtn.addEventListener('click', () => this.closeMobileSidebar());
    this.sidebarBackdrop.addEventListener('click', () => this.closeMobileSidebar());

    // Initialize Lucide Icons
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  }

  // --- Global Toast Notification Helper ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    // Base styles
    toast.className = 'flex items-center space-x-3 p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-xl max-w-sm pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300 ease-out';
    
    // Style & Icon mapping
    let iconName = 'info';
    let iconClass = 'text-blue-500';
    let borderClass = 'border-slate-100 dark:border-zinc-800';

    if (type === 'success') {
      iconName = 'check-circle-2';
      iconClass = 'text-emerald-500';
      borderClass = 'border-emerald-100 dark:border-emerald-950/20';
    } else if (type === 'error') {
      iconName = 'alert-triangle';
      iconClass = 'text-rose-500';
      borderClass = 'border-rose-100 dark:border-rose-950/20';
    }

    toast.classList.add(...borderClass.split(' '));
    
    toast.innerHTML = `
      <div class="${iconClass}">
        <i data-lucide="${iconName}" class="w-5 h-5"></i>
      </div>
      <div class="flex-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
        ${message}
      </div>
      <button class="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200" onclick="this.parentElement.remove()">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    container.appendChild(toast);
    
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: {
          class: 'lucide'
        },
        nameAttr: 'data-lucide',
        node: toast
      });
    }

    // Slide in
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 50);

    // Auto-dismiss
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }
}

// Start App when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new App();
});
