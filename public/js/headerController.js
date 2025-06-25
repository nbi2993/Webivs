/**
 * @fileoverview Logic for the main Header component.
 * Handles responsive menu, submenus, scroll effects, and language switching.
 * This script is intended to be loaded separately and attached to header.html.
 * @version 1.0 - Initialized as separate controller.
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
        this.submenuToggles = document.querySelectorAll('.mobile-submenu-toggle'); // Select all mobile submenu toggles
        this.navLinks = document.querySelectorAll('a.desktop-nav-link, .dropdown-item, #ivs-mobile-main-nav a, a.bottom-nav-item');
        this.langOptions = document.querySelectorAll('.lang-option'); // All language selection buttons
        
        // Mobile language specific elements
        this.mobileLangToggle = document.getElementById('mobile-lang-toggle');
        this.mobileLangDropdownContent = document.getElementById('mobile-lang-dropdown-content');
        this.mobileLangArrowIcon = document.getElementById('mobile-lang-arrow-icon');
        this.mobileLangDropdownContainer = document.getElementById('mobile-lang-dropdown-container'); // Parent container for click outside logic
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
                    this.closeDesktopDropdown(toggleButton); // Call a function to close
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
        this.submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.toggleSubmenu(e.currentTarget));
        });

        // Mobile language toggle button
        this.mobileLangToggle?.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from immediately closing
            this.toggleMobileLanguageDropdown();
        });

        // Language options click events
        this.langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                if (lang) {
                    this.setLanguage(lang);
                }
            });
        });
    },
    
    setLanguage(lang) {
        componentLog(`[IVSHeader] Attempting to set language to: ${lang}`);
        if (window.system && typeof window.system.setLanguage === 'function') {
            window.system.setLanguage(lang);
        } else {
            componentLog('[IVSHeader] Language system (window.system.setLanguage) not found.', 'warn');
        }
        this.updateLanguageDisplay(lang); // Update display for both desktop and mobile
        this.toggleMobileMenu(false); // Close mobile main menu if open
        this.toggleMobileLanguageDropdown(false); // Close mobile language dropdown
        // Close desktop dropdowns (language one specifically)
        document.querySelectorAll('.desktop-dropdown-container').forEach(container => {
            const toggleButton = container.querySelector('.desktop-nav-dropdown-toggle');
            if (toggleButton && toggleButton.querySelector('.fa-globe')) { // Check if it's the language dropdown
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
        if (!this.mobilePanel) return;
        this.mobilePanel.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    },

    toggleSubmenu(toggleButton) {
        const content = toggleButton.nextElementSibling;
        const icon = toggleButton.querySelector('.mobile-submenu-icon');
        if (!content || !icon) return;
        
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

        // Close other mobile submenus at the same level
        let parentContainer = toggleButton.parentNode;
        // For nested-level-content, the parent is the div containing the toggle and its content
        // The siblings are other similar divs in the same mobile-submenu-content wrapper
        if (toggleButton.classList.contains('nested-level')) {
            parentContainer = toggleButton.closest('.mobile-submenu-content');
        }

        parentContainer.querySelectorAll('.mobile-submenu-toggle[aria-expanded="true"]').forEach(otherToggle => {
            if (otherToggle !== toggleButton) {
                const otherContent = otherToggle.nextElementSibling;
                const otherIcon = otherToggle.querySelector('.mobile-submenu-icon');
                if (otherContent) otherContent.style.maxHeight = null;
                if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                otherToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Toggle current submenu
        if (isExpanded) {
            content.style.maxHeight = null;
            icon.style.transform = 'rotate(0deg)';
            toggleButton.setAttribute('aria-expanded', 'false');
        } else {
            // Set a small delay for height recalculation before expanding for smoother transition
            content.style.maxHeight = '0px'; // Reset to 0 before setting actual height
            setTimeout(() => {
                content.style.maxHeight = content.scrollHeight + 'px'; // Recalculate and set
            }, 10); // Small delay
            icon.style.transform = 'rotate(180deg)';
            toggleButton.setAttribute('aria-expanded', 'true');
        }
    },

    toggleDesktopDropdown(button, forceState) {
        const dropdown = button.parentNode.querySelector('.desktop-dropdown, .desktop-mega-menu');
        if (!dropdown) return;

        const isCurrentlyOpen = button.getAttribute('aria-expanded') === 'true';
        const shouldBeOpen = forceState !== undefined ? forceState : !isCurrentlyOpen;

        // Close all other desktop dropdowns
        document.querySelectorAll('.desktop-dropdown-container').forEach(container => {
            const otherButton = container.querySelector('.desktop-nav-dropdown-toggle');
            if (otherButton && otherButton !== button) {
                this.closeDesktopDropdown(otherButton);
            }
        });

        if (shouldBeOpen) {
            dropdown.classList.remove('hidden');
            requestAnimationFrame(() => {
                dropdown.classList.remove('opacity-0', 'scale-95', 'translate-y-[-15px]');
                dropdown.classList.add('opacity-100', 'scale-100', 'translate-y-0');
            });
            button.setAttribute('aria-expanded', 'true');
        } else {
            dropdown.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
            dropdown.classList.add('opacity-0', 'scale-95', 'translate-y-[-15px]');
            dropdown.addEventListener('transitionend', function handler() {
                if (dropdown.classList.contains('opacity-0')) { // Ensure transition finished
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
                 if (dropdown.classList.contains('opacity-0')) { // Ensure transition finished
                     dropdown.classList.add('hidden');
                 }
                 this.removeEventListener('transitionend', handler);
             }, { once: true });
             button.setAttribute('aria-expanded', 'false');
        }
    },


    // NEW: Toggle for mobile language dropdown
    toggleMobileLanguageDropdown(open) {
        if (!this.mobileLangToggle || !this.mobileLangDropdownContent || !this.mobileLangArrowIcon) return;

        const isCurrentlyOpen = this.mobileLangDropdownContent.classList.contains('opacity-100');
        const shouldBeOpen = open !== undefined ? open : !isCurrentlyOpen;

        // Close other dropdowns if any (desktop dropdowns, mobile main menu)
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
            // Force reflow and then apply transitions for smoother open
            void this.mobileLangDropdownContent.offsetWidth; 
            requestAnimationFrame(() => { // Changed setTimeout to requestAnimationFrame
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
        const allLinks = document.querySelectorAll('a.nav-link, a.mobile-nav-link, a.mobile-nav-link-sub, a.bottom-nav-item');

        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
                link.classList.add('active');
                const parentSubmenuContent = link.closest('.mobile-submenu-content');
                if(parentSubmenuContent) {
                    const toggleButton = parentSubmenuContent.previousElementSibling;
                    // Only auto-open if it's a direct submenu (not a nested one that's already handled by its own parent toggle)
                    // This prevents unwanted expansion of nested items on page load
                    if (toggleButton && !toggleButton.classList.contains('nested-level')) {
                       this.toggleSubmenu(toggleButton); // Automatically open parent submenu
                    }
                }
            } else {
                link.classList.remove('active');
            }
        });
    }
};

// Make the controller globally accessible for loadComponents.js
window.IVSHeaderController = IVSHeaderController;
