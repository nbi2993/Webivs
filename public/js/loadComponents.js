/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 5.4 - Enhanced controller initialization timing for robust mobile interaction.
 * @author IVS-Technical-Team
 */

'use strict';

// =================================================================
//  LOGGING & UTILITIES (Centralized here)
// =================================================================
/**
 * Ghi log các thông báo liên quan đến tải component.
 * @param {string} message Thông điệp cần ghi log.
 * @param {'info'|'warn'|'error'} [level='info'] Mức độ log (info, warn, error).
 */
function componentLog(message, level = 'info') {
    console[level](`[IVS Components] ${message}`);
}
// Expose componentLog globally for other scripts that might need it (e.g., fabController.js)
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
//  MAIN COMPONENT LOADER
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
        componentLog(`[loadAndInject] Placeholder '${placeholderId}' không tìm thấy. Không thể tải ${url}.`, "error");
        return false;
    }
    componentLog(`[loadAndInject] Bắt đầu tải và chèn '${url}' vào '${placeholderId}'.`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP ${response.status} khi tải ${url}`);
        }
        
        const text = await response.text();
        
        // Create a temporary div to parse the HTML and extract scripts
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        const scripts = Array.from(tempDiv.querySelectorAll('script'));

        // Remove scripts from tempDiv's innerHTML before injecting to avoid double execution
        scripts.forEach(script => script.parentNode?.removeChild(script));
        
        // Inject the HTML content (without scripts first)
        placeholder.innerHTML = tempDiv.innerHTML;
        componentLog(`[loadAndInject] Nội dung HTML của '${url}' đã chèn vào '${placeholderId}'.`);

        // Execute scripts sequentially
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            
            // Handle both inline scripts and external scripts
            if (oldScript.src) {
                newScript.src = oldScript.src;
                await new Promise((resolve, reject) => {
                    newScript.onload = () => {
                        componentLog(`[loadAndInject] Script bên ngoài đã tải: ${newScript.src}`);
                        resolve();
                    };
                    newScript.onerror = (e) => {
                        componentLog(`[loadAndInject] Lỗi tải script bên ngoài: ${newScript.src}, Lỗi: ${e.message || e}`, 'error');
                        reject(e);
                    };
                    document.body.appendChild(newScript); 
                });
            } else {
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript); // Append to execute inline scripts
                componentLog(`[loadAndInject] Script nội tuyến đã thực thi trong placeholder '${placeholderId}'.`);
            }
        }
        
        componentLog(`[loadAndInject] Component '${url}' đã được tải và chèn thành công vào '${placeholderId}'.`);
        return true;
    } catch (error) {
        componentLog(`[loadAndInject] Thất bại khi tải và chèn component '${url}' vào '${placeholderId}': ${error.message}`, 'error');
        return false;
    }
}

/**
 * Tải các component phổ biến (header, footer, fab-container).
 */
async function loadCommonComponents() {
    componentLog("[loadCommonComponents] Bắt đầu trình tự tải component...");
    const componentsToLoad = [
        { id: 'header-placeholder', url: '/components/header.html' }, 
        { id: 'fab-container-placeholder', url: '/components/fab-container.html' }, 
        { id: 'footer-placeholder', url: '/components/footer.html' }
    ];

    for (const comp of componentsToLoad) {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            if (success) {
                // IMPORTANT: Use sufficient setTimeout to ensure scripts loaded by loadAndInject have executed
                // and defined global objects (like IVSHeaderController, IVSFabController).
                // A small delay (e.g., 100-200ms) is often safer for complex scenarios.
                if (comp.id === 'header-placeholder') {
                    setTimeout(() => {
                        if (window.IVSHeaderController && typeof window.IVSHeaderController.init === 'function') {
                            window.IVSHeaderController.init();
                            componentLog("[loadCommonComponents] IVSHeaderController đã được khởi tạo qua setTimeout.", "info");
                        } else {
                            componentLog("[loadCommonComponents] IVSHeaderController không tìm thấy hoặc không có hàm init sau khi tải header. Đảm bảo headerController.js được tải.", 'error');
                        }
                    }, 150); // Increased delay
                } else if (comp.id === 'fab-container-placeholder') {
                    // fabController.js defines IVSFabController and is injected via fab-container.html
                    setTimeout(() => {
                        if (window.IVSFabController && typeof window.IVSFabController.init === 'function') {
                            window.IVSFabController.init();
                            componentLog("[loadCommonComponents] IVSFabController đã được khởi tạo qua setTimeout.", "info");
                        } else {
                            componentLog("[loadCommonComponents] IVSFabController không tìm thấy hoặc không có hàm init sau khi tải fab-container. Đảm bảo fabController.js được tải.", 'error');
                        }
                    }, 150); // Increased delay
                }
            }
        } else {
            componentLog(`[loadCommonComponents] Placeholder '${comp.id}' không tồn tại trên trang, bỏ qua tải component '${comp.url}'.`, 'warn');
        }
    }

    // Initialize global system (e.g., language system) if available
    // Ensure window.system is defined by language.js before attempting to init it.
    // language.js is self-initializing on DOMContentLoaded, so it should be ready or init itself.
    setTimeout(() => {
        if (window.system && typeof window.system.init === 'function') {
            window.system.init({ language: 'en', translationUrl: '/lang/' }); // Default to 'en'
            componentLog("[loadCommonComponents] Hệ thống toàn cầu (ví dụ: ngôn ngữ) đã được khởi tạo qua setTimeout.", "info");
        } else {
            componentLog("[loadCommonComponents] window.system hoặc window.system.init không được định nghĩa. Đảm bảo language.js đã tải.", 'error');
        }
    }, 200); // Slightly longer delay to ensure language.js is fully ready

    componentLog("[loadCommonComponents] Trình tự tải component đã hoàn tất.");
    window.onPageComponentsLoadedCallback?.(); 
}

document.addEventListener('DOMContentLoaded', loadCommonComponents);
