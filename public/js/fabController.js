/**
 * @fileoverview This script manages all Floating Action Button (FAB) and Chatbot functionalities.
 * It is designed to be loaded dynamically via loadComponents.js.
 * @version 1.1 - Combined FAB and Chatbot logic, enhanced transitions, added copy link feedback.
 * @author IVS-Technical-Team
 */

'use strict';

// =================================================================
//  GLOBAL UTILITIES (Ensures availability if loadComponents.js utilities are not yet globally defined)
// =================================================================
// These are duplicated from loadComponents.js for robustness, but ideally should be truly global.
if (typeof window.componentLog !== 'function') {
    window.componentLog = function(message, level = 'info') {
        console[level](`[IVS Components - FAB] ${message}`);
    };
}

if (typeof window.debounce !== 'function') {
    window.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
}


// =================================================================
//  CHATBOT STATE (Moved from script.js, now encapsulated here)
// =================================================================
// Initial chat history for AI model context.
let chatHistory = [
    {
        role: "user",
        parts: [{text: "Bạn là một chatbot tư vấn cho website IVS JSC, một công ty hoạt động trong lĩnh vực giáo dục, công nghệ và nhân sự tại Việt Nam. Bạn có thể cung cấp thông tin về IVS JSC, các dịch vụ của họ (tư vấn giáo dục, thiết kế web, liên kết đào tạo, cung ứng giáo viên nước ngoài, phát triển chương trình R&D, hệ sinh thái số như IVS Apps, IVS Games, IVS Read, IVS QuickTest), các dự án trọng điểm như English Olympics of Vietnam (EOV 2025), triết lý IVS (Integrate, Vision, Synergy), lộ trình phát triển và các đối tác. Hãy trả lời một cách chuyên nghiệp, tự tin, thẳng thắn, có chiều sâu chiến lược, và sử dụng ngôn ngữ chuẩn mực. Luôn đề xuất giải pháp cụ thể, khả thi. Không cung cấp thông tin cá nhân giả mạo hoặc bất kỳ dữ liệu nào không liên quan đến IVS JSC. Nếu bạn không biết câu trả lời, hãy nói rằng bạn không có thông tin về vấn đề đó. Câu trả lời đầu tiên của bạn phải là 'Chào bạn! Tôi có thể giúp gì cho bạn hôm nay?'."}]
    },
    {
        role: "model",
        parts: [{text: "Xin chào! Tôi là IVS Chatbot AI. Tôi thật sự rất háo hức để hỗ trợ bạn hôm nay!! Hãy cho tôi biết bạn cần gì nhé!"}]
    }
];


