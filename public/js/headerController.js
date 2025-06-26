/**
 * @fileoverview This script manages all Header and Mobile Menu interactions.
 * It is designed to be loaded dynamically via loadComponents.js.
 * @version 1.3 - Enhanced Mobile Menu & Language Toggle Transitions, improved accessibility.
 * @author IVS-Technical-Team
 */

'use strict';

// GLOBAL UTILITIES (Now assumed to be provided by loadComponents.js)
// No longer duplicated here. 'window.componentLog' and 'window.debounce' are expected to be available.

/**
 * All logic related to the Header and Mobile Menu.
 * Handles responsive menu, submenus, and scroll effects.
 */
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
        // Initial setup for mobile menu panel state
        if (this.mobilePanel) {
            this.mobilePanel.classList.add('translate-x-full'); // Ensure it starts hidden
            this.mobilePanel.style.display = 'none'; // Ensure it's hidden from screen readers initially
        }
        window.componentLog("IVSHeaderController: Khởi tạo hoàn tất.", "info");
    },

    cacheDOM() {
        this.header = document.getElementById('ivs-main-header');
        this.mobilePanel = document.getElementById('ivs-mobile-menu-panel');
        this.mobileOpenBtn = document.getElementById('mobile-menu-open-btn');
        this.mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
        this.mobileBackdrop = document.getElementById('ivs-mobile-menu-backdrop');
        this.mobileMenuContainer = document.getElementById('ivs-mobile-menu-container'); // Added for slide effect
        this.bottomNavMenuBtn = document.getElementById('bottom-nav-menu-btn');
        this.bottomNavLangToggleBtn = document.getElementById('bottom-nav-lang-toggle-btn');
        this.langConfirmMessage = document.getElementById('lang-confirm-message'); // Language confirmation message
        this.submenuToggles = document.querySelectorAll('.mobile-submenu-toggle');
        this.navLinks = document.querySelectorAll('a.desktop-nav-link, .dropdown-item, #ivs-mobile-main-nav a, a.bottom-nav-item');

        window.componentLog(`IVSHeaderController: Header: ${!!this.header}, Mobile Panel: ${!!this.mobilePanel}, Open Btn: ${!!this.mobileOpenBtn}, Close Btn: ${!!this.mobileCloseBtn}, Backdrop: ${!!this.mobileBackdrop}, Mobile Menu Container: ${!!this.mobileMenuContainer}`, 'info');
        window.componentLog(`IVSHeaderController: Bottom Nav Menu Btn: ${!!this.bottomNavMenuBtn}, Bottom Nav Lang Toggle Btn: ${!!this.bottomNavLangToggleBtn}`, 'info');
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
            if (e.key === 'Escape' && this.mobilePanel?.classList.contains('is-open')) {
                this.toggleMobileMenu(false);
            }
        });
        window.componentLog("IVSHeaderController: Đã gắn sự kiện Keydown (Escape).");

        this.submenuToggles.forEach((toggle, index) => {
            toggle.addEventListener('click', () => this.toggleSubmenu(toggle));
            window.componentLog(`IVSHeaderController: Đã gắn sự kiện click cho Submenu Toggle ${index}.`);
        });

        if (this.bottomNavLangToggleBtn) {
            this.bottomNavLangToggleBtn.addEventListener('click', () => this.toggleOneTouchLanguage());
            window.componentLog("IVSHeaderController: Đã gắn sự kiện click cho bottom-nav-lang-toggle-btn.");
        }

        // Ensure desktop language options also work (from previous versions)
        document.querySelectorAll('.desktop-dropdown-container .lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                if (lang) {
                    this.setLanguage(lang);
                }
            });
            window.componentLog("IVSHeaderController: Đã gắn sự kiện click cho tùy chọn ngôn ngữ desktop.");
        });

        window.componentLog("IVSHeaderController: Gắn kết sự kiện hoàn tất.", "info");
    },

    setLanguage(lang) {
        window.componentLog(`IVSHeaderController: Yêu cầu đặt ngôn ngữ thành: ${lang}`);
        if (window.system && typeof window.system.setLanguage === 'function') {
            window.system.setLanguage(lang);
            window.componentLog(`IVSHeaderController: Đã gọi window.system.setLanguage('${lang}').`);
            this.showLangConfirmation(); // Show confirmation message
        } else {
            window.componentLog('IVSHeaderController: Hệ thống ngôn ngữ (window.system.setLanguage) không tìm thấy. Thay đổi ngôn ngữ có thể không hoạt động như mong đợi.', 'error');
        }
    },

    toggleOneTouchLanguage() {
        if (!window.langSystem) {
            window.componentLog("IVSHeaderController: window.langSystem không khả dụng. Không thể chuyển đổi ngôn ngữ một chạm.", 'error');
            return;
        }
        const currentLang = window.langSystem.currentLanguage;
        // Toggle between 'vi' and 'en'
        const nextLang = currentLang === 'en' ? 'vi' : 'en'; 
        window.componentLog(`IVSHeaderController: Chuyển đổi ngôn ngữ một chạm: từ ${currentLang} sang ${nextLang}`);
        this.setLanguage(nextLang);
    },

    showLangConfirmation() {
        if (this.langConfirmMessage) {
            const currentLang = window.langSystem?.currentLanguage || 'en';
            if (currentLang === 'vi') {
                this.langConfirmMessage.textContent = 'Ngôn ngữ đã đổi!';
            } else {
                this.langConfirmMessage.textContent = 'Language changed!';
            }

            // Apply Tailwind transition classes for smooth animation
            this.langConfirmMessage.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
            this.langConfirmMessage.classList.add('opacity-100', 'scale-100');

            setTimeout(() => {
                this.langConfirmMessage.classList.remove('opacity-100', 'scale-100');
                this.langConfirmMessage.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
            }, 1500); // Hide after 1.5 seconds
        }
    },

    onScroll() {
        if (this.header) {
            this.header.classList.toggle('scrolled', window.scrollY > 10);
        }
    },

    toggleMobileMenu(open) {
        if (!this.mobilePanel || !this.mobileMenuContainer) {
            window.componentLog("IVSHeaderController: Mobile panel hoặc container không tìm thấy. Không thể chuyển đổi menu.", 'warn');
            return;
        }
        if (open) {
            this.mobilePanel.style.display = 'block'; // Show panel
            setTimeout(() => { // Small delay to allow display to apply
                this.mobilePanel.classList.add('is-open'); // Mark as open
                this.mobilePanel.classList.remove('opacity-0'); // Show backdrop
                this.mobileMenuContainer.classList.remove('translate-x-full'); // Slide in
            }, 50);
            document.body.style.overflow = 'hidden'; // Prevent scrolling on main body
            this.mobilePanel.setAttribute('aria-hidden', 'false');
            this.mobileMenuContainer.focus(); // Focus the menu for accessibility
        } else {
            this.mobileMenuContainer.classList.add('translate-x-full'); // Slide out
            this.mobilePanel.classList.add('opacity-0'); // Hide backdrop first
            this.mobileMenuContainer.addEventListener('transitionend', () => {
                if (this.mobileMenuContainer.classList.contains('translate-x-full')) {
                    this.mobilePanel.style.display = 'none'; // Hide completely after transition
                }
            }, { once: true });
            document.body.style.overflow = ''; // Restore scrolling
            this.mobilePanel.setAttribute('aria-hidden', 'true');
        }
        window.componentLog(`IVSHeaderController: Mobile menu ${open ? 'mở' : 'đóng'}.`);
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

        // Smooth transition for max-height
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

// Expose IVSHeaderController globally for loadComponents.js
window.IVSHeaderController = IVSHeaderController;
