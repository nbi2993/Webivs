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


// --- PHẦN 2: LOGIC GIAO DIỆN CŨ (ĐÃ DỌN DẸP) ---
// debounce function is now exposed globally by loadComponents.js
// IVSChatbot module is now entirely moved to public/js/fabController.js


// --- PHẦN 3: KHỞI TẠO TOÀN BỘ LOGIC (ĐÃ DỌN DẸP) ---
document.addEventListener('DOMContentLoaded', () => {
  
    // All FAB and Header/Menu related logic is now handled by loadComponents.js
    // and its respective controllers (IVSFabController, IVSHeaderController).
    // The following lines are intentionally commented out/removed to avoid conflicts.

    // const fabContainer = document.getElementById('fab-container');
    // const fabToggle = document.getElementById('fab-toggle');
    // if (fabContainer && fabToggle) { /* ... */ }

    // const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    // if (scrollToTopBtn) { /* ... */ }
    
    // IVSChatbot.init(); 

    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    console.log('[IVS Script] Basic standalone scripts executed. Core UI handled by loadComponents.js.');
});
