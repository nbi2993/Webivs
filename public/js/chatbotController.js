// FILE: /js/chatbotController.js
// VERSION: 1.0 - Dedicated Chatbot Controller
// DESCRIPTION: Manages all chatbot UI, logic, and API interactions independently.

window.addEventListener('DOMContentLoaded', () => {
    const IVSChatbotController = {
        dom: {},
        state: {
            isChatbotOpen: false,
            // Lịch sử trò chuyện ban đầu, bao gồm prompt hệ thống và tin nhắn chào mừng từ AI.
            chatHistory: [
                { role: "user", parts: [{ text: "You are a helpful and professional AI assistant for IVS JSC, an education, technology, and human resources company in Vietnam. Your name is IVS AI Assistant. Provide concise, strategic, and helpful answers based on the company's services (consulting, web design, training partnerships, teacher supply, R&D, digital ecosystem like IVS Apps/Games/Read/QuickTest), key projects like EOV 2025, and philosophy (Integrate, Vision, Synergy). If you don't know an answer, say so. Start the first conversation with 'Hello! I am the IVS AI Assistant. How can I help you today?'" }] },
                { role: "model", parts: [{ text: "Hello! I am the IVS AI Assistant. How can I help you today?" }] }
            ],
        },

        init() {
            this.cacheDOM(); // Cache các phần tử DOM cần thiết cho chatbot
            if (!this.dom.chatbotContainer) {
                console.warn("[IVS Chatbot] Không tìm thấy vùng chứa Chatbot. Bộ điều khiển Chatbot không được khởi tạo.");
                return;
            }
            this.bindEvents(); // Gắn các sự kiện lắng nghe cho chatbot
            this.addWelcomeMessage(); // Thêm tin nhắn chào mừng ban đầu vào giao diện
            console.log("[IVS Components] Bộ điều khiển Chatbot đã được khởi tạo.");
        },

        cacheDOM() {
            this.dom.chatbotContainer = document.getElementById('chatbot-container');
            this.dom.chatbotCloseBtn = document.getElementById('chatbot-close-button');
            this.dom.chatbotMessages = document.getElementById('chatbot-messages');
            this.dom.chatbotInput = document.getElementById('chatbot-input');
            this.dom.chatbotSendBtn = document.getElementById('chatbot-send-button');
        },

        bindEvents() {
            // Gắn sự kiện cho các nút và ô nhập liệu của chatbot
            if (this.dom.chatbotCloseBtn) this.dom.chatbotCloseBtn.addEventListener('click', () => this.toggleChatbot(false));
            if (this.dom.chatbotSendBtn) this.dom.chatbotSendBtn.addEventListener('click', () => this.handleSendMessage());
            if (this.dom.chatbotInput) this.dom.chatbotInput.addEventListener('keypress', e => e.key === 'Enter' && this.handleSendMessage());
        },

        toggleChatbot(forceOpen) {
            if (!this.dom.chatbotContainer) return; // Đảm bảo container chatbot tồn tại

            const open = typeof forceOpen === 'boolean' ? forceOpen : !this.state.isChatbotOpen;
            this.state.isChatbotOpen = open;
            if (open) {
                this.dom.chatbotContainer.style.display = 'flex'; // Hiển thị container
                requestAnimationFrame(() => {
                    this.dom.chatbotContainer.classList.remove('scale-0', 'opacity-0'); // Bỏ các lớp ẩn để hiển thị với hiệu ứng
                    if (this.dom.chatbotInput) this.dom.chatbotInput.focus(); // Tập trung vào ô nhập liệu
                });
            } else {
                this.dom.chatbotContainer.classList.add('scale-0', 'opacity-0'); // Thêm các lớp ẩn để đóng với hiệu ứng
                setTimeout(() => { this.dom.chatbotContainer.style.display = 'none'; }, 300); // Ẩn hoàn toàn sau khi hiệu ứng kết thúc
            }
        },

        addMessage(text, sender, isTyping = false) {
            if (!this.dom.chatbotMessages) return; // Đảm bảo messages container tồn tại

            const messageWrapper = document.createElement('div');
            messageWrapper.className = `w-full flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
            const messageBubble = document.createElement('div');
            messageBubble.className = `max-w-[85%] rounded-2xl px-4 py-2 mb-2 text-white ${sender === 'user' ? 'bg-ivs-blue' : 'bg-ivs-border'}`;
            if (isTyping) {
                messageBubble.id = 'typing-indicator'; // Đặt ID cho chỉ báo đang gõ
                messageBubble.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
            } else {
                messageBubble.textContent = text; // Đặt nội dung tin nhắn
            }
            messageWrapper.appendChild(messageBubble);
            this.dom.chatbotMessages.appendChild(messageWrapper);
            this.dom.chatbotMessages.scrollTop = this.dom.chatbotMessages.scrollHeight; // Cuộn xuống cuối tin nhắn
        },

        removeTypingIndicator() {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.parentElement.remove(); // Xóa chỉ báo đang gõ
        },

        addWelcomeMessage() {
            // Tin nhắn chào mừng đã có trong chatHistory mặc định và sẽ được hiển thị khi chatbot mở.
            // Không cần thêm lại DOM ở đây để tránh trùng lặp.
        },

        setLoading(isLoading) {
            if (this.dom.chatbotSendBtn) {
                this.dom.chatbotSendBtn.disabled = isLoading; // Vô hiệu hóa nút gửi khi đang tải
                this.dom.chatbotSendBtn.innerHTML = isLoading ? '<i class="fas fa-spinner fa-spin"></i>' : '<i class="fas fa-paper-plane"></i>'; // Thay đổi biểu tượng nút
            }
        },

        async handleSendMessage() {
            const message = this.dom.chatbotInput?.value.trim();
            if (!message) return; // Không gửi tin nhắn trống

            this.addMessage(message, 'user'); // Thêm tin nhắn người dùng vào giao diện
            if (this.dom.chatbotInput) this.dom.chatbotInput.value = ''; // Xóa nội dung ô nhập liệu
            this.setLoading(true); // Đặt trạng thái loading
            this.addMessage('', 'model', true); // Thêm chỉ báo đang gõ của AI

            try {
                // Đây là URL của Cloud Function (hoặc backend API) mà bạn cần triển khai.
                // Đảm bảo URL này là chính xác sau khi bạn deploy backend của mình.
                const backendUrl = 'https://asia-southeast1-ivsjsc-6362f.cloudfunctions.net/api/chat'; 

                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        history: this.state.chatHistory, // Gửi toàn bộ lịch sử trò chuyện để AI có ngữ cảnh
                        message: message, // Gửi tin nhắn mới của người dùng
                    }),
                });

                this.removeTypingIndicator(); // Xóa chỉ báo đang gõ sau khi nhận phản hồi
                if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`); // Xử lý lỗi HTTP

                const data = await response.json();
                if (data.success && data.response) {
                    const aiResponseText = data.response;
                    this.addMessage(aiResponseText, 'model'); // Thêm phản hồi của AI vào giao diện
                    this.state.chatHistory.push({ role: "user", parts: [{ text: message }] }); // Cập nhật lịch sử trò chuyện
                    this.state.chatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });
                } else {
                    throw new Error(data.error || "Phản hồi không hợp lệ từ máy chủ."); // Xử lý lỗi từ dữ liệu phản hồi
                }

            } catch (error) {
                this.removeTypingIndicator(); // Xóa chỉ báo đang gõ nếu có lỗi
                console.error("Lỗi khi gọi backend:", error);
                this.addMessage("Xin lỗi, tôi đang gặp vấn đề kết nối. Vui lòng thử lại sau.", 'model'); // Thông báo lỗi cho người dùng
            } finally {
                this.setLoading(false); // Tắt trạng thái loading
            }
        }
    };

    // Khởi tạo controller sau khi DOM đã được tải hoàn toàn
    IVSChatbotController.init();

    // Đặt biến controller vào window scope để có thể truy cập từ các script khác
    window.IVSChatbotController = IVSChatbotController;
});
