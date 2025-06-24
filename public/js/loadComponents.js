/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 2.0 - Combined component loader and UI controller.
 * @author IVS-Technical-Team
 */

// A set to keep track of loaded component URLs to prevent duplicate fetches.
const loadedComponents = new Set();
const componentLogs = [];

/**
 * Logs a message related to component loading and stores it.
 * @param {string} message - The message to log.
 * @param {'info'|'warn'|'error'} [level='info'] - The log level.
 */
function componentLog(message, level = 'info') {
    const logEntry = `[IVS Components] ${message}`;
    componentLogs.push(logEntry);
    // Use a try-catch block for console to prevent errors in environments where it might not be available.
    try {
        switch (level) {
            case 'error': console.error(logEntry); break;
            case 'warn': console.warn(logEntry); break;
            default: console.log(logEntry); break;
        }
    } catch (e) {}
}

// =================================================================
//  HEADER UI LOGIC (Integrated directly for reliable execution)
// =================================================================
const IVSHeader = {
    init() {
        this.cacheDOM();
        if (!this.header) {
            componentLog("Header element not found in DOM. UI logic will not run.", "warn");
            return;
        }
        this.bindEvents();
        this.updateActiveLinks();
        this.onScroll(); // Initial check
    },

    cacheDOM() {
        this.header = document.getElementById('ivs-main-header');
        this.mobilePanel = document.getElementById('ivs-mobile-menu-panel');
        this.mobileOpenBtn = document.getElementById('mobile-menu-open-btn');
        this.mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
        this.mobileBackdrop = document.getElementById('ivs-mobile-menu-backdrop');
        this.bottomNavMenuBtn = document.getElementById('bottom-nav-menu-btn');
        this.submenuToggles = document.querySelectorAll('.mobile-submenu-toggle');
        this.langOptions = document.querySelectorAll('.lang-option');
        this.currentLangDesktop = document.getElementById('current-lang-desktop');
        this.navLinks = document.querySelectorAll('a.desktop-nav-link, .dropdown-item, #ivs-mobile-main-nav a, a.bottom-nav-item');
    },

    bindEvents() {
        window.addEventListener('scroll', () => this.onScroll());
        this.mobileOpenBtn?.addEventListener('click', () => this.toggleMobileMenu(true));
        this.mobileCloseBtn?.addEventListener('click', () => this.toggleMobileMenu(false));
        this.mobileBackdrop?.addEventListener('click', () => this.toggleMobileMenu(false));
        this.bottomNavMenuBtn?.addEventListener('click', () => this.toggleMobileMenu(true));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mobilePanel?.classList.contains('is-open')) {
                this.toggleMobileMenu(false);
            }
        });

        this.submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleSubmenu(toggle));
        });
        
        this.langOptions.forEach(option => {
            option.addEventListener('click', () => this.setLanguage(option.dataset.lang));
        });
    },

    onScroll() {
        if (this.header) {
            this.header.classList.toggle('scrolled', window.scrollY > 10);
        }
    },
    
    toggleMobileMenu(open) {
        if (!this.mobilePanel) return;
        this.mobilePanel.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    },

    toggleSubmenu(toggle) {
        const content = toggle.nextElementSibling;
        const icon = toggle.querySelector('i.fa-chevron-down');
        if (!content) return;
        
        const isExpanded = content.style.maxHeight && content.style.maxHeight !== '0px';

        if (icon) {
            icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }

        content.style.maxHeight = isExpanded ? '0px' : `${content.scrollHeight}px`;
    },
    
    setLanguage(lang) {
        componentLog(`Language selected: ${lang}`);
        if(this.currentLangDesktop) {
            this.currentLangDesktop.textContent = lang.toUpperCase();
        }
        
        if (window.system && typeof window.system.setLanguage === 'function') {
            window.system.setLanguage(lang);
        } else {
            componentLog("Language system (window.system.setLanguage) not found.", "warn");
        }

        this.toggleMobileMenu(false);
    },

    updateActiveLinks() {
        try {
            const currentPath = window.location.pathname;
            this.navLinks.forEach(link => {
                const linkPath = link.getAttribute('href');
                link.classList.remove('active');
                if (!linkPath) return;

                if (linkPath !== '/' && currentPath.startsWith(linkPath)) {
                    link.classList.add('active');
                } else if (linkPath === '/' && currentPath === '/') {
                    link.classList.add('active');
                }
            });
        } catch (e) {
            componentLog(`Error updating active links: ${e.message}`, "error");
        }
    }
};


/**
 * Fetches and injects an HTML component into a specified placeholder.
 * @param {string} name - The friendly name of the component for logging.
 * @param {string} url - The URL of the component's HTML file.
 * @param {string} placeholderId - The CSS selector for the placeholder element.
 * @returns {Promise<boolean>} A promise that resolves with true on success.
 */
function loadComponent(name, url, placeholderId) {
    return new Promise((resolve, reject) => {
        const placeholder = document.querySelector(placeholderId);
        if (!placeholder) {
            return reject(new Error(`Placeholder '${placeholderId}' for ${name} not found.`));
        }

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                return response.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
                componentLog(`Successfully loaded ${name}.`);
                resolve(true);
            })
            .catch(error => {
                componentLog(`Failed to load ${name}: ${error.message}`, 'error');
                placeholder.innerHTML = `<div class="text-red-500 p-4 text-center">[Component ${name} failed to load]</div>`;
                reject(error);
            });
    });
}

/**
 * Main function to orchestrate the loading of all common page components.
 */
async function loadCommonComponents() {
    componentLog("Initializing common component loading sequence...");

    const headerPromise = loadComponent('Header', '/components/header.html', '#header-placeholder');
    const footerPromise = loadComponent('Footer', '/components/footer.html', '#footer-placeholder');
    const fabPromise = loadComponent('FABs', '/components/fab-container.html', '#fab-container-placeholder');

    // Wait for the header to load before initializing its logic and dependent systems.
    try {
        await headerPromise;
        componentLog("Header HTML is in the DOM. Initializing UI logic and language system...");
        IVSHeader.init();

        if (window.system && typeof window.system.init === 'function') {
            window.system.init({ language: 'vi', translationUrl: '/lang/' });
            componentLog("Language system initialized.");
        } else {
            componentLog("Language system (window.system) not found.", "warn");
        }
    } catch (error) {
        componentLog("Critical error loading header. Dependent functionalities may fail.", "error");
    }

    // Wait for all other components to settle.
    await Promise.allSettled([footerPromise, fabPromise]);
    
    componentLog("Component loading sequence complete.");
    if (typeof window.onPageComponentsLoadedCallback === 'function') {
        componentLog("Executing page-specific callback: onPageComponentsLoadedCallback.");
        window.onPageComponentsLoadedCallback();
    }
}

// Start the process once the DOM is ready.
document.addEventListener('DOMContentLoaded', loadCommonComponents);
