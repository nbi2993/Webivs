'use strict';

/**
 * @fileoverview script.js (Phiên bản hoàn chỉnh)
 * Tệp này chứa logic khởi tạo cho các thành phần dùng chung (header, footer, FAB)
 * và tích hợp module IVSChatbot để vận hành chức năng chat.
 * Tệp này được tải bởi `loadComponents.js`.
 */

// --- CÁC HÀM HỖ TRỢ ---

/**
 * Debounce một hàm để giới hạn tần suất nó được gọi.
 * @param {Function} func Hàm cần debounce.
 * @param {number} wait Thời gian chờ (ms).
 * @returns {Function} Hàm đã được debounce.
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


// --- MODULE LOGIC GIAO DIỆN HIỆN CÓ (Được giữ nguyên) ---

const IVSHeader = {
    isMobileMenuOpen: false,
    activeDesktopDropdown: null,
    init() {
        console.log('[IVSHeader] Initializing...');
        this.addEventListeners();
        this.updateActiveLinks();
        this.updateLanguageDisplay();
        this.handleHeaderScroll();
    },
    addEventListeners() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        const mobileMenuScrim = document.getElementById('mobile-menu-scrim');
        const bottomNavMenuButton = document.getElementById('bottom-nav-menu-button');

        mobileMenuToggle?.addEventListener('click', () => this.toggleMobileMenu());
        mobileMenuClose?.addEventListener('click', () => this.toggleMobileMenu(false));
        mobileMenuScrim?.addEventListener('click', () => this.toggleMobileMenu(false));
        bottomNavMenuButton?.addEventListener('click', () => this.toggleMobileMenu());

        document.querySelectorAll('.mobile-submenu-toggle').forEach(button => {
            button.addEventListener('click', (e) => this.toggleMobileSubmenu(e.currentTarget));
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            const button = item.querySelector('button');
            if (button) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDesktopDropdown(item);
                });
            }
        });
        
        document.querySelectorAll('.lang-option, .lang-option-mobile').forEach(button => {
            button.addEventListener('click', (e) => this.setLanguage(e.currentTarget.dataset.lang));
        });

        document.addEventListener('click', (e) => {
            if (this.activeDesktopDropdown && !this.activeDesktopDropdown.contains(e.target)) {
                this.toggleDesktopDropdown(this.activeDesktopDropdown, false);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isMobileMenuOpen) this.toggleMobileMenu(false);
                if (this.activeDesktopDropdown) this.toggleDesktopDropdown(this.activeDesktopDropdown, false);
            }
        });
    },
    toggleMobileMenu(forceState = !this.isMobileMenuOpen) {
        this.isMobileMenuOpen = forceState;
        const panel = document.getElementById('mobile-menu-panel');
        const scrim = document.getElementById('mobile-menu-scrim');
        const toggleButton = document.getElementById('mobile-menu-toggle');

        if (this.isMobileMenuOpen) {
            scrim.classList.remove('hidden');
            panel.classList.remove('-right-full');
            panel.classList.add('right-0');
            document.body.style.overflow = 'hidden';
            toggleButton.setAttribute('aria-expanded', 'true');
        } else {
            scrim.classList.add('hidden');
            panel.classList.remove('right-0');
            panel.classList.add('-right-full');
            document.body.style.overflow = '';
            toggleButton.setAttribute('aria-expanded', 'false');
        }
    },
    toggleMobileSubmenu(toggleButton) {
        const targetId = toggleButton.dataset.target;
        const content = document.getElementById(targetId);
        const icon = toggleButton.querySelector('.mobile-submenu-icon');
        const wasActive = content.classList.contains('active');

        document.querySelectorAll('.mobile-submenu-content.active').forEach(activeContent => {
            if (activeContent !== content) {
                activeContent.classList.remove('active');
                activeContent.style.maxHeight = null;
                const otherIcon = activeContent.previousElementSibling.querySelector('.mobile-submenu-icon');
                if(otherIcon) otherIcon.classList.remove('rotate-180');
            }
        });
        
        if (wasActive) {
            content.classList.remove('active');
            content.style.maxHeight = null;
            if(icon) icon.classList.remove('rotate-180');
        } else {
            content.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
            if(icon) icon.classList.add('rotate-180');
        }
    },
    toggleDesktopDropdown(navItem, forceState) {
        const isCurrentlyActive = navItem.classList.contains('dropdown-active');
        const shouldBeActive = forceState !== undefined ? forceState : !isCurrentlyActive;
        const button = navItem.querySelector('button');

        if (this.activeDesktopDropdown && this.activeDesktopDropdown !== navItem) {
            this.activeDesktopDropdown.classList.remove('dropdown-active');
             const otherButton = this.activeDesktopDropdown.querySelector('button');
             if(otherButton) otherButton.setAttribute('aria-expanded', 'false');
        }

        if (shouldBeActive) {
            navItem.classList.add('dropdown-active');
            if(button) button.setAttribute('aria-expanded', 'true');
            this.activeDesktopDropdown = navItem;
        } else {
            navItem.classList.remove('dropdown-active');
            if(button) button.setAttribute('aria-expanded', 'false');
            this.activeDesktopDropdown = null;
        }
    },
    setLanguage(lang) {
        if (window.system && typeof window.system.setLanguage === 'function') {
            window.system.setLanguage(lang);
        } else {
            console.warn('[IVSHeader] Language system (window.system.setLanguage) not found.');
        }
        this.updateLanguageDisplay(lang);
        if (this.activeDesktopDropdown) this.toggleDesktopDropdown(this.activeDesktopDropdown, false);
        if (this.isMobileMenuOpen) this.toggleMobileMenu(false);
    },
    updateLanguageDisplay(currentLang) {
        const lang = currentLang || (window.system ? window.system.getCurrentLanguage() : 'vi');
        const desktopLangDisplay = document.getElementById('current-lang-desktop');
        if (desktopLangDisplay) {
            desktopLangDisplay.textContent = lang.toUpperCase();
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
                    this.toggleMobileSubmenu(toggleButton);
                }
            } else {
                link.classList.remove('active');
            }
        });
    },
    handleHeaderScroll() {
        const header = document.getElementById('main-header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 10);
        });
    }
};


// --- MODULE LOGIC CHO CHATBOT (PHẦN TÍCH HỢP MỚI) ---
const IVSChatbot = {
    // Các biến tham chiếu đến phần tử DOM
    chatContainer: null,
    chatForm: null,
    chatInput: null,
    sendButton: null,
    isWaitingForResponse: false,

    /**
     * Khởi tạo module chatbot, gán các biến và thêm event listeners.
     */
    init() {
        console.log('[IVSChatbot] Initializing...');
        // Thay thế các ID dưới đây bằng ID thực tế trong HTML của bạn nếu cần
        this.chatContainer = document.getElementById('chat-messages'); // Vùng chứa tin nhắn
        this.chatForm = document.getElementById('chatbot-form');       // Form bao quanh input và nút gửi
        this.chatInput = document.getElementById('chat-input');         // Ô nhập liệu
        this.sendButton = document.getElementById('send-button');       // Nút gửi

        // Kiểm tra các phần tử có tồn tại không
        if (!this.chatForm || !this.chatInput || !this.chatContainer) {
            console.warn('[IVSChatbot] Could not find all required chat elements on this page. Chatbot functionality will be disabled.');
            return;
        }
        
        // Gán sự kiện cho form
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
        
        console.log('[IVSChatbot] Chatbot has been initialized.');
    },

    /**
     * Xử lý việc gửi tin nhắn khi người dùng submit form.
     */
    handleSendMessage() {
        if (this.isWaitingForResponse) return; // Không gửi nếu đang chờ phản hồi
        
        const userMessage = this.chatInput.value.trim();
        if (userMessage === '') return; // Không gửi tin nhắn rỗng

        // Hiển thị tin nhắn của người dùng và xóa input
        this.addMessageToUI(userMessage, 'user');
        this.chatInput.value = '';
        
        // Hiển thị chỉ báo "Bot đang nhập..."
        this.showTypingIndicator(true);

        // Gửi tin nhắn đến backend
        this.sendMessageToServer(userMessage);
    },
    
    /**
     * Gửi tin nhắn đến server bằng phương thức POST.
     * @param {string} message Tin nhắn từ người dùng.
     */
    async sendMessageToServer(message) {
        this.isWaitingForResponse = true;
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (!response.ok) {
                 const errorText = await response.text();
                 throw new Error(`Lỗi từ server: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            // Nhận và hiển thị tin nhắn của bot
            this.addMessageToUI(data.message, 'bot');

        } catch (error) {
            console.error('[IVSChatbot] Error sending message:', error);
            this.addMessageToUI('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.', 'bot', true);
        } finally {
            // Dù thành công hay thất bại, xóa chỉ báo "đang nhập" và cho phép gửi lại
            this.showTypingIndicator(false);
            this.isWaitingForResponse = false;
        }
    },

    /**
     * Thêm một tin nhắn mới vào giao diện chat.
     * @param {string} text Nội dung tin nhắn.
     * @param {'user' | 'bot'} sender Người gửi ('user' hoặc 'bot').
     * @param {boolean} isError Tin nhắn này có phải là thông báo lỗi không.
     */
    addMessageToUI(text, sender, isError = false) {
        const messageElement = document.createElement('div');
        const bubbleElement = document.createElement('div');

        messageElement.classList.add('flex', 'mb-4', 'text-sm');
        bubbleElement.classList.add('py-2', 'px-3', 'rounded-lg', 'max-w-xs', 'lg:max-w-md');

        if (sender === 'user') {
            messageElement.classList.add('justify-end');
            bubbleElement.classList.add('bg-blue-600', 'text-white', 'rounded-br-none');
        } else {
            messageElement.classList.add('justify-start');
            bubbleElement.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200', 'rounded-bl-none');
            if (isError) {
                bubbleElement.classList.add('bg-red-200', 'dark:bg-red-800', 'text-red-900', 'dark:text-red-100');
            }
        }
        
        bubbleElement.textContent = text;
        messageElement.appendChild(bubbleElement);
        this.chatContainer.appendChild(messageElement);

        // Tự động cuộn xuống tin nhắn mới nhất
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    },
    
    /**
     * Hiển thị hoặc ẩn chỉ báo "Bot đang nhập...".
     * @param {boolean} show `true` để hiển thị, `false` để ẩn.
     */
    showTypingIndicator(show) {
        let indicator = this.chatContainer.querySelector('#typing-indicator');
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'typing-indicator';
                indicator.classList.add('flex', 'justify-start', 'mb-4', 'text-sm');
                indicator.innerHTML = `
                    <div class="py-2 px-3 rounded-lg max-w-xs lg:max-w-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                       <span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span>
                    </div>
                `;
                this.chatContainer.appendChild(indicator);
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            }
        } else {
            if (indicator) {
                indicator.remove();
            }
        }
    }
};


// --- KHỞI TẠO TOÀN BỘ LOGIC KHI DOM ĐÃ SẴN SÀNG ---
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo các thành phần giao diện chung
    IVSHeader.init();

    // Khởi tạo FAB (nút hành động nổi)
    const fabContainer = document.getElementById('fab-container');
    const fabToggle = document.getElementById('fab-toggle');
    if (fabContainer && fabToggle) {
        fabToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            fabContainer.classList.toggle('open');
        });
    }

    // Khởi tạo nút cuộn lên đầu trang
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    if (scrollToTopBtn) {
        const toggleVisibility = () => {
            scrollToTopBtn.classList.toggle('hidden', window.scrollY < 200);
        };
        window.addEventListener('scroll', debounce(toggleVisibility, 150));
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Khởi tạo Footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // Khởi tạo Chatbot
    IVSChatbot.init();

    console.log('[IVS Script] All components initialized.');
});
