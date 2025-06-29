/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 4.9 - Removed placeholder IVSHeaderController definition.
 * @author IVS-Technical-Team
 */

'use strict';

// =================================================================
//  LOGGING & UTILITIES
// =================================================================
function componentLog(message, level = 'info') {
    console[level](`[IVS Components] ${message}`);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =================================================================
//  MAIN COMPONENT LOADER
// =================================================================

/**
 * Loads an HTML component and injects it into a placeholder,
 * ensuring that any <script> tags within the injected HTML are executed.
 * @param {string} url The URL of the HTML component to load.
 * @param {string} placeholderId The ID of the element to inject the component into.
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
 */
async function loadAndInject(url, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        componentLog(`Placeholder '${placeholderId}' not found.`, "error");
        return false;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        
        // Create a temporary div to parse the HTML and extract scripts
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        const scripts = Array.from(tempDiv.querySelectorAll('script'));

        // Remove scripts from tempDiv's innerHTML before injecting to avoid double execution
        scripts.forEach(script => script.parentNode?.removeChild(script));
        
        // Inject the HTML content (without scripts first)
        placeholder.innerHTML = tempDiv.innerHTML;

        // Execute scripts sequentially
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            
            // Handle both inline scripts and external scripts
            if (oldScript.src) {
                newScript.src = oldScript.src;
                await new Promise((resolve, reject) => {
                    newScript.onload = resolve;
                    newScript.onerror = reject;
                    placeholder.appendChild(newScript); // Append to trigger load
                });
            } else {
                newScript.textContent = oldScript.textContent;
                placeholder.appendChild(newScript); // Append to execute inline scripts
            }
        }
        
        return true;
    } catch (error) {
        componentLog(`Failed to load ${url}: ${error.message}`, 'error');
        return false;
    }
}

async function loadCommonComponents() {
    componentLog("Initializing component sequence...");
    const components = [
        { id: 'header-placeholder', url: '/components/header.html' },
        { id: 'fab-container-placeholder', url: '/components/fab-container.html' },
        { id: 'footer-placeholder', url: '/components/footer.html' }
    ];

    for (const comp of components) {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            if (success) {
                // Explicitly initialize controllers after their HTML is loaded and scripts inside are run
                // This assumes IVSHeaderController and IVSFabController are globally available now.
                if (comp.id === 'header-placeholder' && window.IVSHeaderController && typeof window.IVSHeaderController.init === 'function') {
                    window.IVSHeaderController.init();
                } else if (comp.id === 'fab-container-placeholder' && window.IVSFabController && typeof window.IVSFabController.init === 'function') {
                    window.IVSFabController.init();
                }
            }
        }
    }

    // Ensure the language system is initialized after components are loaded
    // It should ideally be initialized earlier if possible, but this is a fallback
    // given its self-initialization nature now.
    if (window.langSystem && typeof window.langSystem.initializeLanguageSystem === 'function') {
        window.langSystem.initializeLanguageSystem(); // Call the global language system init
    } else {
        componentLog('Language system (window.langSystem.initializeLanguageSystem) not found or not ready.', 'warn');
    }

    componentLog("Component sequence complete.");
    window.onPageComponentsLoadedCallback?.();
}

