/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 5.0 - Added mobile language switcher logic and improved button interactions.
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
        this.cacheDOM();
        if (!this.header) {
            componentLog("Header element not found. UI logic will not run.", "warn");
            return;
        }
        this.bindEvents();
        this.updateActiveLinks();
        this.onScroll(); 
        componentLog("Header Controller Initialized.", "info");
    },

    cacheDOM() {
        this.header = document.getElementById('ivs-main-header');
        this.mobilePanel = document.getElementById('ivs-mobile-menu-panel');
        this.mobileOpenBtn = document.getElementById('mobile-menu-open-btn');
        this.mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
        this.mobileBackdrop = document.getElementById('ivs-mobile-menu-backdrop');
        this.bottomNavMenuBtn = document.getElementById('bottom-nav-menu-btn');
        this.submenuToggles = document.querySelectorAll('.mobile-submenu-toggle');
        this.navLinks = document.querySelectorAll('a.desktop-nav-link, .dropdown-item, #ivs-mobile-main-nav a, a.bottom-nav-item');
        
        // New: Mobile language selector elements
        this.mobileLangToggle = document.getElementById('mobile-lang-toggle');
        this.mobileLangDropdown = document.getElementById('mobile-lang-dropdown');
        this.langOptions = document.querySelectorAll('.lang-option'); // Both desktop and mobile
    },

    bindEvents() {
        window.addEventListener('scroll', debounce(() => this.onScroll(), 50), { passive: true });
        
        this.mobileOpenBtn?.addEventListener('click', () => this.toggleMobileMenu(true));
        this.mobileCloseBtn?.addEventListener('click', () => this.toggleMobileMenu(false));
        this.mobileBackdrop?.addEventListener('click', () => this.toggleMobileMenu(false));
        this.bottomNavMenuBtn?.addEventListener('click', () => this.toggleMobileMenu(true));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.mobilePanel?.classList.contains('is-open')) {
                    this.toggleMobileMenu(false);
                }
                if (this.mobileLangDropdown?.classList.contains('visible')) {
                    this.toggleMobileLanguageDropdown(false);
                }
            }
        });

        this.submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleSubmenu(toggle));
        });

        // Event listener for the new mobile language toggle button
        this.mobileLangToggle?.addEventListener('click', (e) => this.toggleMobileLanguageDropdown());
        
        // Close mobile language dropdown if clicking outside of it or its toggle
        document.addEventListener('click', (e) => {
            if (this.mobileLangDropdown && !this.mobileLangDropdown.contains(e.target) && 
                this.mobileLangToggle && !this.mobileLangToggle.contains(e.target) &&
                this.mobileLangDropdown.classList.contains('visible')) {
                this.toggleMobileLanguageDropdown(false);
            }
        });

        // Event listeners for language options
        this.langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                if (lang) {
                    this.setLanguage(lang);
                }
                // Ensure dropdown closes after selection on mobile
                if (this.mobileLangDropdown?.classList.contains('visible')) {
                    this.toggleMobileLanguageDropdown(false);
                }
            });
        });
    },
    
    setLanguage(lang) {
        componentLog(`Attempting to set language to: ${lang}`);
        if (window.system && typeof window.system.setLanguage === 'function') {
            window.system.setLanguage(lang);
        } else {
            componentLog('Language system (window.system.setLanguage) not found.', 'warn');
        }
        // No need to close mobile menu here, as language button is now outside it.
        // If it was triggered from desktop, desktop dropdown will close naturally.
    },

    onScroll() {
        if (this.header) {
            this.header.classList.toggle('scrolled', window.scrollY > 10);
        }
    },
    
    toggleMobileMenu(open) {
        if (!this.mobilePanel) return;
        this.mobilePanel.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : ''; // Prevent scroll when menu is open
    },

    toggleSubmenu(toggle) {
        const content = toggle.nextElementSibling;
        const icon = toggle.querySelector('i.fa-chevron-down');
        if (!content) return;
        
        const isExpanded = content.style.maxHeight && content.style.maxHeight !== '0px';

        if (icon) {
            icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }

        // Toggle aria-expanded attribute
        toggle.setAttribute('aria-expanded', !isExpanded);

        content.style.maxHeight = isExpanded ? '0px' : `${content.scrollHeight}px`;
    },

    toggleMobileLanguageDropdown(open) {
        if (!this.mobileLangDropdown || !this.mobileLangToggle) return;

        let shouldOpen = open;
        if (typeof open === 'undefined') { // Toggle behavior if 'open' is not explicitly passed
            shouldOpen = this.mobileLangDropdown.classList.contains('invisible');
        }

        if (shouldOpen) {
            this.mobileLangDropdown.classList.remove('opacity-0', 'invisible', 'scale-95');
            this.mobileLangDropdown.classList.add('opacity-100', 'visible', 'scale-100');
            this.mobileLangToggle.setAttribute('aria-expanded', 'true');
        } else {
            this.mobileLangDropdown.classList.remove('opacity-100', 'visible', 'scale-100');
            this.mobileLangDropdown.classList.add('opacity-0', 'invisible', 'scale-95');
            this.mobileLangToggle.setAttribute('aria-expanded', 'false');
        }
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
        componentLog(`Placeholder '${placeholderId}' không tìm thấy. Không thể tải ${url}.`, "error");
        return false;
    }
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

        // Execute scripts sequentially
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            
            // Handle both inline scripts and external scripts
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
        // IVSHeaderController is defined in headerController.js, script này sẽ được load cùng header.html
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
            window.system.init({ language: 'en', translationUrl: '/lang/' }); // Ensure default language is 'en' here
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
