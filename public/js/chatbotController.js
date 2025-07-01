/**
 * @fileoverview IVSChatbotController - Manages all chatbot UI, logic, and API interactions independently.
 * This script handles displaying messages, sending user input, and interacting with the Gemini API.
 * It relies on global utility functions from utils.js.
 * @version 1.1 - Cleaned up, removed duplicated utilities, relies on utils.js and fabController.js for opening/closing.
 * @author IVS-Technical-Team
 */

'use strict';

// Ensure global utilities are available (componentLog)
// These are expected to be loaded via public/js/utils.js
if (typeof window.componentLog !== 'function') {
    console.error("[IVSChatbotController] window.componentLog is not defined. Please ensure utils.js is loaded before chatbotController.js.");
    window.componentLog = (msg, level = 'error') => console[level](msg); // Fallback
}

const IVSChatbotController = {
    dom: {}, // Đối tượng để lưu trữ các phần tử DOM
    state: {
        isChatbotOpen: false,
        // Lịch sử trò chuyện ban đầu, bao gồm prompt hệ thống và tin nhắn chào mừng từ AI.
        chatHistory: [
            { role: "user", parts: [{ text: "You are a helpful and professional AI assistant for IVS JSC, an education, technology, and human resources company in Vietnam. Your name is IVS AI Assistant. Provide concise, strategic, and helpful answers based on the company's services (consulting, web design, training partnerships, teacher supply, R&D, digital ecosystem like IVS Apps/Games/Read/QuickTest), key projects like EOV 2025, and philosophy (Integrate, Vision, Synergy). If you don't know an answer, say so. Start the first conversation with 'Hello! I am the IVS AI Assistant. How can I help you today?'" }] },
            { role: "model", parts: [{ text: "Hello! I am the IVS AI Assistant. How can I help you today?" }] }
        ],
        isGeneratingResponse: false, // Cờ để ngăn nhiều yêu cầu đồng thời
    },

    /**
     * Initializes the Chatbot controller.
     * Caches DOM elements, binds event listeners, and adds the initial welcome message.
     */
    init() {
        window.componentLog("[IVSChatbotController] Bắt đầu khởi tạo.", "info");
        this.cacheDOM(); // Cache các phần tử DOM cần thiết cho chatbot
        if (!this.dom.chatbotContainer) {
            window.componentLog("[IVSChatbotController] Không tìm thấy vùng chứa Chatbot. Bộ điều khiển Chatbot không được khởi tạo.", "warn");
            return;
        }
        this.bindEvents(); // Gắn các sự kiện lắng nghe cho chatbot
        this.addWelcomeMessage(); // Thêm tin nhắn chào mừng ban đầu vào giao diện
        window.componentLog("[IVSChatbotController] Bộ điều khiển Chatbot đã được khởi tạo.", "info");
    },

    /**
     * Caches necessary DOM elements for the chatbot.
     */
    cacheDOM() {
        this.dom.chatbotContainer = document.getElementById('chatbot-container');
        this.dom.chatbotCloseBtn = document.getElementById('chatbot-close-button');
        this.dom.chatbotMessages = document.getElementById('chatbot-messages');
        this.dom.chatbotInput = document.getElementById('chatbot-input');
        this.dom.chatbotSendBtn = document.getElementById('chatbot-send-button');
        this.dom.chatbotOpenBtn = document.getElementById('chatbot-open-button'); // Nút mở chatbot (từ FAB)

        window.componentLog(`[IVSChatbotController] ChatbotContainer: ${!!this.dom.chatbotContainer}, ChatbotOpenBtn: ${!!this.dom.chatbotOpenBtn}`, 'info');
    },

    /**
     * Binds event listeners for chatbot interactions.
     */
    bindEvents() {
        // Gắn sự kiện cho các nút và ô nhập liệu của chatbot
        if (this.dom.chatbotOpenBtn) this.dom.chatbotOpenBtn.addEventListener('click', () => this.toggleChatbot(true));
        if (this.dom.chatbotCloseBtn) this.dom.chatbotCloseBtn.addEventListener('click', () => this.toggleChatbot(false));
        if (this.dom.chatbotSendBtn) this.dom.chatbotSendBtn.addEventListener('click', () => this.handleSendMessage());
        if (this.dom.chatbotInput) this.dom.chatbotInput.addEventListener('keypress', e => e.key === 'Enter' && this.handleSendMessage());

        window.componentLog("[IVSChatbotController] Đã gắn kết sự kiện.", "info");
    },

    /**
     * Toggles the visibility of the chatbot container.
     * @param {boolean} forceOpen If true, forces the chatbot to open; if false, forces it to close.
     */
    toggleChatbot(forceOpen) {
        if (!this.dom.chatbotContainer) return;

        const open = typeof forceOpen === 'boolean' ? forceOpen : !this.state.isChatbotOpen;
        this.state.isChatbotOpen = open;

        if (open) {
            this.dom.chatbotContainer.style.display = 'flex'; // Hiển thị container
            requestAnimationFrame(() => {
                this.dom.chatbotContainer.classList.remove('scale-0', 'opacity-0'); // Bỏ các lớp ẩn để hiển thị với hiệu ứng
                if (this.dom.chatbotInput) this.dom.chatbotInput.focus(); // Tập trung vào ô nhập liệu
                this.dom.chatbotMessages.scrollTop = this.dom.chatbotMessages.scrollHeight; // Cuộn xuống cuối tin nhắn
            });
            window.componentLog("[IVSChatbotController] Chatbot mở.");
        } else {
            this.dom.chatbotContainer.classList.add('scale-0', 'opacity-0'); // Thêm các lớp ẩn để đóng với hiệu ứng
            setTimeout(() => { this.dom.chatbotContainer.style.display = 'none'; }, 300); // Ẩn hoàn toàn sau khi hiệu ứng kết thúc
            window.componentLog("[IVSChatbotController] Chatbot đóng.");
        }
    },

    /**
     * Adds a message bubble to the chatbot display.
     * @param {string} text The text content of the message.
     * @param {'user' | 'model'} sender The sender of the message ('user' or 'model').
     * @param {boolean} [isTyping=false] If true, displays a typing indicator instead of text.
     */
    addMessage(text, sender, isTyping = false) {
        if (!this.dom.chatbotMessages) return;

        const messageWrapper = document.createElement('div');
        messageWrapper.className = `w-full flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
        const messageBubble = document.createElement('div');
        messageBubble.className = `max-w-[85%] rounded-2xl px-4 py-2 mb-2 text-white ${sender === 'user' ? 'bg-ivs-blue' : 'bg-ivs-border'}`;

        if (isTyping) {
            messageBubble.id = 'typing-indicator'; // Đặt ID cho chỉ báo đang gõ
            messageBubble.innerHTML = `
                <div class="flex items-center space-x-1">
                    <span class="dot-typing bg-gray-600 dark:bg-gray-300 w-2 h-2 rounded-full inline-block animate-bounce" style="animation-delay: -0.32s;"></span>
                    <span class="dot-typing bg-gray-600 dark:bg-gray-300 w-2 h-2 rounded-full inline-block animate-bounce" style="animation-delay: -0.16s;"></span>
                    <span class="dot-typing bg-gray-600 dark:bg-gray-300 w-2 h-2 rounded-full inline-block animate-bounce"></span>
                </div>
            `;
            // Add a simple CSS for dot-typing if not already in styles.css
            const style = document.createElement('style');
            style.textContent = `
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-5px); }
                }
                .dot-typing {
                    animation: bounce 0.6s infinite ease-in-out;
                }
            `;
            document.head.appendChild(style);
        } else {
            messageBubble.textContent = text; // Đặt nội dung tin nhắn
        }
        messageWrapper.appendChild(messageBubble);
        this.dom.chatbotMessages.appendChild(messageWrapper);
        this.dom.chatbotMessages.scrollTop = this.dom.chatbotMessages.scrollHeight; // Cuộn xuống cuối tin nhắn
    },

    /**
     * Removes the typing indicator from the chatbot display.
     */
    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.parentElement.remove(); // Xóa chỉ báo đang gõ
    },

    /**
     * Adds the initial welcome message to the chatbot display based on chatHistory.
     */
    addWelcomeMessage() {
        // Tin nhắn chào mừng đã có trong chatHistory mặc định và sẽ được hiển thị khi chatbot mở.
        // Không cần thêm lại DOM ở đây để tránh trùng lặp.
        // Chỉ thêm tin nhắn chào mừng nếu chưa có trong DOM
        if (this.dom.chatbotMessages.children.length === 0 && this.state.chatHistory.length > 1) {
            this.addMessage(this.state.chatHistory[1].parts[0].text, 'model');
        }
    },

    /**
     * Sets the loading state for the chatbot input and send button.
     * @param {boolean} isLoading If true, disables input/send and shows a spinner.
     */
    setLoading(isLoading) {
        if (this.dom.chatbotSendBtn) {
            this.dom.chatbotSendBtn.disabled = isLoading; // Vô hiệu hóa nút gửi khi đang tải
            this.dom.chatbotSendBtn.innerHTML = isLoading ? '<i class="fas fa-spinner fa-spin"></i>' : '<i class="fas fa-paper-plane"></i>'; // Thay đổi biểu tượng nút
        }
        if (this.dom.chatbotInput) {
            this.dom.chatbotInput.disabled = isLoading; // Vô hiệu hóa ô nhập liệu
        }
    },

    /**
     * Handles sending a message: adds user message, calls AI, and displays AI response.
     */
    async handleSendMessage() {
        const message = this.dom.chatbotInput?.value.trim();
        if (!message || this.state.isGeneratingResponse) return; // Không gửi tin nhắn trống hoặc khi đang tạo phản hồi

        this.state.isGeneratingResponse = true; // Đặt cờ đang tạo phản hồi
        this.addMessage(message, 'user'); // Thêm tin nhắn người dùng vào giao diện
        if (this.dom.chatbotInput) this.dom.chatbotInput.value = ''; // Xóa nội dung ô nhập liệu
        this.setLoading(true); // Đặt trạng thái loading
        this.addMessage('', 'model', true); // Thêm chỉ báo đang gõ của AI

        try {
            // Đây là URL của Cloud Function (hoặc backend API) mà bạn cần triển khai.
            // Đảm bảo URL này là chính xác sau khi bạn deploy backend của mình.
            const backendUrl = 'https://asia-southeast1-ivsjsc-6362f.cloudfunctions.net/api/chat';

            const payload = {
                contents: [...this.state.chatHistory, { role: "user", parts: [{ text: message }] }] // Gửi toàn bộ lịch sử + tin nhắn mới
            };
            const apiKey = ""; // Canvas sẽ cung cấp khóa này trong thời gian chạy

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            this.removeTypingIndicator(); // Xóa chỉ báo đang gõ sau khi nhận phản hồi
            if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`); // Xử lý lỗi HTTP

            const data = await response.json();
            if (data.success && data.response) {
                const aiResponseText = data.response;
                this.addMessage(aiResponseText, 'model'); // Thêm phản hồi của AI vào giao diện
                this.state.chatHistory.push({ role: "user", parts: [{ text: message }] }); // Cập nhật lịch sử trò chuyện
                this.state.chatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });
                window.componentLog("[IVSChatbotController] Phản hồi AI được thêm.", "info");
            } else {
                throw new Error(data.error || "Phản hồi không hợp lệ từ máy chủ."); // Xử lý lỗi từ dữ liệu phản hồi
            }

        } catch (error) {
            this.removeTypingIndicator(); // Xóa chỉ báo đang gõ nếu có lỗi
            window.componentLog(`[IVSChatbotController] Lỗi khi gọi backend: ${error.message}`, "error");
            this.addMessage("Xin lỗi, tôi đang gặp vấn đề kết nối. Vui lòng thử lại sau.", 'model'); // Thông báo lỗi cho người dùng
        } finally {
            this.setLoading(false); // Tắt trạng thái loading
            this.state.isGeneratingResponse = false; // Đặt lại cờ
            if (this.dom.chatbotInput) this.dom.chatbotInput.focus(); // Tập trung vào ô nhập liệu cho tin nhắn tiếp theo
        }
    }
};

// Expose IVSChatbotController globally for loadComponents.js to initialize
window.IVSChatbotController = IVSChatbotController;
