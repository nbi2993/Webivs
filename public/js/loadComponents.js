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
        // Đây không phải là lỗi nếu một số trang không có tất cả các placeholder.
        // Hoặc có thể phần tử placeholder bị thiếu trong cấu trúc HTML.
        componentLog(`Placeholder #${placeholderId} cho ${componentName} không tìm thấy. Component này sẽ không được tải trên trang này.`, 'warn');
        return true; // Resolved true để không làm hỏng chuỗi Promise.all nếu placeholder là tùy chọn.
    }
    
    // Hiển thị văn bản đang tải nếu có
    const loadingText = placeholder.dataset.loadingText || `Đang tải ${componentName}...`;
    placeholder.innerHTML = `<div style="text-align:center;padding:1rem;color:#9ca3af;">${loadingText}</div>`;
    
    componentLog(`Đang cố gắng tải ${componentName} từ ${filePath}...`, 'log');
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            // Log lỗi HTTP cụ thể
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
        // Kiểm tra nếu script đã có sẵn để tránh tải lại
        if (document.querySelector(`script[src="${scriptPath}"]`)) {
            componentLog(`Script ${scriptPath} đã có trong DOM.`, 'log');
            resolve();
            return;
        }
        componentLog(`Đang tải script: ${scriptPath}...`);
        const script = document.createElement('script');
        script.src = scriptPath;
        // Sử dụng defer để đảm bảo các script thực thi theo thứ tự sau khi HTML được phân tích cú pháp.
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
    // Các đường dẫn là tương đối so với thư mục gốc của trang web, giả sử 'public' là thư mục được phục vụ.
    const componentFilePaths = {
        header: '/components/header.html',
        footer: '/components/footer.html',
        fabContainer: '/components/fab-container.html'
    };

    const componentsLoadPromises = [
        loadComponent('Header', 'header-placeholder', componentFilePaths.header),
        loadComponent('Footer', 'footer-placeholder', componentFilePaths.footer),
        loadComponent('FABs', 'fab-container-placeholder', componentFilePaths.fabContainer)
    ];

    const componentsLoadedResults = await Promise.all(componentsLoadPromises);

    // Kiểm tra xem có bất kỳ component nào bị lỗi tải (trả về false) hay không.
    if (componentsLoadedResults.includes(false)) {
        componentLog('Một hoặc nhiều component HTML không tải thành công. Các script phụ thuộc vẫn sẽ cố gắng tải, nhưng một số yếu tố hình ảnh có thể bị thiếu hoặc bị hỏng.', 'warn');
        // Chúng tôi sẽ *không* dừng lại ở đây để cho phép các script khác có thể tải và cung cấp một số chức năng,
        // nhưng cảnh báo này làm nổi bật vấn đề.
    } else {
        componentLog('Tất cả các component HTML đã tải thành công (hoặc các placeholder của chúng không có mặt, điều này là chấp nhận được).');
    }
    
    componentLog('Đang tải các script phụ thuộc...');

    // 2. Tải các script quan trọng theo một trình tự đã định nghĩa.
    try {
        // language.js thường được yêu cầu bởi script.js và phần còn lại của trang web.
        await loadScript('/js/language.js');
        // script.js chứa logic tương tác chung cho header, menu di động, FABs, v.v.
        await loadScript('/js/script.js');
        // posts-loader.js là một tiện ích chung có thể được yêu cầu.
        await loadScript('/js/posts-loader.js');
        // contact-page.js nếu nó được sử dụng toàn cầu (nó thường dành riêng cho trang, nhưng nếu cần luôn luôn, tải ở đây).
        // Nếu contact-page.js chỉ dành cho contact.html, nó nên được tải riêng trên trang đó.
        // Hiện tại, chỉ giữ các script chung ở đây.
        // await loadScript('/js/contact-page.js'); 
    } catch (error) {
        componentLog(`Một script quan trọng không tải được: ${error.message}. Chức năng của trang web có thể bị hạn chế nghiêm trọng.`, 'error');
        // Không dừng lại ở đây, cho phép phần còn lại của script chạy để phục vụ mục đích gỡ lỗi/chức năng một phần.
    }

    componentLog('Các script cốt lõi đã tải. Đang khởi tạo tương tác và hệ thống ngôn ngữ...');

    // 3. Khởi tạo các chức năng của component đã tải.
    // Đảm bảo các hàm này tồn tại (ví dụ: được định nghĩa trong script.js hoặc language.js)
    if (typeof window.initializeLanguageSystem === 'function') {
        // Khởi tạo hệ thống ngôn ngữ trước vì các component khác có thể phụ thuộc vào nó.
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

    // Khởi tạo footer nếu nó có bất kỳ tương tác JS cụ thể nào (ví dụ: năm hiện tại, biểu mẫu nhận bản tin).
    // Footer hiện tại có script nội tuyến riêng cho năm, nhưng nếu cần logic khác, thêm vào đây.
    if (typeof window.initializeFooter === 'function') {
        window.initializeFooter();
        componentLog('Footer đã khởi tạo.');
    } else {
        // Nếu initializeFooter không quan trọng hoặc không tồn tại, cảnh báo này có thể bị loại bỏ.
        componentLog('Không tìm thấy hàm window.initializeFooter. Hiển thị footer cơ bản vẫn sẽ hoạt động.', 'warn');
    }
    
    // 4. Gửi một sự kiện tùy chỉnh để thông báo cho các script dành riêng cho trang rằng mọi thứ đã sẵn sàng.
    componentLog('Tất cả các component và script cốt lõi đã sẵn sàng. Đang kích hoạt sự kiện "componentsLoaded".');
    document.dispatchEvent(new CustomEvent('componentsLoaded'));
    
    componentLog('Chuỗi khởi tạo hoàn tất.');
};

// Bắt đầu toàn bộ quá trình khi DOM ban đầu đã sẵn sàng.
document.addEventListener('DOMContentLoaded', initializeSite);
