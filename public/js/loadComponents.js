/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 3.0 - Integrated FAB Controller.
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
//  COMPONENT LOGIC MODULES
// =================================================================

/**
 * All logic related to the Header component.
 */
const IVSHeaderController = {
    // ... (Toàn bộ logic của Header sẽ được đặt ở đây nếu cần, hiện tại đang được xử lý trong bản demo header_final)
    // ... For brevity, assuming header logic is handled elsewhere or is self-contained.
};

/**
 * All logic related to the Floating Action Buttons (FAB).
 */
const IVSFabController = {
    init() {
        this.cacheDOM();
        if (!this.fabContainer) {
            componentLog("FAB container not found. FAB logic will not run.", "warn");
            return;
        }
        this.populateMenus();
        this.bindEvents();
        componentLog("FAB Controller Initialized.", "info");
    },

    cacheDOM() {
        this.fabContainer = document.getElementById('fab-container');
        this.scrollToTopBtn = document.getElementById('scroll-to-top-btn');
        this.buttonsWithSubmenu = this.fabContainer?.querySelectorAll('button[aria-haspopup="true"]') || [];
    },

    populateMenus() {
        const contactMenu = document.getElementById('contact-options');
        const shareMenu = document.getElementById('share-options');

        if (contactMenu) this.populateContactOptions(contactMenu);
        if (shareMenu) this.populateShareOptions(shareMenu);
    },

    populateContactOptions(element) {
        const contacts = [
            { key: "fab_call_hotline", text: "Gọi Hotline", href: "tel:+84896920547", icon: "fas fa-phone", color: "text-orange-500" },
            { key: "fab_send_email", text: "Gửi Email", href: "mailto:info@ivsacademy.edu.vn", icon: "fas fa-envelope", color: "text-red-500" },
            { key: "fab_chat_zalo", text: "Chat Zalo", href: "https://zalo.me/ivsjsc", icon: "fas fa-comment-dots", color: "text-blue-500" },
            { key: "fab_fanpage_fb", text: "Fanpage Facebook", href: "https://www.facebook.com/hr.ivsacademy/", icon: "fab fa-facebook-f", color: "text-blue-600" },
        ];
        element.innerHTML = contacts.map(c => `
            <a href="${c.href}" role="menuitem" class="fab-submenu-item group" data-lang-key="${c.key}" ${c.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                <i class="${c.icon} fa-fw ${c.color}"></i>
                <span>${c.text}</span>
            </a>
        `).join('');
    },

    populateShareOptions(element) {
        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(document.title);
        const shares = [
            { text: "Facebook", icon: "fab fa-facebook-f", color: "text-blue-600", action: `window.open('https://www.facebook.com/sharer/sharer.php?u=${currentUrl}', '_blank', 'noopener,noreferrer')` },
            { text: "Sao chép", icon: "fas fa-link", color: "text-gray-500", action: `navigator.clipboard.writeText(decodeURIComponent('${currentUrl}')).then(() => alert('Đã sao chép liên kết!'), () => alert('Không thể sao chép liên kết.'))` }
        ];
        element.innerHTML = shares.map(s => `
            <button role="menuitem" class="fab-submenu-item group w-full" onclick="${s.action}">
                <i class="${s.icon} fa-fw ${s.color}"></i>
                <span>${s.text}</span>
            </button>
        `).join('');
    },

    bindEvents() {
        // Scroll-to-top button logic
        if (this.scrollToTopBtn) {
            const handleScroll = () => {
                const isVisible = window.scrollY > 200;
                this.scrollToTopBtn.classList.toggle('hidden', !isVisible);
                this.scrollToTopBtn.classList.toggle('opacity-0', !isVisible);
            };
            window.addEventListener('scroll', debounce(handleScroll, 100), { passive: true });
            this.scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            handleScroll(); // Initial check
        }

        // Submenu logic
        this.buttonsWithSubmenu.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSubmenu(btn);
            });
        });

        // Global click to close submenus
        document.addEventListener('click', (e) => {
            this.buttonsWithSubmenu.forEach(btn => {
                const menu = document.getElementById(btn.getAttribute('aria-controls'));
                if (!btn.contains(e.target) && !menu.contains(e.target)) {
                    this.closeSubmenu(btn);
                }
            });
        });
    },

    toggleSubmenu(btn) {
        const isCurrentlyOpen = btn.getAttribute('aria-expanded') === 'true';
        // Close all other submenus first
        this.buttonsWithSubmenu.forEach(otherBtn => {
            if (otherBtn !== btn) this.closeSubmenu(otherBtn);
        });
        // Toggle the clicked one
        if (isCurrentlyOpen) {
            this.closeSubmenu(btn);
        } else {
            this.openSubmenu(btn);
        }
    },

    openSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.remove('hidden');
        requestAnimationFrame(() => {
            menu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
            menu.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
        });
        btn.setAttribute('aria-expanded', 'true');
    },

    closeSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
        menu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        // The `hidden` class is added via a transitionend listener if desired for performance,
        // but for simplicity, we can let it be controlled by the open/close state.
        btn.setAttribute('aria-expanded', 'false');
    }
};

// =================================================================
//  MAIN COMPONENT LOADER
// =================================================================

/**
 * Fetches and injects an HTML component into a specified placeholder.
 * @param {string} url - The URL of the component's HTML file.
 * @param {string} placeholderId - The CSS selector for the placeholder element.
 * @returns {Promise<boolean>} A promise that resolves with true on success.
 */
async function loadAndInject(url, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        componentLog(`Placeholder '${placeholderId}' not found.`, "error");
        return false;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        placeholder.innerHTML = await response.text();
        componentLog(`Component from ${url} loaded into #${placeholderId}.`);
        return true;
    } catch (error) {
        componentLog(`Failed to load component from ${url}: ${error.message}`, 'error');
        placeholder.innerHTML = `<div class="text-red-500 p-4 text-center">[Component failed to load]</div>`;
        return false;
    }
}

/**
 * Main function to orchestrate the loading of all common page components.
 */
async function loadCommonComponents() {
    componentLog("Initializing common component loading sequence...");

    // Define all components to be loaded
    const components = [
        { id: 'header-placeholder', url: '/components/header.html', controller: IVSHeaderController },
        { id: 'footer-placeholder', url: '/components/footer.html', controller: null }, // Assuming footer has no complex JS
        { id: 'fab-container-placeholder', url: '/components/fab-container.html', controller: IVSFabController }
    ];

    const loadingPromises = components.map(async (comp) => {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            if (success && comp.controller && typeof comp.controller.init === 'function') {
                // Initialize the controller right after its HTML is loaded
                comp.controller.init();
            }
            return success;
        }
        return true; // Resolve as true if placeholder doesn't exist
    });

    await Promise.all(loadingPromises);

    // Initialize language system after all HTML is in place
    if (window.system && typeof window.system.init === 'function') {
        window.system.init({ language: 'vi', translationUrl: '/lang/' });
        componentLog("Language system initialized.");
    } else {
        componentLog("Language system (window.system) not found.", "warn");
    }

    componentLog("Component loading sequence complete.");
    if (typeof window.onPageComponentsLoadedCallback === 'function') {
        window.onPageComponentsLoadedCallback();
    }
}

// Start the process once the DOM is ready.
document.addEventListener('DOMContentLoaded', loadCommonComponents);
