/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 4.3 - Integrated language switching logic into the main header controller.
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
 * All logic related to the Header and Mobile Menu.
 * Handles responsive menu, submenus, and scroll effects.
 */
const IVSHeaderController = {
    init() {
        this.cacheDOM();
        if (!this.header) {
            componentLog("Header element not found. UI logic will not run.", "warn");
            return;
        }
        this.bindEvents();
        this.updateActiveLinks();
        this.onScroll(); 
        componentLog("Header Controller Initialized.", "info");
    },

    cacheDOM() {
        this.header = document.getElementById('ivs-main-header');
        this.mobilePanel = document.getElementById('ivs-mobile-menu-panel');
        this.mobileOpenBtn = document.getElementById('mobile-menu-open-btn');
        this.mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
        this.mobileBackdrop = document.getElementById('ivs-mobile-menu-backdrop');
        this.bottomNavMenuBtn = document.getElementById('bottom-nav-menu-btn');
        this.submenuToggles = document.querySelectorAll('.mobile-submenu-toggle');
        this.navLinks = document.querySelectorAll('a.desktop-nav-link, .dropdown-item, #ivs-mobile-main-nav a, a.bottom-nav-item');
        // Bổ sung: Lấy các nút chọn ngôn ngữ
        this.langOptions = document.querySelectorAll('.lang-option');
    },

    bindEvents() {
        window.addEventListener('scroll', debounce(() => this.onScroll(), 50), { passive: true });
        
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

        // Bổ sung: Gán sự kiện cho các nút chọn ngôn ngữ
        this.langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                if (lang) {
                    this.setLanguage(lang);
                }
            });
        });
    },
    
    // Bổ sung: Thêm hàm xử lý chuyển đổi ngôn ngữ
    setLanguage(lang) {
        componentLog(`Attempting to set language to: ${lang}`);
        // Gọi đến hệ thống quản lý ngôn ngữ chính (giả định tồn tại trên window.system)
        if (window.system && typeof window.system.setLanguage === 'function') {
            window.system.setLanguage(lang);
        } else {
            componentLog('Language system (window.system.setLanguage) not found.', 'warn');
        }
        // Đóng menu di động sau khi chọn
        this.toggleMobileMenu(false);
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

    updateActiveLinks() {
        const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
        this.navLinks.forEach(link => {
            const linkPath = (link.getAttribute('href') || "").replace(/\/$/, "") || "/";
            link.classList.remove('active');
            if (linkPath === currentPath) {
                link.classList.add('active');
            } else if (linkPath !== "/" && currentPath.startsWith(linkPath)) {
                // Also activate parent link if on a child page
                link.classList.add('active');
            }
        });
    }
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
        element.innerHTML = contacts.map(c => `<a href="${c.href}" role="menuitem" class="fab-submenu-item group" data-lang-key="${c.key}" ${c.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}><i class="${c.icon} fa-fw ${c.color}"></i><span>${c.text}</span></a>`).join('');
    },

    populateShareOptions(element) {
        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(document.title);
        const shares = [
            { text: "Facebook", icon: "fab fa-facebook-f", color: "text-blue-600", action: `window.open('https://www.facebook.com/sharer/sharer.php?u=${currentUrl}', '_blank', 'noopener,noreferrer')` },
            { text: "Sao chép", icon: "fas fa-link", color: "text-gray-500", action: `navigator.clipboard.writeText(decodeURIComponent('${currentUrl}')).then(() => alert('Đã sao chép liên kết!'), () => alert('Không thể sao chép liên kết.'))` }
        ];
        element.innerHTML = shares.map(s => `<button role="menuitem" class="fab-submenu-item group w-full" onclick="${s.action}"><i class="${s.icon} fa-fw ${s.color}"></i><span>${s.text}</span></button>`).join('');
    },

    bindEvents() {
        if (this.scrollToTopBtn) {
            const handleScroll = () => {
                if (window.scrollY > 200) {
                    this.scrollToTopBtn.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
                } else {
                    this.scrollToTopBtn.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
                }
            };
            window.addEventListener('scroll', debounce(handleScroll, 100), { passive: true });
            this.scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            handleScroll(); 
        }

        this.buttonsWithSubmenu.forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            this.toggleSubmenu(btn);
        }));

        document.addEventListener('click', () => this.buttonsWithSubmenu.forEach(btn => this.closeSubmenu(btn)));
    },

    toggleSubmenu(btn) {
        const isCurrentlyOpen = btn.getAttribute('aria-expanded') === 'true';
        this.buttonsWithSubmenu.forEach(otherBtn => this.closeSubmenu(otherBtn));
        if (!isCurrentlyOpen) this.openSubmenu(btn);
    },

    openSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.remove('hidden');
        requestAnimationFrame(() => menu.classList.remove('opacity-0', 'scale-95'));
        btn.setAttribute('aria-expanded', 'true');
    },

    closeSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.add('opacity-0', 'scale-95');
        const onTransitionEnd = () => {
            if (menu.classList.contains('opacity-0')) menu.classList.add('hidden');
            menu.removeEventListener('transitionend', onTransitionEnd);
        };
        menu.addEventListener('transitionend', onTransitionEnd);
        btn.setAttribute('aria-expanded', 'false');
    }
};

// =================================================================
//  MAIN COMPONENT LOADER
// =================================================================
async function loadAndInject(url, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        componentLog(`Placeholder '${placeholderId}' not found.`, "error");
        return false;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        placeholder.innerHTML = await response.text();
        return true;
    } catch (error) {
        componentLog(`Failed to load ${url}: ${error.message}`, 'error');
        return false;
    }
}

async function loadCommonComponents() {
    componentLog("Initializing component sequence...");
    const components = [
        { id: 'header-placeholder', url: '/components/header.html', controller: IVSHeaderController },
        { id: 'footer-placeholder', url: '/components/footer.html', controller: null },
        { id: 'fab-container-placeholder', url: '/components/fab-container.html', controller: IVSFabController }
    ];

    await Promise.all(components.map(async (comp) => {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            if (success && comp.controller) comp.controller.init();
        }
    }));

    if (window.system?.init) window.system.init({ language: 'vi', translationUrl: '/lang/' });

    componentLog("Component sequence complete.");
    window.onPageComponentsLoadedCallback?.();
}

document.addEventListener('DOMContentLoaded', loadCommonComponents);
