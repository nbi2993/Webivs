/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 5.2 - Added debugging logs for mobile interactivity.
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
//  COMPONENT LOGIC MODULES (Assumes these are defined globally or loaded first)
// =================================================================

/**
 * All logic related to the Header and Mobile Menu.
 * Handles responsive menu, submenus, and scroll effects.
 */
const IVSHeaderController = {
    init() {
        componentLog("IVSHeaderController: Bắt đầu khởi tạo.", "info");
        this.cacheDOM();
        if (!this.header) {
            componentLog("IVSHeaderController: Không tìm thấy phần tử Header. Logic UI sẽ không chạy.", "error");
            return;
        }
        this.bindEvents();
        this.updateActiveLinks();
        this.onScroll(); 
        componentLog("IVSHeaderController: Khởi tạo hoàn tất.", "info");
    },

    cacheDOM() {
        this.header = document.getElementById('ivs-main-header');
        this.mobilePanel = document.getElementById('ivs-mobile-menu-panel');
        this.mobileOpenBtn = document.getElementById('mobile-menu-open-btn');
        this.mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
        this.mobileBackdrop = document.getElementById('ivs-mobile-menu-backdrop');
        this.bottomNavMenuBtn = document.getElementById('bottom-nav-menu-btn');
        this.bottomNavLangToggleBtn = document.getElementById('bottom-nav-lang-toggle-btn');
        this.submenuToggles = document.querySelectorAll('.mobile-submenu-toggle');
        this.navLinks = document.querySelectorAll('a.desktop-nav-link, .dropdown-item, #ivs-mobile-main-nav a, a.bottom-nav-item');
        
        // Log element presence for debugging
        componentLog(`Header: ${!!this.header}, Mobile Panel: ${!!this.mobilePanel}, Open Btn: ${!!this.mobileOpenBtn}, Close Btn: ${!!this.mobileCloseBtn}, Backdrop: ${!!this.mobileBackdrop}`, 'info');
        componentLog(`Bottom Nav Menu Btn: ${!!this.bottomNavMenuBtn}, Bottom Nav Lang Toggle Btn: ${!!this.bottomNavLangToggleBtn}`, 'info');
        componentLog(`Submenu Toggles count: ${this.submenuToggles.length}`, 'info');
    },

    bindEvents() {
        componentLog("IVSHeaderController: Bắt đầu gắn kết sự kiện.", "info");

        window.addEventListener('scroll', debounce(() => this.onScroll(), 50), { passive: true });
        componentLog("IVSHeaderController: Đã gắn sự kiện Scroll.");
        
        if (this.mobileOpenBtn) {
            this.mobileOpenBtn.addEventListener('click', () => this.toggleMobileMenu(true));
            componentLog("IVSHeaderController: Đã gắn sự kiện click cho mobile-menu-open-btn.");
        }
        if (this.mobileCloseBtn) {
            this.mobileCloseBtn.addEventListener('click', () => this.toggleMobileMenu(false));
            componentLog("IVSHeaderController: Đã gắn sự kiện click cho mobile-menu-close-btn.");
        }
        if (this.mobileBackdrop) {
            this.mobileBackdrop.addEventListener('click', () => this.toggleMobileMenu(false));
            componentLog("IVSHeaderController: Đã gắn sự kiện click cho mobile-menu-backdrop.");
        }
        if (this.bottomNavMenuBtn) {
            this.bottomNavMenuBtn.addEventListener('click', () => this.toggleMobileMenu(true));
            componentLog("IVSHeaderController: Đã gắn sự kiện click cho bottom-nav-menu-btn.");
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mobilePanel?.classList.contains('is-open')) {
                this.toggleMobileMenu(false);
            }
        });
        componentLog("IVSHeaderController: Đã gắn sự kiện Keydown (Escape).");

        this.submenuToggles.forEach((toggle, index) => {
            toggle.addEventListener('click', () => this.toggleSubmenu(toggle));
            componentLog(`IVSHeaderController: Đã gắn sự kiện click cho Submenu Toggle ${index}.`);
        });

        if (this.bottomNavLangToggleBtn) {
            this.bottomNavLangToggleBtn.addEventListener('click', () => this.toggleOneTouchLanguage());
            componentLog("IVSHeaderController: Đã gắn sự kiện click cho bottom-nav-lang-toggle-btn.");
        }
        
        // Ensure desktop language options also work (from previous versions)
        document.querySelectorAll('.desktop-dropdown-container .lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                if (lang) {
                    this.setLanguage(lang);
                }
            });
            componentLog("IVSHeaderController: Đã gắn sự kiện click cho tùy chọn ngôn ngữ desktop.");
        });

        componentLog("IVSHeaderController: Gắn kết sự kiện hoàn tất.", "info");
    },
    
    setLanguage(lang) {
        componentLog(`IVSHeaderController: Yêu cầu đặt ngôn ngữ thành: ${lang}`);
        if (window.system && typeof window.system.setLanguage === 'function') {
            window.system.setLanguage(lang);
            componentLog(`IVSHeaderController: Đã gọi window.system.setLanguage('${lang}').`);
        } else {
            componentLog('IVSHeaderController: Hệ thống ngôn ngữ (window.system.setLanguage) không tìm thấy. Thay đổi ngôn ngữ có thể không hoạt động như mong đợi.', 'error');
        }
    },

    toggleOneTouchLanguage() {
        if (!window.langSystem) {
            componentLog("IVSHeaderController: window.langSystem không khả dụng. Không thể chuyển đổi ngôn ngữ một chạm.", 'error');
            return;
        }
        const currentLang = window.langSystem.currentLanguage;
        const nextLang = currentLang === 'en' ? 'vi' : 'en';
        componentLog(`IVSHeaderController: Chuyển đổi ngôn ngữ một chạm: từ ${currentLang} sang ${nextLang}`);
        this.setLanguage(nextLang);
    },

    onScroll() {
        if (this.header) {
            this.header.classList.toggle('scrolled', window.scrollY > 10);
        }
    },
    
    toggleMobileMenu(open) {
        if (!this.mobilePanel) {
            componentLog("IVSHeaderController: Mobile panel không tìm thấy. Không thể chuyển đổi menu.", 'warn');
            return;
        }
        this.mobilePanel.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : ''; // Prevent scroll when menu is open
        componentLog(`IVSHeaderController: Mobile menu ${open ? 'mở' : 'đóng'}.`);
    },

    toggleSubmenu(toggle) {
        const content = toggle.nextElementSibling;
        const icon = toggle.querySelector('i.fa-chevron-down');
        if (!content) {
            componentLog("IVSHeaderController: Nội dung submenu không tìm thấy.", 'warn');
            return;
        }
        
        const isExpanded = content.style.maxHeight && content.style.maxHeight !== '0px';

        if (icon) {
            icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }

        // Toggle aria-expanded attribute
        toggle.setAttribute('aria-expanded', !isExpanded);

        content.style.maxHeight = isExpanded ? '0px' : `${content.scrollHeight}px`;
        componentLog(`IVSHeaderController: Submenu ${isExpanded ? 'đóng' : 'mở'} cho ${toggle.textContent.trim()}.`);
    },

    updateActiveLinks() {
        const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
        
        this.navLinks.forEach(link => {
            const linkPath = (link.getAttribute('href') || "").replace(/\/$/, "") || "/";
            
            link.classList.remove('active');

            if (linkPath === currentPath) {
                link.classList.add('active');
            } else if (linkPath !== "/" && currentPath.startsWith(linkPath)) {
                link.classList.add('active');
            }
        });
        componentLog("IVSHeaderController: Đã cập nhật các liên kết đang hoạt động.");
    }
};


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
                if (comp.id === 'header-placeholder') {
                    // Slight delay to ensure IVSHeaderController is fully defined after script execution
                    setTimeout(() => {
                        if (window.IVSHeaderController && typeof window.IVSHeaderController.init === 'function') {
                            window.IVSHeaderController.init();
                            componentLog("[loadCommonComponents] IVSHeaderController đã được khởi tạo qua setTimeout.", "info");
                        } else {
                            componentLog("[loadCommonComponents] IVSHeaderController không tìm thấy hoặc không có hàm init sau khi tải header.", 'error');
                        }
                    }, 100); // Increased delay slightly
                } else if (comp.id === 'fab-container-placeholder') {
                    setTimeout(() => {
                        if (window.IVSFabController && typeof window.IVSFabController.init === 'function') {
                            window.IVSFabController.init();
                            componentLog("[loadCommonComponents] IVSFabController đã được khởi tạo qua setTimeout.", "info");
                        } else {
                            componentLog("[loadCommonComponents] IVSFabController không tìm thấy hoặc không có hàm init sau khi tải fab-container.", 'warn');
                        }
                    }, 0);
                }
            }
        } else {
            componentLog(`[loadCommonComponents] Placeholder '${comp.id}' không tồn tại trên trang, bỏ qua tải component '${comp.url}'.`, 'warn');
        }
    }

    // Khởi tạo hệ thống toàn cầu (ví dụ: hệ thống ngôn ngữ) nếu có
    setTimeout(() => {
        if (window.system && typeof window.system.init === 'function') {
            window.system.init({ language: 'en', translationUrl: '/lang/' }); // Default to 'en'
            componentLog("[loadCommonComponents] Hệ thống toàn cầu (ví dụ: ngôn ngữ) đã được khởi tạo qua setTimeout.", "info");
        } else {
            componentLog("[loadCommonComponents] window.system hoặc window.system.init không được định nghĩa.", 'error');
        }
    }, 100); // Increased delay slightly

    componentLog("[loadCommonComponents] Trình tự tải component đã hoàn tất.");
    window.onPageComponentsLoadedCallback?.(); 
}

document.addEventListener('DOMContentLoaded', loadCommonComponents);
