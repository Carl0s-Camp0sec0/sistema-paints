// frontend/assets/js/utils.js
// ARCHIVO NUEVO - UTILIDADES GLOBALES

class Utils {
    // Mostrar alertas mejoradas con diferentes tipos
    static showAlert(message, type = 'info', duration = 5000) {
        // Remover alerta anterior si existe
        const existingAlert = document.getElementById('alertMessage');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.id = 'alertMessage';
        alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md transform transition-all duration-300 translate-x-0`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle', 
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const colors = {
            success: 'bg-green-100 border border-green-400 text-green-700',
            error: 'bg-red-100 border border-red-400 text-red-700',
            warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border border-blue-400 text-blue-700'
        };

        alertDiv.className += ` ${colors[type] || colors.info}`;
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type] || icons.info} mr-3"></i>
                <span class="flex-1">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="ml-4 text-xl font-bold hover:text-gray-600 transition-colors">
                    &times;
                </button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        // Animación de entrada
        setTimeout(() => {
            alertDiv.style.transform = 'translateX(0)';
        }, 10);

        // Auto-remove después del duration
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    // Verificar autenticación
    static isAuthenticated() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (!token || !userData) return false;
        
        try {
            const user = JSON.parse(userData);
            return !!(user.username && (user.perfil || user.perfil_usuario));
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }

    // Proteger página (redirigir al login si no está autenticado)
    static protectPage() {
        if (!this.isAuthenticated()) {
            console.warn('Página protegida: Redirigiendo al login');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Obtener usuario actual
    static getCurrentUser() {
        try {
            const userData = localStorage.getItem('user_data');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            return null;
        }
    }

    // Formatear fecha
    static formatDate(date, includeTime = true) {
        if (!date) return '';
        
        const d = new Date(date);
        
        if (isNaN(d.getTime())) return '';
        
        const dateStr = d.toLocaleDateString('es-GT');
        
        if (!includeTime) return dateStr;
        
        const timeStr = d.toLocaleTimeString('es-GT', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `${dateStr} ${timeStr}`;
    }

    // Formatear moneda (Quetzales)
    static formatCurrency(amount, currency = 'GTQ') {
        if (amount === null || amount === undefined || isNaN(amount)) return 'Q 0.00';
        
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Formatear número
    static formatNumber(number, decimals = 2) {
        if (number === null || number === undefined || isNaN(number)) return '0';
        
        return new Intl.NumberFormat('es-GT', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    // Debounce para búsquedas
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Confirmar acción
    static async confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title: title,
                body: `<p class="text-gray-600">${message}</p>`,
                buttons: [
                    {
                        text: 'Cancelar',
                        class: 'bg-gray-500 hover:bg-gray-600 text-white',
                        action: () => {
                            modal.remove();
                            resolve(false);
                        }
                    },
                    {
                        text: 'Confirmar',
                        class: 'bg-red-600 hover:bg-red-700 text-white',
                        action: () => {
                            modal.remove();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    // Crear modal genérico
    static createModal({ title, body, buttons = [], size = 'md' }) {
        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl'
        };

        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full ${sizeClasses[size] || sizeClasses.md} mx-4 max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">${title}</h3>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="text-gray-400 hover:text-gray-600 text-2xl">
                            &times;
                        </button>
                    </div>
                    <div class="mb-6">
                        ${body}
                    </div>
                    <div class="flex justify-end space-x-3">
                        ${buttons.map(button => 
                            `<button type="button" class="px-4 py-2 rounded-md ${button.class}">${button.text}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;

        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        const modal = modalDiv.firstElementChild;
        
        // Asignar eventos a los botones
        const buttonElements = modal.querySelectorAll('button');
        buttons.forEach((button, index) => {
            if (button.action && buttonElements[index + 1]) { // +1 porque el primero es el botón de cerrar
                buttonElements[index + 1].addEventListener('click', button.action);
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    // Loading spinner
    static showLoading(message = 'Cargando...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'globalLoading';
        loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loadingDiv.innerHTML = `
            <div class="bg-white rounded-lg p-6 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">${message}</p>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }

    static hideLoading() {
        const loading = document.getElementById('globalLoading');
        if (loading) {
            loading.remove();
        }
    }

    // Validaciones comunes
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[0-9]{8}$/; // 8 dígitos para Guatemala
        return phoneRegex.test(phone);
    }

    static validateNIT(nit) {
        const nitRegex = /^[0-9]{7,8}-[0-9K]$/;
        return nitRegex.test(nit);
    }

    // Escapar HTML para prevenir XSS
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Copiar al portapapeles
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('Copiado al portapapeles', 'success', 2000);
            return true;
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            this.showAlert('Error al copiar al portapapeles', 'error');
            return false;
        }
    }

    // Descargar archivo
    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Obtener parámetros de URL
    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    // Actualizar título de página
    static updatePageTitle(title) {
        document.title = title ? `${title} - Sistema Paints` : 'Sistema Paints';
    }

    // Verificar si está en móvil
    static isMobile() {
        return window.innerWidth <= 768;
    }

    // Scroll suave al elemento
    static scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// Hacer Utils disponible globalmente
if (typeof window !== 'undefined') {
    window.utils = Utils;
    window.Utils = Utils;
    console.log('✅ Utilidades globales cargadas');
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}