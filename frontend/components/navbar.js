// frontend/components/navbar.js - COMPONENTE DE NAVEGACIÓN CONSISTENTE
class Navbar {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.loadUserInfo();
    this.render();
    this.bindEvents();
  }

  loadUserInfo() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch (error) {
        console.error('Error al cargar información del usuario:', error);
      }
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '');
    
    const pageMap = {
      'dashboard': 'dashboard',
      'sucursales': 'sucursales',
      'categorias': 'categorias',  
      'productos': 'productos',
      'clientes': 'clientes',
      'facturacion': 'facturacion'
    };
    
    return pageMap[page] || 'dashboard';
  }

  render() {
    const currentPage = this.getCurrentPage();
    
    const navbarHTML = `
      <nav class="bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Logo y título -->
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <h1 class="text-2xl font-bold text-blue-600 flex items-center">
                  <i class="fas fa-paint-brush mr-2"></i>
                  <a href="/pages/dashboard.html" class="text-blue-600 hover:text-blue-700 transition-colors">
                    Sistema Paints
                  </a>
                </h1>
              </div>
            </div>

            <!-- Navegación principal -->
            <div class="hidden md:block">
              <div class="ml-10 flex items-baseline space-x-4">
                <a href="/pages/dashboard.html" 
                   class="nav-link ${currentPage === 'dashboard' ? 'active' : ''} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                </a>
                <a href="/pages/sucursales.html" 
                   class="nav-link ${currentPage === 'sucursales' ? 'active' : ''} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  <i class="fas fa-store mr-2"></i>Sucursales
                </a>
                <a href="/pages/categorias.html" 
                   class="nav-link ${currentPage === 'categorias' ? 'active' : ''} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  <i class="fas fa-tags mr-2"></i>Categorías
                </a>
                <a href="/pages/productos.html" 
                   class="nav-link ${currentPage === 'productos' ? 'active' : ''} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  <i class="fas fa-paint-roller mr-2"></i>Productos
                </a>
                <a href="/pages/clientes.html" 
                   class="nav-link ${currentPage === 'clientes' ? 'active' : ''} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  <i class="fas fa-users mr-2"></i>Clientes
                </a>
                <a href="/pages/facturacion.html" 
                   class="nav-link ${currentPage === 'facturacion' ? 'active' : ''} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  <i class="fas fa-file-invoice-dollar mr-2"></i>Facturación
                </a>
              </div>
            </div>

            <!-- Menú de usuario -->
            <div class="hidden md:block">
              <div class="ml-4 flex items-center md:ml-6">
                <div class="relative">
                  <button type="button" 
                          class="user-menu-button max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          id="user-menu" 
                          aria-expanded="false" 
                          aria-haspopup="true">
                    <span class="sr-only">Abrir menú de usuario</span>
                    <div class="flex items-center px-3 py-2">
                      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user text-blue-600"></i>
                      </div>
                      <div class="flex flex-col items-start">
                        <span class="text-sm font-medium text-gray-700">${this.currentUser?.nombre_completo || 'Usuario'}</span>
                        <span class="text-xs text-gray-500">${this.currentUser?.perfil || 'N/A'}</span>
                      </div>
                      <i class="fas fa-chevron-down ml-2 text-gray-400"></i>
                    </div>
                  </button>

                  <!-- Dropdown menu -->
                  <div class="user-dropdown origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden"
                       role="menu" 
                       aria-orientation="vertical" 
                       aria-labelledby="user-menu">
                    <a href="#" 
                       class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                       role="menuitem">
                      <i class="fas fa-user-circle mr-2"></i>Mi Perfil
                    </a>
                    <a href="#" 
                       class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                       role="menuitem">
                      <i class="fas fa-cog mr-2"></i>Configuración
                    </a>
                    <div class="border-t border-gray-100"></div>
                    <a href="#" 
                       class="logout-btn block px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200"
                       role="menuitem">
                      <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botón menú móvil -->
            <div class="-mr-2 flex md:hidden">
              <button type="button" 
                      class="mobile-menu-button bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      aria-controls="mobile-menu" 
                      aria-expanded="false">
                <span class="sr-only">Abrir menú principal</span>
                <i class="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Menú móvil -->
        <div class="md:hidden hidden" id="mobile-menu">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            <a href="/pages/dashboard.html" 
               class="mobile-nav-link ${currentPage === 'dashboard' ? 'active' : ''} block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200">
              <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
            </a>
            <a href="/pages/sucursales.html" 
               class="mobile-nav-link ${currentPage === 'sucursales' ? 'active' : ''} block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200">
              <i class="fas fa-store mr-2"></i>Sucursales
            </a>
            <a href="/pages/categorias.html" 
               class="mobile-nav-link ${currentPage === 'categorias' ? 'active' : ''} block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200">
              <i class="fas fa-tags mr-2"></i>Categorías
            </a>
            <a href="/pages/productos.html" 
               class="mobile-nav-link ${currentPage === 'productos' ? 'active' : ''} block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200">
              <i class="fas fa-paint-roller mr-2"></i>Productos
            </a>
            <a href="/pages/clientes.html" 
               class="mobile-nav-link ${currentPage === 'clientes' ? 'active' : ''} block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200">
              <i class="fas fa-users mr-2"></i>Clientes
            </a>
            <a href="/pages/facturacion.html" 
               class="mobile-nav-link ${currentPage === 'facturacion' ? 'active' : ''} block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200">
              <i class="fas fa-file-invoice-dollar mr-2"></i>Facturación
            </a>
            
            <div class="border-t border-gray-200 pt-3 mt-3">
              <div class="flex items-center px-3 py-2">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-user text-blue-600"></i>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-700">${this.currentUser?.nombre_completo || 'Usuario'}</span>
                  <span class="text-xs text-gray-500">${this.currentUser?.perfil || 'N/A'}</span>
                </div>
              </div>
              <a href="#" 
                 class="logout-btn block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200">
                <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
              </a>
            </div>
          </div>
        </div>
      </nav>

      <style>
        .nav-link {
          color: #6B7280;
        }
        
        .nav-link:hover {
          color: #3B82F6;
          background-color: #EBF8FF;
        }
        
        .nav-link.active {
          color: #3B82F6;
          background-color: #DBEAFE;
          font-weight: 600;
        }
        
        .mobile-nav-link {
          color: #6B7280;
        }
        
        .mobile-nav-link:hover {
          color: #3B82F6;
          background-color: #EBF8FF;
        }
        
        .mobile-nav-link.active {
          color: #3B82F6;
          background-color: #DBEAFE;
          font-weight: 600;
        }
      </style>
    `;

    // Insertar navbar en el DOM
    const body = document.body;
    let navContainer = document.getElementById('navbar-container');
    
    if (!navContainer) {
      navContainer = document.createElement('div');
      navContainer.id = 'navbar-container';
      body.insertBefore(navContainer, body.firstChild);
    }
    
    navContainer.innerHTML = navbarHTML;
  }

  bindEvents() {
    // Toggle menú de usuario
    const userMenuButton = document.querySelector('.user-menu-button');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });
    }

    // Toggle menú móvil
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        const isExpanded = !mobileMenu.classList.contains('hidden');
        mobileMenuButton.setAttribute('aria-expanded', isExpanded);
      });
    }

    // Cerrar menús al hacer click fuera
    document.addEventListener('click', (e) => {
      if (userDropdown && !e.target.closest('.user-menu-button')) {
        userDropdown.classList.add('hidden');
      }
    });

    // Logout
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });
  }

  async logout() {
    try {
      // Intentar logout en servidor
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.log('Error al hacer logout en servidor, continuando...');
      }

      // Limpiar localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Redireccionar al login
      window.location.href = '/pages/login.html';
    } catch (error) {
      console.error('Error durante logout:', error);
      // Forzar redirección aunque haya error
      window.location.href = '/pages/login.html';
    }
  }

  // Actualizar información del usuario
  updateUser(userData) {
    this.currentUser = userData;
    this.render();
  }

  // Método estático para inicializar en cualquier página
  static init() {
    // Esperar a que el DOM esté cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        new Navbar();
      });
    } else {
      new Navbar();
    }
  }
}

// Inicializar automáticamente
Navbar.init();

// Hacer disponible globalmente
window.Navbar = Navbar;