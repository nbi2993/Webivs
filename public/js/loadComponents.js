/**
 * @fileoverview This script handles the dynamic loading of shared HTML components
 * like the header, footer, and floating action buttons (FABs) into placeholders
 * on various pages. It ensures that common elements are maintainable from a
 * single source.
 *
 * @version 1.1
 * @author IVS-Technical-Team
 * @date 2024-05-20
 */

// A set to keep track of loaded component URLs to prevent duplicate fetches.
const loadedComponents = new Set();
const componentLogs = [];

/**
 * Logs a message related to component loading and stores it.
 * @param {string} message - The message to log.
 * @param {'info'|'warn'|'error'} [level='info'] - The log level.
 */
function componentLog(message, level = 'info') {
    const logEntry = `[IVS Components] ${message}`;
    componentLogs.push(logEntry);
    switch (level) {
        case 'error':
            console.error(logEntry);
            break;
        case 'warn':
            console.warn(logEntry);
            break;
        default:
            console.log(logEntry);
            break;
    }
}

/**
 * Fetches and injects an HTML component into a specified placeholder.
 * It ensures that each component is fetched only once.
 *
 * @param {string} name - The friendly name of the component for logging.
 * @param {string} url - The URL of the component's HTML file.
 * @param {string} placeholderId - The CSS selector for the placeholder element.
 * @returns {Promise<string>} A promise that resolves with the component's HTML content upon successful loading.
 */
function loadComponent(name, url, placeholderId) {
    return new Promise((resolve, reject) => {
        const placeholder = document.querySelector(placeholderId);
        if (!placeholder) {
            const message = `Placeholder '${placeholderId}' for ${name} not found. Skipping.`;
            componentLog(message, 'warn');
            return reject(new Error(message));
        }

        if (loadedComponents.has(url)) {
            const message = `${name} component already processed. Skipping duplicate load.`;
            componentLog(message, 'info');
            return resolve(''); // Resolve empty as it's handled
        }

        componentLog(`Đang tải: ${name} từ ${url} vào ${placeholderId}`);
        loadedComponents.add(url);

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Lỗi HTTP ${response.status} cho ${url}`);
                }
                return response.text();
            })
            .then(html => {
                if (html.trim() === '') {
                   componentLog(`Component ${name} from ${url} is empty.`, 'warn');
                }
                placeholder.innerHTML = html;
                componentLog(`Đã tải thành công ${name}.`);
                resolve(html); // Resolve with the HTML content
            })
            .catch(error => {
                const message = `Lỗi khi tải ${name}: ${error.message}`;
                componentLog(message, 'error');
                placeholder.innerHTML = `<div class="text-red-500 p-4 text-center">[Không thể tải thành phần ${name}]</div>`;
                reject(error);
            });
    });
}

/**
 * Initializes and loads all common components required for the page.
 * It also handles the initialization of language systems which may depend on these components.
 */
function loadCommonComponents() {
    componentLog("Bắt đầu chuỗi tải các thành phần chung...");

    const headerPromise = loadComponent('Header', './components/header.html', '#header-placeholder');
    const footerPromise = loadComponent('Footer', './components/footer.html', '#footer-placeholder');
    const fabPromise = loadComponent('FABs', './components/fab-container.html', '#fab-container-placeholder');

    // Handle header loading and subsequent language system initialization
    headerPromise.then(headerHtml => {
        if (headerHtml) {
            // Re-run the language initialization if it exists, as the header contains language controls.
            if (window.system && typeof window.system.init === 'function') {
                componentLog("Header đã tải, đang khởi tạo lại hệ thống ngôn ngữ.");
                window.system.init({
                    language: 'vi',
                    translationUrl: './lang/'
                });
            } else {
                componentLog("Hệ thống ngôn ngữ (window.system) không khả dụng sau khi tải header.", "warn");
            }
        }
    }).catch(error => {
        componentLog("Không thể tải và khởi tạo header: Nội dung HTML của Header không tải được.", 'error');
        // Fallback language initialization if header fails
        if (!window.system || !window.system.isInitialized) {
             componentLog("Header không tải/khởi tạo thành công. Hệ thống ngôn ngữ có thể không hoạt động đúng.", "warn");
             // Attempt a fallback initialization if the system object exists
            if(window.system && typeof window.system.init === 'function') {
                 window.system.init({
                    language: 'vi',
                    translationUrl: './lang/'
                });
            } else {
                componentLog("Lỗi khởi tạo ngôn ngữ (fallback khi header lỗi): system is not defined", "error");
            }
        }
    });
    
    // Load other components in parallel
    fabPromise.catch(error => {
         componentLog(`Không tải được ${error.message}.`, 'error');
    });
    footerPromise.catch(error => {
        componentLog(`Không tải được ${error.message}.`, 'error');
    });


    // After all components are settled, check for a page-specific callback
    Promise.allSettled([headerPromise, footerPromise, fabPromise]).then(() => {
        componentLog("Chuỗi tải các thành phần chung đã hoàn tất.");
        if (typeof window.onPageComponentsLoadedCallback === 'function') {
            componentLog("Đang thực thi onPageComponentsLoadedCallback của trang.");
            window.onPageComponentsLoadedCallback();
        } else {
            componentLog("Không tìm thấy onPageComponentsLoadedCallback của trang.");
        }
    });
}

// Execute the component loading process once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', loadCommonComponents);