// =================================================================
//  IVSFabController - Main FAB and Chatbot Logic
// =================================================================
const IVSFabController = {
    init() {
        window.componentLog("IVSFabController: Bắt đầu khởi tạo.", "info");
        this.cacheDOM();
        if (!this.fabContainer) {
            window.componentLog("IVSFabController: Không tìm thấy phần tử FAB container. Logic FAB và Chatbot sẽ không chạy.", "warn");
            return;
        }
        this.populateMenus();
        this.bindEvents();
        this.initChatbotFunctionality(); // Khởi tạo chatbot sau khi FAB Controller đã init
        window.componentLog("IVSFabController: Khởi tạo hoàn tất.", "info");
    },

    cacheDOM() {
        this.fabContainer = document.getElementById('fab-container');
        this.scrollToTopBtn = document.getElementById('scroll-to-top-btn');
        this.buttonsWithSubmenu = this.fabContainer ? this.fabContainer.querySelectorAll('button[aria-haspopup="true"]') : [];

        // Chatbot elements
        this.chatbotOpenBtn = document.getElementById('chatbot-open-button');
        this.chatbotContainer = document.getElementById('chatbot-container');
        this.chatbotCloseBtn = document.getElementById('chatbot-close-button'); 
        this.chatbotMessages = document.getElementById('chatbot-messages');
        this.chatbotInput = document.getElementById('chatbot-input');
        this.chatbotSendBtn = document.getElementById('chatbot-send-button');

        window.componentLog(`IVSFabController: FAB Container: ${!!this.fabContainer}, ScrollToTopBtn: ${!!this.scrollToTopBtn}, ButtonsWithSubmenu count: ${this.buttonsWithSubmenu.length}`, 'info');
        window.componentLog(`IVSFabController: ChatbotOpenBtn: ${!!this.chatbotOpenBtn}, ChatbotContainer: ${!!this.chatbotContainer}`, 'info');
    },
    
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

    populateContactOptions(element) {
        const contacts = [
            { key: "fab_call_hotline", text: "Hotline", href: "tel:+84896920547", icon: "fas fa-phone", color: "text-orange-500" },
            { key: "fab_send_email", text: "Email", href: "mailto:info@ivsacademy.edu.vn", icon: "fas fa-envelope", color: "text-red-500" },
            { key: "fab_chat_zalo", text: "Zalo", href: "https://zalo.me/ivsjsc", icon: "fas fa-comment-dots", color: "text-blue-500" },
            { key: "fab_fanpage_fb", text: "Facebook", href: "https://www.facebook.com/hr.ivsacademy/", icon: "fab fa-facebook-f", color: "text-blue-600" },
        ];
        element.innerHTML = contacts.map(c => `<a href="${c.href}" role="menuitem" class="fab-submenu-item group" data-lang-key="${c.key}" ${c.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}><i class="${c.icon} fa-fw ${c.color}"></i><span>${c.text}</span></a>`).join('');
    },

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

    bindEvents() {
        if (this.scrollToTopBtn) {
            const handleScroll = () => {
                if (this.scrollToTopBtn) { // Double check for robustness
                    if (window.scrollY > 200) {
                        this.scrollToTopBtn.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
                    } else {
                        this.scrollToTopBtn.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
                    }
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

    openSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.remove('hidden', 'pointer-events-none'); 
        // Use rAF for immediate display before transition
        requestAnimationFrame(() => {
            menu.classList.remove('opacity-0', 'scale-95', 'translate-y-2'); // Animate in
        });
        btn.setAttribute('aria-expanded', 'true');
        window.componentLog(`IVSFabController: Đã mở submenu cho nút: ${btn.id}`);
    },

    closeSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.add('opacity-0', 'scale-95', 'translate-y-2'); // Animate out
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

    // =================================================================
    //  Chatbot Functionality (Combined and optimized)
    // =================================================================
    initChatbotFunctionality() {
        if (!this.chatbotOpenBtn || !this.chatbotContainer || !this.chatbotMessages || !this.chatbotInput || !this.chatbotSendBtn || !this.chatbotCloseBtn) {
            window.componentLog("IVSFabController: Các phần tử Chatbot không tìm thấy đầy đủ. Bỏ qua chức năng chatbot.", "warn");
            return;
        }

        // Initial setup to ensure it's hidden correctly
        this.chatbotContainer.classList.add('scale-0', 'opacity-0');
        this.chatbotContainer.style.display = 'none';

        const openChatbot = () => {
            this.chatbotContainer.style.display = 'flex'; // Set display flex immediately
            setTimeout(() => {
                this.chatbotContainer.classList.remove('scale-0', 'opacity-0'); // Animate in
                this.chatbotInput.focus();
                this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight; // Scroll to bottom on open
            }, 50); // Small delay to allow display:flex to apply before transition
            window.componentLog("IVSFabController: Chatbot mở.");
        };

        const closeChatbot = () => {
            this.chatbotContainer.classList.add('scale-0', 'opacity-0'); // Animate out
            this.chatbotContainer.addEventListener('transitionend', () => {
                if (this.chatbotContainer.classList.contains('opacity-0')) {
                    this.chatbotContainer.style.display = 'none'; // Hide completely after transition
                }
            }, { once: true });
            window.componentLog("IVSFabController: Chatbot đóng.");
        };

        this.chatbotOpenBtn.addEventListener('click', openChatbot);
        this.chatbotCloseBtn.addEventListener('click', closeChatbot);
        
        const addMessage = (text, sender) => {
            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble', sender, 'mb-2', 'p-2', 'rounded-lg', 'max-w-[80%]');
            // Apply specific classes based on sender
            if (sender === 'ai') {
                messageBubble.classList.add('bg-blue-100', 'dark:bg-blue-800', 'text-gray-800', 'dark:text-gray-100');
            } else { // user
                messageBubble.classList.add('bg-green-100', 'dark:bg-green-800', 'text-gray-800', 'dark:text-gray-100', 'ml-auto'); // Align user messages right
            }
            messageBubble.textContent = text;
            this.chatbotMessages.appendChild(messageBubble);
            this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight;
        };

        const sendMessage = async () => {
            const messageText = this.chatbotInput.value.trim();
            if (messageText === '') return;

            addMessage(messageText, 'user');
            this.chatbotInput.value = '';

            // Add "Đang gõ..." message
            addMessage('Đang gõ...', 'ai');

            // Simulate AI response for UI testing without actual API call
            setTimeout(() => {
                if (this.chatbotMessages.lastChild && this.chatbotMessages.lastChild.textContent === 'Đang gõ...') {
                    this.chatbotMessages.removeChild(this.chatbotMessages.lastChild);
                }
                addMessage("Đây là phản hồi giả định từ AI. Chức năng UI vẫn hoạt động tốt.", "ai");
                window.componentLog("IVSFabController: Phản hồi AI giả định được thêm.");
            }, 1000); // Simulate network delay
        };

        this.chatbotSendBtn.addEventListener('click', sendMessage);
        this.chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        window.componentLog("IVSFabController: Chức năng Chatbot được khởi tạo (API gọi được mô phỏng cho kiểm tra UI).", "info");
    }
};

// Expose IVSFabController globally for loadComponents.js
window.IVSFabController = IVSFabController;
