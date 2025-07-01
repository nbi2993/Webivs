// FILE: /js/fab-controller.js
// VERSION: 4.3 - Fully Self-Contained & Robust Component
// DESCRIPTION: This component manages all FAB functionalities (Scroll, Share, Contact, Chatbot) independently. This is the single source of truth for FABs.

window.addEventListener('DOMContentLoaded', () => {
    const IVSFabController = {
        dom: {},
        state: {
            isChatbotOpen: false,
            chatHistory: [
                { role: "user", parts: [{ text: "You are a helpful and professional AI assistant for IVS JSC, an education, technology, and human resources company in Vietnam. Your name is IVS AI Assistant. Provide concise, strategic, and helpful answers based on the company's services (consulting, web design, training partnerships, teacher supply, R&D, digital ecosystem like IVS Apps/Games/Read/QuickTest), key projects like EOV 2025, and philosophy (Integrate, Vision, Synergy). If you don't know an answer, say so. Start the first conversation with 'Hello! I am the IVS AI Assistant. How can I help you today?'" }] },
                { role: "model", parts: [{ text: "Hello! I am the IVS AI Assistant. How can I help you today?" }] }
            ],
        },

        init() {
            this.cacheDOM();
            if (!this.dom.fabButtonsContainer) {
                console.warn("[IVS Components] FAB Container not found. FAB Controller not initialized.");
                return;
            }
            this.populateMenus();
            this.bindEvents();
            this.addWelcomeMessage();
            console.log("[IVS Components] FAB & Chatbot Controller Initialized.");
        },

        cacheDOM() {
            this.dom.fabButtonsContainer = document.getElementById('fab-buttons-container');
            this.dom.scrollToTopBtn = document.getElementById('scroll-to-top-btn');
            this.dom.buttonsWithSubmenu = this.dom.fabButtonsContainer?.querySelectorAll('button[aria-haspopup="true"]') || [];
            this.dom.chatbotOpenBtn = document.getElementById('chatbot-open-button');
            this.dom.chatbotContainer = document.getElementById('chatbot-container');
            this.dom.chatbotCloseBtn = document.getElementById('chatbot-close-button');
            this.dom.chatbotMessages = document.getElementById('chatbot-messages');
            this.dom.chatbotInput = document.getElementById('chatbot-input');
            this.dom.chatbotSendBtn = document.getElementById('chatbot-send-button');
        },
        
        populateMenus() {
            const contactMenu = document.getElementById('contact-options');
            const shareMenu = document.getElementById('share-options');
            if (contactMenu) this.populateContactOptions(contactMenu);
            if (shareMenu) this.populateShareOptions(shareMenu);
        },

        populateContactOptions(element) {
            const contacts = [
                { text: "Hotline", href: "tel:+84896920547", icon: "fas fa-phone", color: "text-orange-500" },
                { text: "Email", href: "mailto:info@ivsacademy.edu.vn", icon: "fas fa-envelope", color: "text-red-500" },
                { text: "Zalo", href: "https://zalo.me/ivsjsc", icon: "fas fa-comment-dots", color: "text-blue-500" },
            ];
            element.innerHTML = contacts.map(c => `<a href="${c.href}" role="menuitem" class="fab-submenu-item" ${c.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}><i class="${c.icon} ${c.color}"></i><span>${c.text}</span></a>`).join('');
        },

        populateShareOptions(element) {
            const currentUrl = window.location.href;
            const shares = [
                { text: "Facebook", icon: "fab fa-facebook-f", color: "text-blue-600", action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank', 'noopener,noreferrer') },
                { text: "Copy Link", icon: "fas fa-link", color: "text-gray-500", action: (btn) => {
                    navigator.clipboard.writeText(currentUrl).then(() => {
                        const originalContent = btn.innerHTML;
                        btn.innerHTML = `<i class="fas fa-check text-green-500"></i><span>Copied!</span>`;
                        setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
                    }).catch(err => console.error('Failed to copy: ', err));
                }}
            ];
            element.innerHTML = shares.map(s => `<button role="menuitem" class="fab-submenu-item w-full"><i class="${s.icon} ${s.color}"></i><span>${s.text}</span></button>`).join('');
            element.querySelectorAll('button').forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    shares[index].action(btn);
                });
            });
        },

        bindEvents() {
            if (this.dom.scrollToTopBtn) {
                window.addEventListener('scroll', () => {
                    this.dom.scrollToTopBtn.classList.toggle('opacity-0', window.scrollY < 200);
                    this.dom.scrollToTopBtn.classList.toggle('pointer-events-none', window.scrollY < 200);
                }, { passive: true });
                this.dom.scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            }

            this.dom.buttonsWithSubmenu.forEach(btn => btn.addEventListener('click', e => {
                e.stopPropagation();
                const menuId = btn.getAttribute('aria-controls');
                if (!menuId) {
                    console.warn(`[IVS FAB] Button missing aria-controls attribute:`, btn);
                    return;
                }
                const menu = document.getElementById(menuId);
                if (!menu) {
                    console.error(`[IVS FAB] Submenu element not found for ID: ${menuId}`);
                    return;
                }
                const isOpening = !menu.classList.contains('active');
                this.closeAllSubmenus();
                if (isOpening) menu.classList.add('active');
            }));

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#fab-buttons-container')) {
                    this.closeAllSubmenus();
                }
            });

            if (this.dom.chatbotOpenBtn) this.dom.chatbotOpenBtn.addEventListener('click', () => this.toggleChatbot(true));
            if (this.dom.chatbotCloseBtn) this.dom.chatbotCloseBtn.addEventListener('click', () => this.toggleChatbot(false));
            if (this.dom.chatbotSendBtn) this.dom.chatbotSendBtn.addEventListener('click', () => this.handleSendMessage());
            if (this.dom.chatbotInput) this.dom.chatbotInput.addEventListener('keypress', e => e.key === 'Enter' && this.handleSendMessage());
        },

        closeAllSubmenus() {
            if (this.dom.fabButtonsContainer) { 
                this.dom.fabButtonsContainer.querySelectorAll('.fab-submenu-panel').forEach(m => m.classList.remove('active'));
            }
        },

        toggleChatbot(forceOpen) {
            if (!this.dom.chatbotContainer) return;

            const open = typeof forceOpen === 'boolean' ? forceOpen : !this.state.isChatbotOpen;
            this.state.isChatbotOpen = open;
            if (open) {
                this.dom.chatbotContainer.style.display = 'flex';
                requestAnimationFrame(() => {
                    this.dom.chatbotContainer.classList.remove('scale-0', 'opacity-0');
                    if (this.dom.chatbotInput) this.dom.chatbotInput.focus();
                });
            } else {
                this.dom.chatbotContainer.classList.add('scale-0', 'opacity-0');
                setTimeout(() => { this.dom.chatbotContainer.style.display = 'none'; }, 300);
            }
        },

        addMessage(text, sender, isTyping = false) {
            if (!this.dom.chatbotMessages) return;

            const messageWrapper = document.createElement('div');
            messageWrapper.className = `w-full flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
            const messageBubble = document.createElement('div');
            messageBubble.className = `max-w-[85%] rounded-2xl px-4 py-2 mb-2 text-white ${sender === 'user' ? 'bg-ivs-blue' : 'bg-ivs-border'}`;
            if (isTyping) {
                messageBubble.id = 'typing-indicator';
                messageBubble.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
            } else {
                messageBubble.textContent = text;
            }
            messageWrapper.appendChild(messageBubble);
            this.dom.chatbotMessages.appendChild(messageWrapper);
            this.dom.chatbotMessages.scrollTop = this.dom.chatbotMessages.scrollHeight;
        },

        removeTypingIndicator() {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.parentElement.remove();
        },

        addWelcomeMessage() {
            // Tin nhắn chào mừng đã có trong chatHistory mặc định và sẽ được hiển thị khi chatbot mở.
            // Không cần thêm lại DOM ở đây để tránh trùng lặp.
        },

        setLoading(isLoading) {
            if (this.dom.chatbotSendBtn) {
                this.dom.chatbotSendBtn.disabled = isLoading;
                this.dom.chatbotSendBtn.innerHTML = isLoading ? '<i class="fas fa-spinner fa-spin"></i>' : '<i class="fas fa-paper-plane"></i>';
            }
        },

        async handleSendMessage() {
            const message = this.dom.chatbotInput?.value.trim();
            if (!message) return;

            this.addMessage(message, 'user');
            if (this.dom.chatbotInput) this.dom.chatbotInput.value = '';
            this.setLoading(true);
            this.addMessage('', 'model', true);

            try {
                const backendUrl = 'https://asia-southeast1-ivsjsc-6362f.cloudfunctions.net/api/chat'; 

                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        history: this.state.chatHistory,
                        message: message,
                    }),
                });

                this.removeTypingIndicator();
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const data = await response.json();
                if (data.success && data.response) {
                    const aiResponseText = data.response;
                    this.addMessage(aiResponseText, 'model');
                    this.state.chatHistory.push({ role: "user", parts: [{ text: message }] });
                    this.state.chatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });
                } else {
                    throw new Error(data.error || "Invalid response from server.");
                }

            } catch (error) {
                this.removeTypingIndicator();
                console.error("Error calling backend:", error);
                this.addMessage("Xin lỗi, tôi đang gặp vấn đề kết nối. Vui lòng thử lại sau.", 'model');
            } finally {
                this.setLoading(false);
            }
        }
    };

    // Khởi tạo controller sau khi DOM đã được tải
    IVSFabController.init();

    // Giữ biến này ở global scope nếu cần truy cập từ các script khác
    window.IVSFabController = IVSFabController;
});