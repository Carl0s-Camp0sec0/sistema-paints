// frontend/assets/js/utils.js

class Utils {
    /**
     * Mostrar alertas/notificaciones
     */
    static showAlert(message, type = 'info', duration = 5000) {
        // Eliminar alertas existentes
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());

        // Definir colores según el tipo
        const colors = {
            'success': 'bg-green-100 border-green-400 text-green-700',
            'error': 'bg-red-100 border-red-400 text-red-700',
            'warning': 'bg-yellow-100 border-yellow-400 text-yellow-700',
            'info': 'bg-blue-100 border-blue-400 text-blue-700'
        };

        // Definir iconos según el tipo
        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-triangle',
            'warning': 'fas fa-exclamation-circle',
            'info': 'fas fa-info-circle'
        };

        const alertHTML = `
            <div class="custom-alert fixed top-4 right-4 z-50 max-w-md w-full shadow-lg rounded-lg border-l-4 p-4 ${colors[type]} animate-slideIn">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="${icons[type]} text-lg"></i>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium">${message}</p>
                    </div>
                    <div class="ml-auto pl-3">
                        <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none" onclick="this.closest('.custom-alert').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Agregar CSS para animación si no existe
        if (!document.querySelector('#alert-animations')) {
            const style = document.createElement('style');
            style.id = 'alert-animations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.insertAdjacentHTML('beforeend', alertHTML);

        // Auto-remove después del tiempo especificado
        if (duration > 0) {
            setTimeout(() => {
                const alert = document.querySelector('.custom-alert');
                if (alert) {
                    alert.style.animation = 'slideIn 0.3s ease-out reverse';
                    setTimeout(() => alert.remove(), 300);
                }
            }, duration);
        }
    }

    /**
     * Confirmar acción con modal personalizado
     */
    static async confirm(message, title = 'Confirmar acción') {
        return new Promise((resolve) => {
            const modalId = 'confirmModal_' + Date.now();
            const modalHTML = `
                <div id="${modalId}" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg max-w-md w-full mx-4 p-6">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-question-circle text-yellow-500 text-2xl mr-3"></i>
                            <h3 class="text-lg font-semibold">${title}</h3>
                        </div>
                        
                        <p class="text-gray-600 mb-6">${message}</p>
                        
                        <div class="flex justify-end space-x-3">
                            <button id="cancelBtn_${modalId}" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md">
                                Cancelar
                            </button>
                            <button id="confirmBtn_${modalId}" class="bg-paint-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modal = document.getElementById(modalId);
            const cancelBtn = document.getElementById(`cancelBtn_${modalId}`);
            const confirmBtn = document.getElementById(`confirmBtn_${modalId}`);

            const cleanup = () => {
                modal.remove();
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };

            confirmBtn.onclick = () => {
                cleanup();
                resolve(true);
            };

            // ESC key support
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    }

    /**
     * Formatear moneda guatemalteca
     */
    static formatCurrency(amount) {
        if (isNaN(amount)) return 'Q 0.00';
        return 'Q ' + parseFloat(amount).toLocaleString('es-GT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Formatear fecha
     */
    static formatDate(dateString, includeTime = false) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return date.toLocaleDateString('es-GT', options);
    }

    /**
     * Escapar HTML para prevenir XSS
     */
    static escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    /**
     * Debounce function
     */
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

    /**
     * Validar email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar teléfono guatemalteco
     */
    static isValidPhoneGT(phone) {
        // Formatos válidos: 2234-5678, 5555-1234, 22345678, 55551234
        const phoneRegex = /^[2-9]\d{3}-?\d{4}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Validar NIT guatemalteco
     */
    static isValidNIT(nit) {
        if (!nit || nit === 'CF' || nit === 'C/F') return true;
        // Formato: 1234567-8 o 12345678
        const nitRegex = /^\d{7,8}-?\d{1}$/;
        return nitRegex.test(nit.replace(/\s/g, ''));
    }

    /**
     * Validar DPI guatemalteco
     */
    static isValidDPI(dpi) {
        if (!dpi) return true;
        // Formato: 1234 12345 1234 o 123412345134
        const dpiRegex = /^\d{4}\s?\d{5}\s?\d{4}$/;
        return dpiRegex.test(dpi);
    }

    /**
     * Formatear número de teléfono
     */
    static formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 8) {
            return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
        }
        return phone;
    }

    /**
     * Formatear DPI
     */
    static formatDPI(dpi) {
        if (!dpi) return '';
        const cleaned = dpi.replace(/\D/g, '');
        if (cleaned.length === 13) {
            return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 9)} ${cleaned.slice(9)}`;
        }
        return dpi;
    }

    /**
     * Loading overlay
     */
    static showLoading(message = 'Cargando...') {
        const existingOverlay = document.getElementById('globalLoadingOverlay');
        if (existingOverlay) return;

        const overlayHTML = `
            <div id="globalLoadingOverlay" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-lg">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-paint-blue"></div>
                    <span class="text-gray-700">${message}</span>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }

    static hideLoading() {
        const overlay = document.getElementById('globalLoadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Copy to clipboard
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('Texto copiado al portapapeles', 'success', 2000);
            return true;
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            this.showAlert('Error al copiar al portapapeles', 'error');
            return false;
        }
    }

    /**
     * Download data as file
     */
    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    /**
     * Scroll to element
     */
    static scrollToElement(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Check if element is visible in viewport
     */
    static isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Generar ID único
     */
    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    /**
     * Truncar texto
     */
    static truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }

    /**
     * Capitalizar primera letra de cada palabra
     */
    static capitalize(text) {
        if (!text) return '';
        return text.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    /**
     * Remover acentos
     */
    static removeAccents(text) {
        if (!text) return '';
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Validar campos requeridos de un formulario
     */
    static validateRequiredFields(formElement) {
        const requiredFields = formElement.querySelectorAll('[required]');
        const errors = [];

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                const label = field.previousElementSibling?.textContent || field.name || 'Campo';
                errors.push(`${label.replace('*', '').trim()} es obligatorio`);
                field.classList.add('border-red-500');
            } else {
                field.classList.remove('border-red-500');
            }
        });

        if (errors.length > 0) {
            this.showAlert(errors[0], 'warning');
            return false;
        }

        return true;
    }

    /**
     * Limpiar formulario
     */
    static clearForm(formElement) {
        if (!formElement) return;
        
        formElement.reset();
        
        // Remover clases de error
        const fields = formElement.querySelectorAll('.border-red-500');
        fields.forEach(field => field.classList.remove('border-red-500'));
        
        // Limpiar selects con valor por defecto
        const selects = formElement.querySelectorAll('select[data-default]');
        selects.forEach(select => {
            select.value = select.dataset.default;
        });
    }

    /**
     * Aplicar permisos basados en roles
     */
    static applyRolePermissions(userProfile) {
        document.querySelectorAll('[data-require-profile]').forEach(element => {
            const requiredProfiles = element.dataset.requireProfile.split(',');
            const hasPermission = requiredProfiles.includes(userProfile);
            
            if (hasPermission) {
                element.style.display = '';
                element.disabled = false;
            } else {
                element.style.display = 'none';
                element.disabled = true;
            }
        });
    }
}

// Export como utils global
window.utils = Utils;

// Alias para compatibilidad
window.Utils = Utils;

// Export por defecto
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}