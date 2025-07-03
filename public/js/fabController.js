/**
 * @fileoverview IVSFabController - Manages Floating Action Button (FAB) functionalities.
 * This script handles scroll-to-top, contact options, share options, and their submenus.
 * It relies on global utility functions from utils.js (componentLog, debounce).
 * @version 1.6 - Enhanced auto-initialization and logging for multi-page functionality.
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
            menu.classList.remove('opacity-0', 'scale-95', 'translate-y-2'); // Re-added translate-y-2 for open animation
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
        menu.classList.add('opacity-0', 'scale-95', 'translate-y-2'); // Re-added translate-y-2 for close animation
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
```

---

**Hướng dẫn để FAB hoạt động trên TẤT CẢ các trang:**

Để đảm bảo FAB hoạt động trên mọi trang HTML của bạn, bạn cần chắc chắn rằng các script và thành phần HTML cần thiết được nhúng đúng cách trong mỗi file HTML.

1.  **Trong mỗi file HTML của bạn (ví dụ: `about.html`, `foreign-teacher-services.html`, `teacher-lists-available.html`, v.v.):**

    * **Thêm placeholder cho FAB Container:** Đặt dòng này vào cuối thẻ `<body>` của mỗi trang, ngay trước thẻ đóng `</body>`:
        ```html
        <div id="fab-container-placeholder"></div>
        ```
        (Nếu bạn đang sử dụng `loadComponents.js` để tự động chèn `fab-container.html` vào placeholder này, thì bạn đã làm đúng bước này.)

    * **Nhúng các file JavaScript cần thiết:** Đảm bảo các script sau được nhúng ở cuối thẻ `<body>` của **mỗi trang**, theo đúng thứ tự:

        ```html
        <!-- Đảm bảo utils.js được tải trước fabController.js -->
        <script src="/js/utils.js"></script>
        <script src="/js/fabController.js"></script>
        <!-- Các script khác của bạn -->
        <script src="/js/loadComponents.js"></script>
        <script src="/js/language.js"></script>
        <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
        <!-- ... các script khác nếu có -->
        ```

        **Giải thích:**
        * `utils.js` chứa các hàm tiện ích (`componentLog`, `debounce`) mà `fabController.js` phụ thuộc, nên nó phải được tải trước.
        * `fabController.js` chứa logic chính của FAB và sẽ tự động khởi tạo khi DOMContentLoaded.
        * `loadComponents.js` chịu trách nhiệm tải và chèn `fab-container.html` vào `div#fab-container-placeholder`. `fabController.js` có một cơ chế kiểm tra để đảm bảo nó chỉ khởi tạo khi `#fab-container` thực sự có mặt trong DOM.

Bằng cách này, khi bất kỳ trang nào được tải, FAB và các chức năng của nó sẽ được khởi tạo tự động.

Hãy kiểm tra lại các file HTML của bạn và đảm bảo cấu trúc script như trên. Nếu sau khi thực hiện vẫn có vấn đề, vui lòng cung cấp thêm thông tin chi tiết về trang nào không hoạt động và bất kỳ lỗi nào xuất hiện trong console của trình duy