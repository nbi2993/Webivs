/*
 * File: public/js/fabController.js
 * Chức năng: Điều khiển toàn bộ logic của Chatbot FAB phía người dùng.
 * Cập nhật: Thay đổi hàm sendMessage để gọi đến backend Firebase Functions thay vì API Google.
 */
class IVSFabController {
    constructor() {
        this.fabContainer = document.getElementById('fab-container');
        if (!this.fabContainer) return;

        this.init();
    }

    init() {
        this.isChatboxOpen = false;
        this.history = [];

        this.fabContainer.innerHTML = this.render();
        
        this.fabButton = document.getElementById('fab-button');
        this.chatbox = document.getElementById('chatbot-container');
        this.closeButton = document.getElementById('close-chatbot');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');
        this.chatMessages = document.getElementById('chat-messages');

        this.bindEvents();
        this.addWelcomeMessage();
    }

    render() {
        return `
            <div id="chatbot-container" class="hidden fixed bottom-24 right-6 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-ivs-card border border-ivs-border rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 opacity-0 -translate-y-4">
                <header class="flex items-center justify-between p-4 border-b border-ivs-border">
                    <div class="flex items-center">
                        <img src="/images/logo/logo-192.png" alt="IVS Bot" class="w-10 h-10 rounded-full mr-3">
                        <div>
                            <h3 class="font-bold text-white">IVS AI Assistant</h3>
                            <p class="text-xs text-ivs-green">● Online</p>
                        </div>
                    </div>
                    <button id="close-chatbot" class="text-ivs-text-secondary hover:text-white">&times;</button>
                </header>
                <div id="chat-messages" class="flex-1 p-4 overflow-y-auto"></div>
                <footer class="p-4 border-t border-ivs-border">
                    <div class="flex items-center bg-ivs-bg rounded-lg">
                        <input type="text" id="chat-input" placeholder="Type your message..." class="flex-1 bg-transparent px-4 py-2 text-white focus:outline-none">
                        <button id="send-button" class="p-3 text-ivs-blue hover:text-white transition-colors">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </footer>
            </div>
            <button id="fab-button" class="fixed bottom-6 right-6 bg-ivs-blue-darker w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transform hover:scale-110 transition-transform">
                <i class="fas fa-robot"></i>
            </button>
        `;
    }

    bindEvents() {
        this.fabButton.addEventListener('click', () => this.toggleChatbox());
        this.closeButton.addEventListener('click', () => this.toggleChatbox());
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });
    }

    toggleChatbox() {
        this.isChatboxOpen = !this.isChatboxOpen;
        if (this.isChatboxOpen) {
            this.chatbox.classList.remove('hidden');
            setTimeout(() => {
                this.chatbox.classList.remove('opacity-0', '-translate-y-4');
                this.chatInput.focus();
            }, 10);
        } else {
            this.chatbox.classList.add('opacity-0', '-translate-y-4');
            setTimeout(() => {
                this.chatbox.classList.add('hidden');
            }, 300);
        }
    }
    
    addMessage(sender, text) {
        const messageClass = sender === 'user' ? 'bg-ivs-blue self-end' : 'bg-ivs-border self-start';
        const messageElement = document.createElement('div');
        messageElement.className = `max-w-xs md:max-w-sm rounded-lg px-4 py-2 mb-2 text-white ${messageClass}`;
        messageElement.textContent = text;
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        if (sender === 'user') {
            this.history.push({ role: "user", parts: [{ text }] });
        } else {
            this.history.push({ role: "model", parts: [{ text }] });
        }
    }

    addWelcomeMessage() {
        const welcomeText = "Hello! I'm the IVS AI Assistant. How can I help you today?";
        this.addMessage('model', welcomeText);
    }

    setLoading(isLoading) {
        this.sendButton.disabled = isLoading;
        if (isLoading) {
            this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }

    async handleSendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.chatInput.value = '';
        this.setLoading(true);

        try {
            // *** ĐIỂM THAY ĐỔI QUAN TRỌNG ***
            // Thay vì gọi trực tiếp API của Google, chúng ta gọi đến backend của mình.
            // URL này cần được thay đổi thành URL thực tế sau khi deploy Firebase Function.
            const backendUrl = '[https://asia-southeast1-ivs-PROJECT-ID.cloudfunctions.net/api/chat](https://asia-southeast1-ivs-PROJECT-ID.cloudfunctions.net/api/chat)'; // THAY PROJECT-ID CỦA BẠN VÀO ĐÂY

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    history: this.history.slice(0, -1), // Gửi lịch sử trò chuyện (trừ tin nhắn cuối cùng của user)
                    message: message,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.addMessage('model', data.response);

        } catch (error) {
            console.error("Error calling backend:", error);
            this.addMessage('model', "Sorry, I'm having trouble connecting. Please try again later.");
        } finally {
            this.setLoading(false);
        }
    }
}

// Khởi tạo controller khi trang đã tải xong
document.addEventListener('DOMContentLoaded', () => {
    // Chờ một chút để đảm bảo các component khác đã tải xong
    setTimeout(() => {
        new IVSFabController();
    }, 500);
});