// ================= IVSHeaderController (GỘP) =================
const IVSHeaderController = {
    init() {
        window.componentLog("IVSHeaderController: Bắt đầu khởi tạo.", "info");
        this.cacheDOM();
        if (!this.header) {
            window.componentLog("IVSHeaderController: Không tìm thấy phần tử Header. Logic UI sẽ không chạy.", "error");
            return;
        }
        this.bindEvents();
        this.updateActiveLinks();
        this.onScroll();
        if (this.mobilePanel) {
            this.mobilePanel.classList.add('hidden', 'opacity-0');
            this.mobileMenuContainer.classList.add('translate-x-full');
        }
        window.componentLog("IVSHeaderController: Khởi tạo hoàn tất.", "info");
    },
    cacheDOM() {
        this.header = document.getElementById('ivs-main-header');
        this.mobilePanel = document.getElementById('ivs-mobile-menu-panel');
        this.mobileOpenBtn = document.getElementById('mobile-menu-open-btn');
        this.mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
        this.mobileBackdrop = document.getElementById('ivs-mobile-menu-backdrop');
        this.mobileMenuContainer = document.getElementById('ivs-mobile-menu-container');
        this.bottomNavMenuBtn = document.getElementById('bottom-nav-menu-btn');
        this.langToggleButtons = document.querySelectorAll('.lang-toggle-btn');
        this.langConfirmMessage = document.getElementById('lang-confirm-message');
        this.submenuToggles = document.querySelectorAll('.mobile-submenu-toggle');
        this.navLinks = document.querySelectorAll('a.desktop-nav-link, .dropdown-item, #ivs-mobile-main-nav a, a.bottom-nav-item');
        window.componentLog(`IVSHeaderController: Header: ${!!this.header}, Mobile Panel: ${!!this.mobilePanel}, Open Btn: ${!!this.mobileOpenBtn}, Close Btn: ${!!this.mobileCloseBtn}, Backdrop: ${!!this.mobileBackdrop}, Mobile Menu Container: ${!!this.mobileMenuContainer}`, 'info');
        window.componentLog(`IVSHeaderController: Bottom Nav Menu Btn: ${!!this.bottomNavMenuBtn}`, 'info');
        window.componentLog(`IVSHeaderController: Language Toggle Buttons count: ${this.langToggleButtons.length}`, 'info');
        window.componentLog(`IVSHeaderController: Language Confirm Message: ${!!this.langConfirmMessage}`, 'info');
        window.componentLog(`IVSHeaderController: Submenu Toggles count: ${this.submenuToggles.length}`, 'info');
    },
    bindEvents() {
        window.componentLog("IVSHeaderController: Bắt đầu gắn kết sự kiện.", "info");
        window.addEventListener('scroll', window.debounce(() => this.onScroll(), 50), { passive: true });
        window.componentLog("IVSHeaderController: Đã gắn sự kiện Scroll.");
        if (this.mobileOpenBtn) {
            this.mobileOpenBtn.addEventListener('click', () => this.toggleMobileMenu(true));
            window.componentLog("IVSHeaderController: Đã gắn sự kiện click cho mobile-menu-open-btn.");
        }
        if (this.mobileCloseBtn) {
            this.mobileCloseBtn.addEventListener('click', () => this.toggleMobileMenu(false));
            window.componentLog("IVSHeaderController: Đã gắn sự kiện click cho mobile-menu-close-btn.");
        }
        if (this.mobileBackdrop) {
            this.mobileBackdrop.addEventListener('click', () => this.toggleMobileMenu(false));
            window.componentLog("IVSHeaderController: Đã gắn sự kiện click cho mobile-menu-backdrop.");
        }
        if (this.bottomNavMenuBtn) {
            this.bottomNavMenuBtn.addEventListener('click', () => this.toggleMobileMenu(true));
            window.componentLog("IVSHeaderController: Đã gắn sự kiện click cho bottom-nav-menu-btn.");
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.mobilePanel.classList.contains('hidden')) {
                this.toggleMobileMenu(false);
            }
        });
        window.componentLog("IVSHeaderController: Đã gắn sự kiện Keydown (Escape).", "info");
        this.submenuToggles.forEach((toggle, index) => {
            toggle.addEventListener('click', () => this.toggleSubmenu(toggle));
            window.componentLog(`IVSHeaderController: Đã gắn sự kiện click cho Submenu Toggle ${index}.`);
        });
        this.langToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lang = button.dataset.lang;
                if (lang) {
                    this.setLanguage(lang);
                }
            });
            window.componentLog(`IVSHeaderController: Đã gắn sự kiện click cho nút ngôn ngữ data-lang="${button.dataset.lang}".`);
        });
        window.componentLog("IVSHeaderController: Gắn kết sự kiện hoàn tất.", "info");
    },
    setLanguage(lang) {
        window.componentLog(`IVSHeaderController: Attempting to switch language to ${lang}`, "info");
        if (typeof window.changeLanguage === 'function') {
            window.changeLanguage(lang)
                .then(() => {
                    this.langToggleButtons.forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.lang === lang);
                    });
                    if (this.langConfirmMessage) {
                        this.langConfirmMessage.textContent = lang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English';
                        this.langConfirmMessage.classList.remove('hidden');
                        setTimeout(() => {
                            this.langConfirmMessage.classList.add('hidden');
                        }, 2000);
                    }
                })
                .catch(error => {
                    window.componentLog(`IVSHeaderController: Error switching language: ${error}`, "error");
                });
        } else {
            window.componentLog("IVSHeaderController: window.changeLanguage function not found", "error");
        }
    },
    updateLanguageButtonStates(currentLang) {
        this.langToggleButtons.forEach(button => {
            if (button.dataset.lang === currentLang) {
                button.classList.add('active-language');
            } else {
                button.classList.remove('active-language');
            }
        });
    },
    showLangConfirmation() {
        if (this.langConfirmMessage) {
            const currentLang = window.langSystem?.currentLanguage || 'en';
            if (currentLang === 'vi') {
                this.langConfirmMessage.textContent = 'Ngôn ngữ đã đổi!';
            } else {
                this.langConfirmMessage.textContent = 'Language changed!';
            }
            this.langConfirmMessage.classList.remove('opacity-0', 'scale-90', 'pointer-events-none', 'hidden');
            this.langConfirmMessage.classList.add('opacity-100', 'scale-100');
            setTimeout(() => {
                this.langConfirmMessage.classList.remove('opacity-100', 'scale-100');
                this.langConfirmMessage.classList.add('opacity-0', 'scale-90');
                this.langConfirmMessage.addEventListener('transitionend', () => {
                    if (this.langConfirmMessage.classList.contains('opacity-0')) {
                        this.langConfirmMessage.classList.add('hidden', 'pointer-events-none');
                    }
                }, { once: true });
            }, 1500);
        }
    },
    onScroll() {
        if (this.header) {
            this.header.classList.toggle('scrolled', window.scrollY > 10);
        }
    },
    toggleMobileMenu(show) {
        if (!this.mobilePanel || !this.mobileMenuContainer) {
            window.componentLog("IVSHeaderController: Missing mobile menu elements", "error");
            return;
        }
        if (show) {
            this.mobilePanel.classList.remove('hidden');
            setTimeout(() => {
                this.mobilePanel.classList.remove('opacity-0');
                this.mobileMenuContainer.classList.remove('translate-x-full');
            }, 10);
        } else {
            this.mobilePanel.classList.add('opacity-0');
            this.mobileMenuContainer.classList.add('translate-x-full');
            setTimeout(() => {
                this.mobilePanel.classList.add('hidden');
            }, 300);
        }
    },
    toggleSubmenu(toggle) {
        const content = toggle.nextElementSibling;
        const icon = toggle.querySelector('i.fa-chevron-down');
        if (!content) {
            window.componentLog("IVSHeaderController: Nội dung submenu không tìm thấy.", 'warn');
            return;
        }
        const isExpanded = content.style.maxHeight && content.style.maxHeight !== '0px';
        if (icon) {
            icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }
        toggle.setAttribute('aria-expanded', !isExpanded);
        content.style.maxHeight = isExpanded ? '0px' : `${content.scrollHeight}px`;
        window.componentLog(`IVSHeaderController: Submenu ${isExpanded ? 'đóng' : 'mở'} cho ${toggle.textContent.trim()}.`);
    },
    updateActiveLinks() {
        const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
        this.navLinks.forEach(link => {
            const linkPath = (link.getAttribute('href') || "").replace(/\/$/, "") || "/";
            link.classList.remove('active');
            if (linkPath === currentPath) {
                link.classList.add('active');
            } else if (linkPath !== "/" && currentPath.startsWith(linkPath)) {
                link.classList.add('active');
            }
        });
        window.componentLog("IVSHeaderController: Đã cập nhật các liên kết đang hoạt động.");
    }
};
window.IVSHeaderController = IVSHeaderController;

document.addEventListener('DOMContentLoaded', loadCommonComponents);
