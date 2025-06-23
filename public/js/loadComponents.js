'use strict';

/**
 * @fileoverview Central component and script loader for the IVS website.
 * This script ensures all shared components (header, footer, FAB) and their
 * dependent scripts (language, interactions) are loaded in the correct order
 * to prevent race conditions and execution errors.
 */

// --- UTILITY FUNCTIONS ---

/**
 * Logs messages with a consistent prefix for easier debugging.
 * @param {string} message The message to log.
 * @param {'log'|'warn'|'error'} type The console method to use.
 */
const componentLog = (message, type = 'log') => {
    const debugMode = true; // Đặt thành 'false' trong môi trường production để tắt log debug
    if (debugMode || type === 'error' || type === 'warn') { // Đảm bảo lỗi và cảnh báo luôn được log
        console[type](`[IVS Loader] ${message}`);
    }
};

/**
 * Fetches HTML content and injects it into a specified placeholder element.
 * Tải nội dung HTML và chèn vào một phần tử placeholder cụ thể.
 * @param {string} componentName Tên thân thiện của component để log.
 * @param {string} placeholderId ID của phần tử để chèn HTML vào.
 * @param {string} filePath Đường dẫn đến tệp HTML của component.
 * @returns {Promise<boolean>} Một Promise sẽ resolved thành 'true' nếu thành công, 'false' nếu thất bại.
 */
const loadComponent = async (componentName, placeholderId, filePath) => {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        componentLog(`Placeholder #${placeholderId} cho ${componentName} không tìm thấy. Component này sẽ không được tải trên trang này.`, 'warn');
        return true; 
    }
    
    const loadingText = placeholder.dataset.loadingText || `Đang tải ${componentName}...`;
    placeholder.innerHTML = `<div style="text-align:center;padding:1rem;color:#9ca3af;">${loadingText}</div>`;
    
    componentLog(`Đang cố gắng tải ${componentName} từ ${filePath}...`, 'log');
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP ${response.status} (${response.statusText}) cho ${filePath}`);
        }
        placeholder.innerHTML = await response.text();
        componentLog(`${componentName} đã tải thành công từ ${filePath}.`);
        return true;
    } catch (error) {
        componentLog(`Không thể tải ${componentName} từ ${filePath}: ${error.message}. Vui lòng kiểm tra tab Network để biết chi tiết.`, 'error');
        placeholder.innerHTML = `<div style="text-align:center;color:red;padding:1rem;">Lỗi tải ${componentName}. Vui lòng làm mới trang hoặc thử lại sau.</div>`;
        return false;
    }
};

/**
 * Dynamically loads a JavaScript file by creating a <script> tag.
 * Tải một tệp JavaScript động bằng cách tạo thẻ <script>.
 * @param {string} scriptPath Đường dẫn đến tệp JavaScript.
 * @returns {Promise<void>} Một Promise sẽ resolved khi script được tải hoặc rejected nếu có lỗi.
 */
const loadScript = (scriptPath) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${scriptPath}"]`)) {
            componentLog(`Script ${scriptPath} đã có trong DOM.`, 'log');
            resolve();
            return;
        }
        componentLog(`Đang tải script: ${scriptPath}...`);
        const script = document.createElement('script');
        script.src = scriptPath;
        script.defer = true; 
        script.onload = () => {
            componentLog(`Script ${scriptPath} đã tải thành công.`);
            resolve();
        };
        script.onerror = () => {
            componentLog(`Không thể tải script: ${scriptPath}. Vui lòng kiểm tra tab Network để tìm lỗi 404 hoặc Console để tìm lỗi JS.`, 'error');
            reject(new Error(`Lỗi tải script cho ${scriptPath}`));
        };
        document.body.appendChild(script);
    });
};


// --- MAIN EXECUTION LOGIC ---

/**
 * The main function that orchestrates the loading of all components and scripts.
 * Hàm chính điều phối việc tải tất cả các component và script.
 */
