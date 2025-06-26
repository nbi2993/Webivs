'use strict';

// --- PHẦN 1: KHỞI TẠO FIREBASE (ĐÃ TÍCH HỢP) ---
// Import các hàm cần thiết từ Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

// Cấu hình Firebase cho ứng dụng web của bạn
const firebaseConfig = {
  apiKey: "AIzaSyD1Hi7-EnAN_--THeRY958fVaPWZbQNZzs",
  authDomain: "ivsjsc-6362f.firebaseapp.com",
  databaseURL: "https://ivsjsc-6362f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ivsjsc-6362f",
  storageBucket: "ivsjsc-6362f.appspot.com",
  messagingSenderId: "910278613224",
  appId: "1:910278613224:web:16b3f0faf041ac5703115d",
  measurementId: "G-SEP5LC4EMB"
};

// Khởi tạo Firebase
try {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    console.log('[Firebase] Initialization successful.');
} catch (error) {
    console.error('[Firebase] Initialization error:', error);
}


// --- PHẦN 2: LOGIC GIAO DIỆN HIỆN CÓ ---

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



// --- MODULE LOGIC CHO CHATBOT ---
const IVSChatbot = {
    chatContainer: null,
    chatForm: null,
    chatInput: null,
    sendButton: null,
    isWaitingForResponse: false,
    init() {
        console.log('[IVSChatbot] Initializing...');
        this.chatContainer = document.getElementById('chat-messages');
        this.chatForm = document.getElementById('chatbot-form');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');

        if (!this.chatForm || !this.chatInput || !this.chatContainer) {
            console.warn('[IVSChatbot] Could not find all required chat elements. Chatbot functionality disabled.');
            return;
        }
        
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
        
        console.log('[IVSChatbot] Chatbot has been initialized.');
    },
    handleSendMessage() {
        if (this.isWaitingForResponse) return;
        
        const userMessage = this.chatInput.value.trim();
        if (userMessage === '') return;

        this.addMessageToUI(userMessage, 'user');
        this.chatInput.value = '';
        
        this.showTypingIndicator(true);
        this.sendMessageToServer(userMessage);
    },
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
            this.addMessageToUI(data.message, 'bot');
        } catch (error) {
            console.error('[IVSChatbot] Error sending message:', error);
            this.addMessageToUI('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.', 'bot', true);
        } finally {
            this.showTypingIndicator(false);
            this.isWaitingForResponse = false;
        }
    },
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
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    },
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

// --- PHẦN 3: KHỞI TẠO TOÀN BỘ LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
  
    const fabContainer = document.getElementById('fab-container');
    const fabToggle = document.getElementById('fab-toggle');
    if (fabContainer && fabToggle) {
        fabToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            fabContainer.classList.toggle('open');
        });
    }

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

    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    IVSChatbot.init();
    console.log('[IVS Script] All components initialized.');
});
