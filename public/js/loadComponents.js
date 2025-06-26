/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, including Firebase. It now relies on
 * language.js for language system initialization.
 * @version 6.2 - Removed language system initialization, now relies on external language.js.
 * @author IVS-Technical-Team
 */

'use strict';

// =================================================================
// GLOBAL LOGGING & UTILITIES (Centralized and unique global definitions)
// =================================================================
/**
 * Ghi log các thông báo liên quan đến tải component và hệ thống.
 * @param {string} message Thông điệp cần ghi log.
 * @param {'info'|'warn'|'error'} [level='info'] Mức độ log (info, warn, error).
 */
function componentLog(message, level = 'info') {
    console[level](`[IVS Core] ${message}`);
}
// Expose componentLog globally
window.componentLog = componentLog;

/**
 * Hàm debounce để hạn chế tần suất gọi hàm.
 * @param {Function} func Hàm cần debounce.
 * @param {number} wait Thời gian chờ trước khi thực thi hàm.
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
// Expose debounce globally
window.debounce = debounce;


// =================================================================
// FIREBASE INITIALIZATION (From script.js)
// NOTE: For a real-world scenario, Firebase config should ideally be loaded
// from environment variables or a secure configuration service, not hardcoded.
// The current hardcoded config is preserved as it was in the provided files.
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

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

try {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app); // eslint-disable-line no-unused-vars
    componentLog('[Firebase] Initialization successful.');
} catch (error) {
    componentLog('[Firebase] Initialization error: ' + error.message, 'error');
}


// =================================================================
// MAIN COMPONENT LOADER (Existing functionality with increased delays)
// =================================================================

/**
 * Loads an HTML component and injects it into a placeholder,
 * ensuring that any <script> tags within the injected HTML are executed.
 * @param {string} url The URL of the HTML component to load.
 * @param {string} placeholderId The ID of the element to inject the component into.
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
 */
async function loadAndInject(url, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        componentLog(`[Loader] Placeholder '${placeholderId}' không tìm thấy. Không thể tải ${url}.`, "error");
        return false;
    }
    componentLog(`[Loader] Bắt đầu tải và chèn '${url}' vào '${placeholderId}'.`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP ${response.status} khi tải ${url}`);
        }

        const text = await response.text();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        const scripts = Array.from(tempDiv.querySelectorAll('script'));

        // Remove script tags from the temporary div before injecting HTML
        scripts.forEach(script => script.parentNode?.removeChild(script));

        placeholder.innerHTML = tempDiv.innerHTML; // Inject HTML content
        componentLog(`[Loader] Nội dung HTML của '${url}' đã chèn vào '${placeholderId}'.`);

        // Re-add and execute script tags
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));

            if (oldScript.src) {
                newScript.src = oldScript.src;
                await new Promise((resolve, reject) => {
                    newScript.onload = () => {
                        componentLog(`[Loader] Script bên ngoài đã tải: ${newScript.src}`);
                        resolve();
                    };
                    newScript.onerror = (e) => {
                        componentLog(`[Loader] Lỗi tải script bên ngoài: ${newScript.src}, Lỗi: ${e.message || e}`, 'error');
                        reject(e);
                    };
                    document.body.appendChild(newScript);
                });
            } else {
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript);
                componentLog(`[Loader] Script nội tuyến đã thực thi trong placeholder '${placeholderId}'.`);
            }
        }

        componentLog(`[Loader] Component '${url}' đã được tải và chèn thành công vào '${placeholderId}'.`);
        return true;
    } catch (error) {
        componentLog(`[Loader] Thất bại khi tải và chèn component '${url}' vào '${placeholderId}': ${error.message}`, 'error');
        return false;
    }
}

/**
 * Tải các component phổ biến (header, footer, fab-container).
 */
async function loadCommonComponents() {
    componentLog("[Loader] Bắt đầu trình tự tải component...");
    const componentsToLoad = [
        { id: 'header-placeholder', url: '/components/header.html' },
        { id: 'fab-container-placeholder', url: '/components/fab-container.html' },
        { id: 'footer-placeholder', url: '/components/footer.html' }
    ];

    for (const comp of componentsToLoad) {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            if (success) {
                // Initialize component-specific controllers after content is loaded
                if (comp.id === 'header-placeholder') {
                    // Small delay to ensure IVSHeaderController script is fully parsed and available
                    setTimeout(() => {
                        if (window.IVSHeaderController && typeof window.IVSHeaderController.init === 'function') {
                            window.IVSHeaderController.init();
                            componentLog("[Loader] IVSHeaderController đã được khởi tạo.", "info");
                        } else {
                            componentLog("[Loader] IVSHeaderController không tìm thấy hoặc không có hàm init sau khi tải header. Đảm bảo headerController.js được tải.", 'error');
                        }
                    }, 400); 
                } else if (comp.id === 'fab-container-placeholder') {
                    // Small delay to ensure IVSFabController script is fully parsed and available
                    setTimeout(() => {
                        if (window.IVSFabController && typeof window.IVSFabController.init === 'function') {
                            window.IVSFabController.init();
                            componentLog("[Loader] IVSFabController đã được khởi tạo.", "info");
                        } else {
                            componentLog("[Loader] IVSFabController không tìm thấy hoặc không có hàm init sau khi tải fab-container. Đảm bảo fabController.js được tải.", 'error');
                        }
                    }, 400); 
                }
            }
        } else {
            componentLog(`[Loader] Placeholder '${comp.id}' không tồn tại trên trang, bỏ qua tải component '${comp.url}'.`, 'warn');
        }
    }

    // Update current year span
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
        componentLog("[Loader] Đã cập nhật năm hiện tại.");
    }

    componentLog("[Loader] Trình tự tải component và khởi tạo cơ bản đã hoàn tất.");
    // Callback for page-specific initializations (e.g., AOS.init in index.html)
    window.onPageComponentsLoadedCallback?.();
}

document.addEventListener('DOMContentLoaded', loadCommonComponents);