const initializeSite = async () => {
    componentLog('Bắt đầu chuỗi khởi tạo.');

    // 1. Tải tất cả các component HTML cùng lúc.
    // Đã điều chỉnh đường dẫn để phù hợp với cấu trúc thư mục /public/components/
    const componentFilePaths = {
        header: '/public/components/header.html',
        footer: '/public/components/footer.html',
        fabContainer: '/public/components/fab-container.html'
    };

    const componentsLoadPromises = [
        loadComponent('Header', 'header-placeholder', componentFilePaths.header),
        loadComponent('Footer', 'footer-placeholder', componentFilePaths.footer),
        loadComponent('FABs', 'fab-container-placeholder', componentFilePaths.fabContainer)
    ];

    const componentsLoadedResults = await Promise.all(componentsLoadPromises);

    if (componentsLoadedResults.includes(false)) {
        componentLog('Một hoặc nhiều component HTML không tải thành công. Các script phụ thuộc vẫn sẽ cố gắng tải, nhưng một số yếu tố hình ảnh có thể bị thiếu hoặc bị hỏng.', 'warn');
    } else {
        componentLog('Tất cả các component HTML đã tải thành công (hoặc các placeholder của chúng không có mặt, điều này là chấp nhận được).');
    }
    
    componentLog('Đang tải các script phụ thuộc...');

    // 2. Tải các script quan trọng theo một trình tự đã định nghĩa.
    try {
        // Đã điều chỉnh đường dẫn để phù hợp với cấu trúc thư mục /public/js/
        await loadScript('/public/js/language.js');
        await loadScript('/public/js/script.js');
        await loadScript('/public/js/posts-loader.js');
        // Script chatbot cũng có thể cần được điều chỉnh nếu nó không được tự động tải từ FABs
        await loadScript('/public/js/chatbot.js'); 

    } catch (error) {
        componentLog(`Một script quan trọng không tải được: ${error.message}. Chức năng của trang web có thể bị hạn chế nghiêm trọng.`, 'error');
    }

    componentLog('Các script cốt lõi đã tải. Đang khởi tạo tương tác và hệ thống ngôn ngữ...');

    // 3. Khởi tạo các chức năng của component đã tải.
    if (typeof window.initializeLanguageSystem === 'function') {
        await window.initializeLanguageSystem();
        componentLog('Hệ thống ngôn ngữ đã khởi tạo.');
    } else {
        componentLog('Không tìm thấy hàm window.initializeLanguageSystem. Các tính năng ngôn ngữ có thể không hoạt động.', 'warn');
    }
    
    if (typeof window.initializeHeader === 'function') {
        window.initializeHeader();
        componentLog('Tương tác Header đã khởi tạo.');
    } else {
        componentLog('Không tìm thấy hàm window.initializeHeader. Tương tác Header có thể bị hạn chế.', 'warn');
    }

    if (typeof window.initializeFabButtons === 'function') {
        window.initializeFabButtons();
        componentLog('Các nút FAB đã khởi tạo.');
    } else {
        componentLog('Không tìm thấy hàm window.initializeFabButtons. Các nút FAB có thể không hoạt động.', 'warn');
    }

    if (typeof window.initializeFooter === 'function') {
        window.initializeFooter();
        componentLog('Footer đã khởi tạo.');
    } else {
        componentLog('Không tìm thấy hàm window.initializeFooter. Hiển thị footer cơ bản vẫn sẽ hoạt động.', 'warn');
    }
    
    // 4. Gửi một sự kiện tùy chỉnh để thông báo cho các script dành riêng cho trang rằng mọi thứ đã sẵn sàng.
    componentLog('Tất cả các component và script cốt lõi đã sẵn sàng. Đang kích hoạt sự kiện "componentsLoaded".');
    document.dispatchEvent(new CustomEvent('componentsLoaded'));
    
    componentLog('Chuỗi khởi tạo hoàn tất.');
};

// Bắt đầu toàn bộ quá trình khi DOM ban đầu đã sẵn sàng.
document.addEventListener('DOMContentLoaded', initializeSite);
