<!-- FILE: /public/components/fab-container.html -->
<!-- VERSION: 2.11 - Removed inline script, relies solely on fabController.js -->
<!-- DESCRIPTION: Optimized HTML for Floating Action Buttons. All JS moved to fabController.js. -->

<!-- Thay đổi: Nâng vị trí các nút chức năng lên để tránh bị che bởi thanh điều hướng dưới cùng. -->
<div id="fab-container" class="fixed right-4 z-30 flex flex-col items-end space-y-3 bottom-28 md:bottom-8">
    
    <!-- Nút Cuộn lên đầu trang -->
    <button id="scroll-to-top-btn" title="Lên đầu trang" aria-label="Lên đầu trang"
            class="fab-item flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-neutral-600 dark:bg-neutral-700 text-white rounded-full shadow-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-all duration-300 ease-out transform active:scale-90 opacity-0 scale-90 pointer-events-none">
        <i class="fas fa-arrow-up text-base sm:text-lg"></i>
    </button>

    <!-- Nút FAB Chia Sẻ -->
    <div class="relative group/fab">
        <button id="share-main-btn" title="Chia sẻ" aria-label="Mở menu chia sẻ" aria-haspopup="true" aria-expanded="false" aria-controls="share-options"
                class="fab-item flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl transition-transform duration-200 transform hover:scale-110 active:scale-95">
            <i class="fas fa-share-alt text-xl sm:text-2xl"></i>
        </button>
        <div id="share-options" 
             class="fab-submenu-panel hidden absolute bottom-full mb-2 p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex-col space-y-1.5 transition-all duration-200 ease-out opacity-0 scale-95 transform origin-bottom-right pointer-events-none right-0 w-auto max-w-[calc(100vw-32px)] md:min-w-[200px] md:w-auto"
             role="menu" aria-orientation="vertical" aria-labelledby="share-main-btn">
            <!-- Nội dung cho share-options sẽ được JavaScript chèn vào đây -->
        </div>
    </div>

    <!-- Nút FAB Liên Hệ (chính) -->
    <div class="relative group/fab">
        <button id="contact-main-btn" title="Liên hệ" aria-label="Mở menu liên hệ" aria-haspopup="true" aria-expanded="false" aria-controls="contact-options"
                class="fab-item flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl transition-transform duration-200 transform hover:scale-110 active:scale-95">
            <i class="fas fa-comment-dots text-xl sm:text-2xl"></i>
        </button>
        <div id="contact-options" 
             class="fab-submenu-panel hidden absolute bottom-full mb-2 p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex-col space-y-1.5 transition-all duration-200 ease-out opacity-0 scale-95 transform origin-bottom-right pointer-events-none right-0 w-auto max-w-[calc(100vw-32px)] md:min-w-[220px] md:w-auto"
             role="menu" aria-orientation="vertical" aria-labelledby="contact-main-btn">
            <!-- Nội dung cho contact-options sẽ được JavaScript chèn vào đây -->
        </div>
    </div>
</div>

<!-- 
 CSS cho các mục con của FAB. 
 Nên được chuyển vào tệp CSS chính để tối ưu, nhưng để ở đây để đảm bảo component hoạt lập.
-->
<style>
    .fab-submenu-item {
        display: flex;
        align-items: center;
        padding: 0.6rem 0.85rem;
        font-size: 0.9rem;
        color: #374151; /* gray-700 */
        border-radius: 0.375rem; /* rounded-md */
        transition: background-color 0.2s, color 0.2s;
        text-decoration: none;
        cursor: pointer;
        text-align: left;
        width: 100%;
    }
    .fab-submenu-item:hover {
        background-color: #f3f4f6; /* gray-100 */
        color: #2563eb; /* blue-600 */
    }
    .dark .fab-submenu-item {
        color: #d1d5db; /* gray-300 */
    }
    .dark .fab-submenu-item:hover {
        background-color: #374151; /* gray-700 */
        color: #60a5fa; /* blue-400 */
    }
    .fab-submenu-item i.fa-fw {
        margin-right: 0.75rem;
        width: 1.25em; 
        text-align: center;
        font-size: 1.1em;
    }
