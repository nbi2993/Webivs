/**
 * @fileoverview Logic for the main Header component.
 * Handles responsive menu, submenus, scroll effects, and language switching.
 * This script is intended to be loaded separately and attached to header.html.
 * @version 1.4 - Enhanced Mobile Menu, Language Toggles & Robust DOM Access
 * @author IVS-Technical-Team
 */

'use strict';

// Ensure componentLog and debounce are available (they should be from loadComponents.js)
// Fallback if somehow not loaded first (though loadComponents.js should ensure this)
if (typeof componentLog === 'undefined') {
    function componentLog(message, level = 'info') {
        console[level](`[IVS Components - Fallback] ${message}`);
    }
}
if (typeof debounce === 'undefined') {
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
}

// Định nghĩa IVSHeaderController trong scope toàn cục (window) để loadComponents.js có thể truy cập
const IVSHeaderController = {
    init() {
        this.cacheDOM();
        if (!this.header) {
            componentLog("[IVSHeader] Header element not found. UI logic will not run.", "warn");
            return;
        }
        this.bindEvents();
        this.updateActiveLinks();
        this.onScroll(); 
        this.updateLanguageDisplay(); // Call initially to set correct language text
        componentLog("[IVSHeader] Header Controller Initialized.", "info");
    },

    cacheDOM() {
        this.header = document.getElementById('ivs-main-header');
        this.mobilePanel = document.getElementById('ivs-mobile-menu-panel');
        this.mobileOpenBtn = document.getElementById('mobile-menu-open-btn');
        this.mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
        this.mobileBackdrop = document.getElementById('ivs-mobile-menu-backdrop');
        this.bottomNavMenuBtn = document.getElementById('bottom-nav-menu-btn');
        // Đảm bảo rằng `document` được sử dụng để querySelectorAll, không phải `this.mobilePanel` ban đầu
        this.submenuToggles = document.querySelectorAll('.mobile-submenu-toggle'); 
        this.navLinks = document.querySelectorAll('a.desktop-nav-link, .dropdown-item, #ivs-mobile-main-nav a, a.bottom-nav-item');
        this.langOptions = document.querySelectorAll('.lang-option'); 
        
        // Mobile language specific elements
        this.mobileLangToggle = document.getElementById('mobile-lang-toggle');
        this.mobileLangDropdownContent = document.getElementById('mobile-lang-dropdown-content');
        this.mobileLangArrowIcon = document.getElementById('mobile-lang-arrow-icon');
        this.mobileLangDropdownContainer = document.getElementById('mobile-lang-dropdown-container'); 
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
            // Close mobile language dropdown on escape
            if (e.key === 'Escape' && this.mobileLangDropdownContent && !this.mobileLangDropdownContent.classList.contains('hidden')) {
                this.toggleMobileLanguageDropdown(false);
            }
        });

        // Universal click listener to close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            // Close desktop dropdowns
            document.querySelectorAll('.desktop-dropdown-container').forEach(container => {
                const toggleButton = container.querySelector('.desktop-nav-dropdown-toggle');
                const dropdownContent = container.querySelector('.desktop-dropdown, .desktop-mega-menu');
                if (toggleButton && dropdownContent && !container.contains(e.target)) {
                    this.closeDesktopDropdown(toggleButton); 
                }
            });

            // Close mobile language dropdown if clicked outside its container
            if (this.mobileLangDropdownContent && !this.mobileLangDropdownContent.classList.contains('hidden')) {
                if (this.mobileLangDropdownContainer && !this.mobileLangDropdownContainer.contains(e.target)) {
                    this.toggleMobileLanguageDropdown(false);
                }
            }
        });

        // Mobile submenu toggles
        if (this.submenuToggles) { // Đảm bảo this.submenuToggles không null
            this.submenuToggles.forEach(toggle => {
                toggle.addEventListener('click', (e) => this.toggleSubmenu(e.currentTarget));
            });
        }

        // Mobile language toggle button
        this.mobileLangToggle?.addEventListener('click', (e) => {
            e.stopPropagation(); 
            this.toggleMobileLanguageDropdown();
        });

        // Language options click events
        if (this.langOptions) { // Đảm bảo this.langOptions không null
            this.langOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const lang = e.currentTarget.dataset.lang;
                    if (lang) {
                        this.setLanguage(lang);
                    }
                });
            });
        }

        // Event listeners for desktop dropdowns
        document.querySelectorAll('.desktop-dropdown-container').forEach(container => {
            const toggleButton = container.querySelector('.desktop-nav-dropdown-toggle');
            if (toggleButton) {
                container.addEventListener('mouseenter', () => this.toggleDesktopDropdown(toggleButton, true));
                container.addEventListener('mouseleave', () => this.toggleDesktopDropdown(toggleButton, false));
                toggleButton.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    this.toggleDesktopDropdown(toggleButton);
                });
            }
        });
    },
    
    setLanguage(lang) {
        componentLog(`[IVSHeader] Attempting to set language to: ${lang}`);
        if (window.system && typeof window.system.setLanguage === 'function') {
            window.system.setLanguage(lang);
        } else {
            componentLog('[IVSHeader] Language system (window.system.setLanguage) not found.', 'warn');
        }
        this.updateLanguageDisplay(lang); 
        this.toggleMobileMenu(false); 
        this.toggleMobileLanguageDropdown(false); 
        document.querySelectorAll('.desktop-dropdown-container').forEach(container => {
            const toggleButton = container.querySelector('.desktop-nav-dropdown-toggle');
            if (toggleButton && toggleButton.querySelector('.fa-globe')) { 
                this.closeDesktopDropdown(toggleButton);
            }
        });
    },

    onScroll() {
        if (this.header) {
            this.header.classList.toggle('scrolled', window.scrollY > 10);
        }
    },
    
    toggleMobileMenu(open) {
        if (!this.mobilePanel || !this.mobileBackdrop) {
            componentLog("Mobile panel or backdrop not found. Cannot toggle mobile menu.", "warn");
            return;
        }

        const mobileMenuContainer = this.mobilePanel.querySelector('#ivs-mobile-menu-container');
        if (!mobileMenuContainer) {
            componentLog("Mobile menu container #ivs-mobile-menu-container not found inside panel.", "warn");
            return;
        }

        if (this.mobilePanelCloseListener) {
            mobileMenuContainer.removeEventListener('transitionend', this.mobilePanelCloseListener);
            this.mobilePanelCloseListener = null;
        }

        if (open) {
            this.mobilePanel.style.display = 'block'; 
            void this.mobilePanel.offsetWidth; 
            this.mobilePanel.classList.add('is-open');
            document.body.style.overflow = 'hidden'; 
            setTimeout(() => {
                this.mobileBackdrop.style.opacity = '1';
                mobileMenuContainer.style.transform = 'translateX(0)';
            }, 10); 
        } else {
            this.mobileBackdrop.style.opacity = '0';
            mobileMenuContainer.style.transform = 'translateX(100%)';
            document.body.style.overflow = ''; 

            this.mobilePanelCloseListener = () => {
                const computedTransform = getComputedStyle(mobileMenuContainer).transform;
                // Kiểm tra xem transform đã hoàn thành về trạng thái đóng (translateX(100%) hoặc matrix tương ứng)
                // Hoặc nếu lớp 'is-open' đã bị loại bỏ
                if (!this.mobilePanel.classList.contains('is-open') || computedTransform.includes('matrix(1, 0, 0, 1,') && computedTransform.split(', ')[5].replace(')', '') !== '0') {
                    this.mobilePanel.style.display = 'none';
                }
                mobileMenuContainer.removeEventListener('transitionend', this.mobilePanelCloseListener);
                this.mobilePanelCloseListener = null;
            };
            mobileMenuContainer.addEventListener('transitionend', this.mobilePanelCloseListener, { once: true });
            this.mobilePanel.classList.remove('is-open'); // Removed this line from setTimeout to trigger transition immediately
        }
    },

    toggleSubmenu(toggleButton) {
        const content = toggleButton.nextElementSibling;
        const icon = toggleButton.querySelector('.mobile-submenu-icon');
        if (!content || !icon) {
            componentLog("Submenu content or icon not found for toggle.", "warn");
            return;
        }
        
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

        let parentContainer = toggleButton.parentNode;
        if (toggleButton.classList.contains('nested-level')) {
            parentContainer = toggleButton.closest('.mobile-submenu-content');
        }

        if (parentContainer) { 
            parentContainer.querySelectorAll('.mobile-submenu-toggle[aria-expanded="true"]').forEach(otherToggle => {
                if (otherToggle !== toggleButton) {
                    const otherContent = otherToggle.nextElementSibling;
                    const otherIcon = otherToggle.querySelector('.mobile-submenu-icon');
                    if (otherContent) otherContent.style.maxHeight = null;
                    if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                    otherToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        if (isExpanded) {
            content.style.maxHeight = null;
            icon.style.transform = 'rotate(0deg)';
            toggleButton.setAttribute('aria-expanded', 'false');
        } else {
            content.style.maxHeight = '0px'; 
            void content.offsetWidth; 
            content.style.maxHeight = content.scrollHeight + 'px'; 
            icon.style.transform = 'rotate(180deg)';
            toggleButton.setAttribute('aria-expanded', 'true');
        }
    },

    toggleDesktopDropdown(button, forceState) {
        const dropdown = button.parentNode.querySelector('.desktop-dropdown, .desktop-mega-menu');
        if (!dropdown) return;

        const isCurrentlyOpen = button.getAttribute('aria-expanded') === 'true';
        const shouldBeOpen = forceState !== undefined ? forceState : !isCurrentlyOpen; 

        document.querySelectorAll('.desktop-dropdown-container').forEach(container => {
            const otherButton = container.querySelector('.desktop-nav-dropdown-toggle');
            if (otherButton && otherButton !== button) {
                this.closeDesktopDropdown(otherButton);
            }
        });

        if (shouldBeOpen) {
            dropdown.classList.remove('hidden');
            void dropdown.offsetWidth;
            requestAnimationFrame(() => {
                dropdown.classList.remove('opacity-0', 'scale-95', 'translate-y-[-15px]');
                dropdown.classList.add('opacity-100', 'scale-100', 'translate-y-0');
            });
            button.setAttribute('aria-expanded', 'true');
        } else {
            dropdown.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
            dropdown.classList.add('opacity-0', 'scale-95', 'translate-y-[-15px]');
            dropdown.addEventListener('transitionend', function handler() {
                if (dropdown.classList.contains('opacity-0')) { 
                     dropdown.classList.add('hidden');
                }
                this.removeEventListener('transitionend', handler);
            }, { once: true });
            button.setAttribute('aria-expanded', 'false');
        }
    },
    
    closeDesktopDropdown(button) {
        const dropdown = button.parentNode.querySelector('.desktop-dropdown, .desktop-mega-menu');
        if (dropdown && !dropdown.classList.contains('hidden')) {
             dropdown.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
             dropdown.classList.add('opacity-0', 'scale-95', 'translate-y-[-15px]');
             dropdown.addEventListener('transitionend', function handler() {
                 if (dropdown.classList.contains('opacity-0')) { 
                     dropdown.classList.add('hidden');
                 }
                 this.removeEventListener('transitionend', handler);
             }, { once: true });
             button.setAttribute('aria-expanded', 'false');
        }
    },

    toggleMobileLanguageDropdown(open) {
        if (!this.mobileLangToggle || !this.mobileLangDropdownContent || !this.mobileLangArrowIcon) {
            componentLog("Mobile language elements not found.", "warn");
            return;
        }

        const isCurrentlyOpen = this.mobileLangDropdownContent.classList.contains('opacity-100');
        const shouldBeOpen = open !== undefined ? open : !isCurrentlyOpen;

        if (this.mobilePanel.classList.contains('is-open')) {
            this.toggleMobileMenu(false);
        }
        document.querySelectorAll('.desktop-dropdown-container').forEach(container => {
            const toggleButton = container.querySelector('.desktop-nav-dropdown-toggle');
            if (toggleButton) {
                this.closeDesktopDropdown(toggleButton);
            }
        });


        if (shouldBeOpen) {
            this.mobileLangDropdownContent.classList.remove('hidden');
            void this.mobileLangDropdownContent.offsetWidth; 
            requestAnimationFrame(() => { 
                this.mobileLangDropdownContent.classList.remove('opacity-0', 'translate-y-[-10px]');
                this.mobileLangDropdownContent.classList.add('opacity-100', 'translate-y-0');
            });
            
            this.mobileLangToggle.setAttribute('aria-expanded', 'true');
            this.mobileLangArrowIcon.style.transform = 'rotate(180deg)';
        } else {
            this.mobileLangDropdownContent.classList.remove('opacity-100', 'translate-y-0');
            this.mobileLangDropdownContent.classList.add('opacity-0', 'translate-y-[-10px]');
            this.mobileLangDropdownContent.addEventListener('transitionend', function handler() {
                if (this.classList.contains('opacity-0')) {
                    this.classList.add('hidden');
                }
                this.removeEventListener('transitionend', handler);
            }, { once: true });
            this.mobileLangToggle.setAttribute('aria-expanded', 'false');
            this.mobileLangArrowIcon.style.transform = 'rotate(0deg)';
        }
    },

    updateLanguageDisplay(currentLang) {
        const lang = currentLang || (window.system ? window.system.getCurrentLanguage() : 'vi');
        const desktopLangDisplay = document.getElementById('current-lang-desktop');
        const mobileLangDisplay = document.getElementById('current-lang-mobile'); 
        
        if (desktopLangDisplay) {
            desktopLangDisplay.textContent = lang.toUpperCase();
        }
        if (mobileLangDisplay) { 
            mobileLangDisplay.textContent = lang.toUpperCase();
        }
    },

    updateActiveLinks() {
        const currentPath = window.location.pathname;
        const allLinks = document.querySelectorAll('a[data-lang-key], button[data-lang-key]'); 

        allLinks.forEach(link => {
            if (link.tagName === 'A' && link.hasAttribute('href')) {
                const href = link.getAttribute('href');
                if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
                    link.classList.add('active');
                    const parentSubmenuContent = link.closest('.mobile-submenu-content');
                    if(parentSubmenuContent) {
                        const toggleButton = parentSubmenuContent.previousElementSibling;
                        if (toggleButton && !toggleButton.classList.contains('nested-level') && toggleButton.getAttribute('aria-expanded') !== 'true') {
                           this.toggleSubmenu(toggleButton); 
                        }
                    }
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }
};

// Make the controller globally accessible for loadComponents.js
window.IVSHeaderController = IVSHeaderController;

// Helper debounce function (if not already available from loadComponents.js)
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
