'use strict';

/**
 * @fileoverview script.js
 * This file contains all the initialization logic for shared components like the header,
 * footer, and FAB buttons. It is loaded by `loadComponents.js` after the
 * component HTML and core dependencies are ready.
 */

// --- HELPER FUNCTIONS ---

/**
 * Debounces a function to limit the rate at which it gets called.
 * @param {Function} func The function to debounce.
 * @param {number} wait The timeout in milliseconds.
 * @returns {Function} The debounced function.
 */
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

// --- INITIALIZATION FUNCTIONS ---
// These functions are exported to the global window scope to be called by the loader.

/**
 * Initializes all interactive functionalities of the Header component.
 * This includes desktop/mobile dropdowns, the mobile menu toggle, and the theme switcher.
 */
function initializeHeader() {
    const header = document.getElementById('navbar');
    if (!header) {
        console.error('[IVS Script] Header element with id "navbar" not found for initialization.');
        return;
    }

    // --- Desktop Dropdown Logic (Hover-based) ---
    header.querySelectorAll('.hidden.md\\:flex .relative').forEach(dropdown => {
        const button = dropdown.querySelector('button');
        const menu = dropdown.querySelector('.absolute');
        if (button && menu) {
            dropdown.addEventListener('mouseenter', () => menu.classList.remove('hidden'));
            dropdown.addEventListener('mouseleave', () => menu.classList.add('hidden'));
        }
    });

    // --- Language Switcher Dropdown (Click-based) ---
    const langToggle = document.getElementById('language-toggle');
    const langDropdown = document.getElementById('language-dropdown');
    if (langToggle && langDropdown) {
        langToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the document click listener from firing immediately
            langDropdown.classList.toggle('hidden');
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const openIcon = document.getElementById('mobile-menu-icon-open');
    const closeIcon = document.getElementById('mobile-menu-icon-close');
    if (mobileMenuButton && mobileMenu && openIcon && closeIcon) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            openIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
        });
    }
    
    // --- Mobile Dropdown Submenus (Click-based) ---
    document.querySelectorAll('.mobile-nav-link-dropdown').forEach(button => {
        button.addEventListener('click', () => {
            const dropdownId = button.getAttribute('data-target');
            const dropdownMenu = document.getElementById(dropdownId);
            if(dropdownMenu) {
                dropdownMenu.classList.toggle('hidden');
                const icon = button.querySelector('i.fa-chevron-down');
                if (icon) {
                    icon.classList.toggle('rotate-180');
                }
            }
        });
    });

    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');
        const htmlEl = document.documentElement;

        themeToggle.addEventListener('click', () => {
            htmlEl.classList.toggle('dark');
            sunIcon.classList.toggle('hidden');
            moonIcon.classList.toggle('hidden');
            localStorage.setItem('theme', htmlEl.classList.contains('dark') ? 'dark' : 'light');
        });
    }
    
    // --- Global Click Listener to Close Dropdowns ---
    document.addEventListener('click', (event) => {
        // Close language dropdown if click is outside
        if (langDropdown && !langDropdown.classList.contains('hidden') && !langToggle.contains(event.target)) {
            langDropdown.classList.add('hidden');
        }
    });

    console.log('[IVS Script] Header has been fully initialized.');
}
window.initializeHeader = initializeHeader;


/**
 * Initializes all Floating Action Buttons, including the main toggle and scroll-to-top.
 * This function preserves the logic from the original `index.html`.
 */
function initializeFabButtons() {
    // --- Main FAB Menu Toggle (from original index.html) ---
    const fabContainer = document.getElementById('fab-container');
    const fabToggle = document.getElementById('fab-toggle');
    if (fabContainer && fabToggle) {
        fabToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            fabContainer.classList.toggle('open');
        });
        console.log('[IVS Script] Main FAB menu toggle initialized.');
    }

    // --- Scroll-to-Top FAB Logic ---
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    if (scrollToTopBtn) {
        const toggleVisibility = () => {
            scrollToTopBtn.classList.toggle('hidden', window.scrollY < 200);
        };
        window.addEventListener('scroll', debounce(toggleVisibility, 150));
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        console.log('[IVS Script] Scroll-to-top FAB initialized.');
    }
}
window.initializeFabButtons = initializeFabButtons;


/**
 * Initializes the footer, primarily by setting the current year.
 */
function initializeFooter() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
        console.log('[IVS Script] Footer initialized.');
    }
}
window.initializeFooter = initializeFooter;