</style>
```

---

**File: `public/js/fabController.js`**


```javascript
/**
 * @fileoverview IVSFabController - Manages Floating Action Button (FAB) functionalities.
 * This script handles scroll-to-top, contact options, share options, and their submenus.
 * It relies on global utility functions from utils.js (componentLog, debounce).
 * @version 1.4 - Self-initializing, consolidated JS from fab-container.html.
 * @author IVS-Technical-Team
 */

'use strict';

// Ensure global utilities are available (componentLog, debounce)
// These are expected to be loaded via public/js/utils.js
if (typeof window.componentLog !== 'function') {
    console.error("[IVSFabController] window.componentLog is not defined. Please ensure utils.js is loaded before fabController.js.");
    window.componentLog = (msg, level = 'error') => console[level](msg); // Fallback
}
if (typeof window.debounce !== 'function') {
    console.error("[IVSFabController] window.debounce is not defined. Please ensure utils.js is loaded before fabController.js.");
    window.debounce = (func) => func; // Fallback
}

const IVSFabController = {
    /**
     * Initializes the FAB controller.
     * Caches DOM elements, populates menus, and binds event listeners.
     */
    init() {
        window.componentLog("IVSFabController: Bắt đầu khởi tạo.", "info");
        this.cacheDOM();
        if (!this.fabContainer) {
            window.componentLog("IVSFabController: Không tìm thấy phần tử FAB container (#fab-container). Logic FAB sẽ không chạy.", "warn");
            return;
        }
        this.populateMenus();
        this.bindEvents();
        window.componentLog("IVSFabController: Khởi tạo hoàn tất.", "info");
    },

    /**
     * Caches necessary DOM elements for the FAB.
     */
    cacheDOM() {
        this.fabContainer = document.getElementById('fab-container');
        this.scrollToTopBtn = document.getElementById('scroll-to-top-btn');
        // Use Optional Chaining (?) to avoid errors if fabContainer is not found
        this.buttonsWithSubmenu = this.fabContainer?.querySelectorAll('button[aria-haspopup="true"]') || [];

        window.componentLog(`IVSFabController: FAB Container: ${!!this.fabContainer}, ScrollToTopBtn: ${!!this.scrollToTopBtn}, ButtonsWithSubmenu count: ${this.buttonsWithSubmenu.length}`, 'info');
    },

    /**
     * Populates the content of contact and share submenus.
     */
    populateMenus() {
        const contactMenu = document.getElementById('contact-options');
        const shareMenu = document.getElementById('share-options');

        if (contactMenu) {
            this.populateContactOptions(contactMenu);
            window.componentLog("IVSFabController: Đã điền nội dung menu liên hệ.");
        }
        if (shareMenu) {
            this.populateShareOptions(shareMenu);
            window.componentLog("IVSFabController: Đã điền nội dung menu chia sẻ.");
        }
    },

    /**
     * Populates the contact options submenu.
     * @param {HTMLElement} element The HTML element to populate.
     */
    populateContactOptions(element) {
        const contacts = [
            { key: "fab_call_hotline", text: "Hotline", href: "tel:+84896920547", icon: "fas fa-phone", color: "text-orange-500" },
            { key: "fab_send_email", text: "Email", href: "mailto:info@ivsacademy.edu.vn", icon: "fas fa-envelope", color: "text-red-500" },
            { key: "fab_chat_zalo", text: "Zalo", href: "https://zalo.me/ivsjsc", icon: "fab fa-whatsapp", color: "text-blue-500" }, /* Changed to WhatsApp icon for Zalo */
            { key: "fab_fanpage_fb", text: "Facebook", href: "https://www.facebook.com/hr.ivsacademy/", icon: "fab fa-facebook-f", color: "text-blue-600" },
        ];
        element.innerHTML = contacts.map(c => `<a href="${c.href}" role="menuitem" class="fab-submenu-item group" data-lang-key="${c.key}" ${c.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}><i class="${c.icon} fa-fw ${c.color}"></i><span>${c.text}</span></a>`).join('');
    },

    /**
     * Populates the share options submenu.
     * @param {HTMLElement} element The HTML element to populate.
     */
    populateShareOptions(element) {
        const currentUrl = window.location.href;
        const pageTitle = document.title;

        const shares = [
            { text: "Facebook", icon: "fab fa-facebook-f", color: "text-blue-600", action: `window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}', '_blank', 'noopener,noreferrer')` },
            { text: "X (Twitter)", icon: "fab fa-x-twitter", color: "text-neutral-500", action: `window.open('https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(pageTitle)}', '_blank', 'noopener,noreferrer')` },
            { text: "LinkedIn", icon: "fab fa-linkedin", color: "text-blue-700", action: `window.open('https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(pageTitle)}', '_blank', 'noopener,noreferrer')` },
            {
                text: "Copy Link",
                icon: "fas fa-link",
                color: "text-gray-500",
                action: null // Action will be handled via event listener
            }
        ];
        element.innerHTML = shares.map((s, index) => {
            const btnId = `share-action-${index}`;
            return `<button id="${btnId}" role="menuitem" class="fab-submenu-item group w-full"><i class="${s.icon} fa-fw ${s.color}"></i><span>${s.text}</span></button>`;
        }).join('');

        shares.forEach((s, index) => {
            const btn = document.getElementById(`share-action-${index}`);
            if (btn) {
                if (s.text === "Copy Link") {
                    btn.addEventListener('click', () => {
                        try {
                            // Using document.execCommand('copy') for better iframe compatibility
                            const textarea = document.createElement('textarea');
                            textarea.value = currentUrl;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            window.componentLog('Đã sao chép liên kết vào clipboard!');
                            this.showCopiedConfirmation(btn); // Show confirmation
                        } catch (err) {
                            window.componentLog('Không thể sao chép liên kết: ' + err, 'error');
                        }
                    });
                } else if (s.action) {
                    btn.addEventListener('click', () => eval(s.action)); // Execute string action
                }
            }
        });
    },

    /**
     * Displays a temporary "Copied!" confirmation message near the target element.
     * @param {HTMLElement} targetElement The element near which to display the message.
     */
    showCopiedConfirmation(targetElement) {
        const message = 'Đã sao chép!';
        const confirmationDiv = document.createElement('div');
        confirmationDiv.textContent = message;
        confirmationDiv.className = 'absolute z-10 bg-black text-white text-xs px-2 py-1 rounded-md shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none whitespace-nowrap';

        // Position relative to the target button
        const rect = targetElement.getBoundingClientRect();
        confirmationDiv.style.top = `${rect.top - 30}px`; // Above the button
        confirmationDiv.style.left = `${rect.left + rect.width / 2}px`; // Centered horizontally
        confirmationDiv.style.transform = 'translateX(-50%)';

        document.body.appendChild(confirmationDiv);

        // Animate in
        setTimeout(() => {
            confirmationDiv.classList.remove('opacity-0');
            confirmationDiv.classList.add('opacity-100');
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            confirmationDiv.classList.remove('opacity-100');
            confirmationDiv.classList.add('opacity-0');
            confirmationDiv.addEventListener('transitionend', () => {
                confirmationDiv.remove();
            }, { once: true });
        }, 1500); // Display for 1.5 seconds
    },

    /**
     * Binds event listeners for scroll-to-top button and submenu toggles.
     */
    bindEvents() {
        if (this.scrollToTopBtn) {
            const handleScroll = () => {
                if (window.scrollY > 200) { // Use window.scrollY for consistency
                    this.scrollToTopBtn.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
                } else {
                    this.scrollToTopBtn.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
                }
            };
            window.addEventListener('scroll', window.debounce(handleScroll, 100), { passive: true });
            this.scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            handleScroll(); // Initial check on load
            window.componentLog("IVSFabController: Đã gắn sự kiện cho nút cuộn lên đầu trang.");
        }

        if (this.buttonsWithSubmenu && this.buttonsWithSubmenu.forEach) {
            this.buttonsWithSubmenu.forEach(btn => btn.addEventListener('click', e => {
                e.stopPropagation(); // Prevent document click from closing immediately
                this.toggleSubmenu(btn);
            }));
            window.componentLog("IVSFabController: Đã gắn sự kiện click cho các nút có submenu.");
        }

        document.addEventListener('click', (e) => {
            if (this.fabContainer && !this.fabContainer.contains(e.target)) {
                if (this.buttonsWithSubmenu && this.buttonsWithSubmenu.forEach) {
                    this.buttonsWithSubmenu.forEach(btn => this.closeSubmenu(btn));
                }
            }
        });
        window.componentLog("IVSFabController: Đã gắn sự kiện click toàn cục để đóng submenu FAB.");
    },

    /**
     * Toggles the visibility of a submenu.
     * @param {HTMLElement} btn The button that controls the submenu.
     */
    toggleSubmenu(btn) {
        const isCurrentlyOpen = btn.getAttribute('aria-expanded') === 'true';
        if (this.buttonsWithSubmenu && this.buttonsWithSubmenu.forEach) {
            this.buttonsWithSubmenu.forEach(otherBtn => {
                if (otherBtn !== btn) {
                    this.closeSubmenu(otherBtn); // Close other submenus
                }
            });
        }
        if (!isCurrentlyOpen) this.openSubmenu(btn);
        else this.closeSubmenu(btn);
    },

    /**
     * Opens a specific submenu.
     * @param {HTMLElement} btn The button whose submenu is to be opened.
     */
    openSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.remove('hidden', 'pointer-events-none');
        // Use rAF for immediate display before transition
        requestAnimationFrame(() => {
            menu.classList.remove('opacity-0', 'scale-95'); // Animate in
            // Removed translate-y-2 from here as it caused issues with origin-bottom-right
        });
        btn.setAttribute('aria-expanded', 'true');
        window.componentLog(`IVSFabController: Đã mở submenu cho nút: ${btn.id}`);
    },

    /**
     * Closes a specific submenu.
     * @param {HTMLElement} btn The button whose submenu is to be closed.
     */
    closeSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.add('opacity-0', 'scale-95'); // Animate out
        // Removed translate-y-2 from here
        const onTransitionEnd = () => {
            if (menu.classList.contains('opacity-0')) {
                menu.classList.add('hidden', 'pointer-events-none');
            }
            menu.removeEventListener('transitionend', onTransitionEnd);
        };
        menu.addEventListener('transitionend', onTransitionEnd);
        btn.setAttribute('aria-expanded', 'false');
        window.componentLog(`IVSFabController: Đã đóng submenu cho nút: ${btn.id}`);
    },
};

// Auto-initialize the FAB controller when the DOM is fully loaded.
// This ensures the FAB is set up even if loadComponents.js doesn't explicitly call init,
// or if the fab-container is directly included in a page.
document.addEventListener('DOMContentLoaded', () => {
    // Check if the fabContainer element exists before initializing
    if (document.getElementById('fab-container')) {
        IVSFabController.init();
    } else {
        // If fab-container is not immediately present, it might be dynamically loaded.
        // In such cases, loadComponents.js (or similar) should explicitly call IVSFabController.init()
        // after inserting the fab-container.html content.
        window.componentLog("IVSFabController: FAB container not found on DOMContentLoaded. Assuming dynamic loading. Ensure init() is called manually after insertion.", "warn");
    }
});
