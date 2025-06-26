/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 4.9 - Enhanced Component Loading & Init Flow.
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

// =================================================================
//  MAIN COMPONENT LOADER
// =================================================================

/**
 * Tải một component HTML và chèn vào một placeholder,
 * đảm bảo mọi thẻ <script> trong HTML được chèn đều được thực thi.
 * @param {string} url Đường dẫn URL của component HTML cần tải.
 * @param {string} placeholderId ID của phần tử HTML để chèn component vào.
 * @returns {Promise<boolean>} Một Promise trả về true nếu thành công, false nếu thất bại.
 */
async function loadAndInject(url, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        componentLog(`Placeholder '${placeholderId}' không tìm thấy. Không thể tải ${url}.`, "error");
        return false;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP ${response.status} khi tải ${url}`);
        }
        
        const text = await response.text();
        
        // Tạo một div tạm thời để phân tích HTML và trích xuất các script
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        const scripts = Array.from(tempDiv.querySelectorAll('script'));

        // Xóa các script khỏi innerHTML của tempDiv trước khi chèn để tránh thực thi hai lần
        scripts.forEach(script => script.parentNode?.removeChild(script));
        
        // Chèn nội dung HTML (không có script trước) vào placeholder
        placeholder.innerHTML = tempDiv.innerHTML;

        // Thực thi các script một cách tuần tự
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            
            // Xử lý cả script nội tuyến và script bên ngoài
            if (oldScript.src) {
                newScript.src = oldScript.src;
                await new Promise((resolve, reject) => {
                    newScript.onload = () => {
                        componentLog(`Script bên ngoài đã tải: ${newScript.src}`);
                        resolve();
                    };
                    newScript.onerror = (e) => {
                        componentLog(`Lỗi tải script bên ngoài: ${newScript.src}, Lỗi: ${e.message || e}`, 'error');
                        reject(e);
                    };
                    // Thêm vào body, nơi script thường được mong đợi thực thi
                    document.body.appendChild(newScript); 
                });
            } else {
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript); // Thêm vào body để thực thi script nội tuyến
                componentLog(`Script nội tuyến đã thực thi trong placeholder '${placeholderId}'.`);
            }
        }
        
        componentLog(`Component '${url}' đã được tải và chèn thành công vào '${placeholderId}'.`);
        return true;
    } catch (error) {
        componentLog(`Thất bại khi tải và chèn component '${url}' vào '${placeholderId}': ${error.message}`, 'error');
        return false;
    }
}

/**
 * Tải các component phổ biến (header, footer, fab-container).
 */
async function loadCommonComponents() {
    componentLog("Bắt đầu trình tự tải component...");
    const componentsToLoad = [
        // IVSHeaderController được định nghĩa trong headerController.js, script này sẽ được load cùng header.html
        { id: 'header-placeholder', url: '/components/header.html' }, 
        { id: 'fab-container-placeholder', url: '/components/fab-container.html' }, // Controller được định nghĩa trong HTML này
        { id: 'footer-placeholder', url: '/components/footer.html' }
    ];

    for (const comp of componentsToLoad) {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            if (success) {
                // Xử lý đặc biệt để khởi tạo các controller sau khi script của chúng đã chạy
                // Sử dụng setTimeout(0) để đảm bảo các đối tượng controller đã hoàn toàn sẵn sàng
                if (comp.id === 'header-placeholder') {
                    setTimeout(() => {
                        if (window.IVSHeaderController && typeof window.IVSHeaderController.init === 'function') {
                            window.IVSHeaderController.init();
                            componentLog("IVSHeaderController đã được khởi tạo.");
                        } else {
                            componentLog("IVSHeaderController không tìm thấy hoặc không có hàm init sau khi tải header.", 'warn');
                        }
                    }, 0);
                } else if (comp.id === 'fab-container-placeholder') {
                    setTimeout(() => {
                        if (window.IVSFabController && typeof window.IVSFabController.init === 'function') {
                            window.IVSFabController.init();
                            componentLog("IVSFabController đã được khởi tạo.");
                        } else {
                            componentLog("IVSFabController không tìm thấy hoặc không có hàm init sau khi tải fab-container.", 'warn');
                        }
                    }, 0);
                }
            }
        } else {
            componentLog(`Placeholder '${comp.id}' không tồn tại trên trang, bỏ qua tải component '${comp.url}'.`, 'warn');
        }
    }

    // Khởi tạo hệ thống toàn cầu (ví dụ: hệ thống ngôn ngữ) nếu có
    // Đảm bảo window.system và window.system.init đã được định nghĩa
    setTimeout(() => {
        if (window.system && typeof window.system.init === 'function') {
            window.system.init({ language: 'vi', translationUrl: '/lang/' });
            componentLog("Hệ thống toàn cầu (ví dụ: ngôn ngữ) đã được khởi tạo.");
        } else {
            componentLog("window.system hoặc window.system.init không được định nghĩa.", 'warn');
        }
    }, 0);

    componentLog("Trình tự tải component đã hoàn tất.");
    // Kích hoạt callback nếu được định nghĩa bởi trang sau khi tất cả các component đã tải
    window.onPageComponentsLoadedCallback?.(); 
}

// Lắng nghe sự kiện 'DOMContentLoaded' để đảm bảo DOM đã sẵn sàng trước khi tải component
document.addEventListener('DOMContentLoaded', loadCommonComponents);
