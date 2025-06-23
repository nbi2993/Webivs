'use strict';

// Quản lý trạng thái global cho các thành phần UI, đảm bảo không khởi tạo lại và theo dõi trạng thái tải.
window.componentState = window.componentState || {
    componentsLoadedAndInitialized: false,
    headerInitialized: false,
    fabInitialized: false,
    footerInitialized: false,
    headerElement: null,
    isMobileMenuOpen: false,
};

/**
 * Ghi log cho các thành phần với prefix [IVS Components] để dễ dàng gỡ lỗi.
 * @param {string} message - Nội dung log.
 * @param {'log'|'warn'|'error'} type - Loại log.
 */
function componentLog(message, type = 'log') {
    const debugMode = true; // Bật/tắt log chi tiết tại đây
    if (debugMode || type === 'error' || type === 'warn') {
        console[type](`[IVS Components] ${message}`);
    }
}

/**
 * Kiểm tra xem thiết bị có phải là mobile không dựa trên chiều rộng màn hình.
 * @returns {boolean}
 */
function isMobileDevice() {
    return window.innerWidth < 768;
}

/**
 * Trì hoãn việc thực thi một hàm sau một khoảng thời gian chờ nhất định kể từ lần gọi cuối cùng.
 * @param {Function} func - Hàm cần debounce.
 * @param {number} wait - Thời gian chờ (ms).
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Tải nội dung HTML của một thành phần từ server và chèn vào placeholder.
 * @param {string} componentName - Tên thành phần để ghi log.
 * @param {string} placeholderId - ID của phần tử placeholder.
 * @param {string} filePath - Đường dẫn đến tệp HTML của thành phần.
 * @returns {Promise<boolean>} - True nếu tải thành công, ngược lại là false.
 */
async function loadComponent(componentName, placeholderId, filePath) {
    componentLog(`Đang tải: ${componentName} từ ${filePath} vào #${placeholderId}`);
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Lỗi HTTP ${response.status} cho ${filePath}`);
        const html = await response.text();
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = html;
            componentLog(`${componentName} đã được chèn vào DOM.`);
            return true;
        }
        throw new Error(`Không tìm thấy Placeholder #${placeholderId}.`);
    } catch (error) {
        componentLog(`Lỗi khi tải ${componentName}: ${error.message}`, 'error');
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) placeholder.innerHTML = `<div class="p-3 text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-md">Lỗi tải ${componentName}.</div>`;
        return false;
    }
}

/**
 * Khởi tạo tất cả các chức năng của Header sau khi nó được tải vào DOM.
 * Bao gồm menu mobile, menu desktop, hành vi cuộn, và cập nhật chiều cao.
 */
function initializeHeaderInternal() {
    if (window.componentState.headerInitialized) {
        componentLog('Header đã được khởi tạo trước đó.', 'warn');
        return;
    }
    componentLog("Bắt đầu khởi tạo Header...");
    try {
        const header = document.getElementById('main-header');
        if (!header) throw new Error('Không tìm thấy phần tử header chính (#main-header).');
        window.componentState.headerElement = header;

        // Khởi tạo Menu Mobile
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenuPanel = document.getElementById('mobile-menu-panel');
        const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
        const mobileMenuCloseBtn = document.getElementById('mobile-menu-close-btn');
        if (mobileMenuButton && mobileMenuPanel) {
            const toggleMobileMenu = (forceClose = false) => {
                const isOpen = mobileMenuPanel.classList.contains('active');
                if (forceClose || isOpen) {
                    mobileMenuPanel.classList.remove('active');
                    setTimeout(() => { mobileMenuPanel.classList.add('hidden'); }, 300);
                    document.body.style.overflow = '';
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                } else {
                    mobileMenuPanel.classList.remove('hidden');
                    requestAnimationFrame(() => mobileMenuPanel.classList.add('active'));
                    document.body.style.overflow = 'hidden';
                    mobileMenuButton.setAttribute('aria-expanded', 'true');
                }
            };
            mobileMenuButton.addEventListener('click', () => toggleMobileMenu());
            if (mobileMenuBackdrop) mobileMenuBackdrop.addEventListener('click', () => toggleMobileMenu(true));
            if (mobileMenuCloseBtn) mobileMenuCloseBtn.addEventListener('click', () => toggleMobileMenu(true));
        }

        // Khởi tạo hành vi ẩn/hiện Header và Bottom Nav khi cuộn
        let lastScrollTop = 0;
        const scrollThreshold = 80;
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
                if(!isMobileDevice()) header.classList.add('header-hidden');
                document.getElementById('bottom-nav-bar')?.classList.add('bottom-nav-hidden');
            } else {
                header.classList.remove('header-hidden');
                document.getElementById('bottom-nav-bar')?.classList.remove('bottom-nav-hidden');
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        };
        window.addEventListener('scroll', debounce(handleScroll, 50), { passive: true });

        // Cập nhật biến CSS cho chiều cao của header
        const updateHeaderHeightVar = () => {
            const height = header.offsetHeight;
            if (height > 0) {
                document.documentElement.style.setProperty('--header-actual-height', `${height}px`);
                 const placeholder = document.getElementById('header-placeholder');
                 if (placeholder) placeholder.style.minHeight = `${height}px`;
            }
        };
        new ResizeObserver(debounce(updateHeaderHeightVar, 50)).observe(header);
        updateHeaderHeightVar();

        // Khởi tạo dropdown cho menu desktop
        document.querySelectorAll('.relative.group').forEach(container => {
            const button = container.querySelector('button[aria-haspopup="true"]');
            const menu = container.querySelector('.desktop-dropdown-content, .mega-menu-content');
            if (!button || !menu) return;
            let menuTimeout;
            const openMenu = () => {
                clearTimeout(menuTimeout);
                menu.classList.remove('opacity-0', 'invisible', 'pointer-events-none');
                button.setAttribute('aria-expanded', 'true');
            };
            const closeMenu = (delay = 150) => {
                menuTimeout = setTimeout(() => {
                    menu.classList.add('opacity-0', 'invisible', 'pointer-events-none');
                    button.setAttribute('aria-expanded', 'false');
                }, delay);
            };
            container.addEventListener('mouseenter', openMenu);
            container.addEventListener('mouseleave', () => closeMenu());
            button.addEventListener('focus', openMenu);
              container.addEventListener('focusout', (e) => {
                  if (!container.contains(e.relatedTarget)) closeMenu(50);
              });
        });

        window.componentState.headerInitialized = true;
        componentLog('Header đã được khởi tạo thành công.');
    } catch (error) {
        componentLog(`Lỗi khởi tạo header: ${error.message}`, 'error');
    }
}
window.initializeHeader = initializeHeaderInternal;

/**
 * Tải và khởi tạo Header.
 * @returns {Promise<boolean>}
 */
async function loadHeader() {
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) {
        componentLog('Placeholder của Header không tìm thấy.', 'error');
        return false;
    }
    placeholder.setAttribute('aria-busy', 'true');
    const loaded = await loadComponent('Header', 'header-placeholder', '/components/header.html');
    if (loaded) {
        initializeHeaderInternal();
    }
    placeholder.setAttribute('aria-busy', 'false');
    return loaded;
}

/**
 * Khởi tạo các chức năng của Footer.
 */
function initializeFooterInternal() {
    if (window.componentState.footerInitialized) return;
    componentLog("Bắt đầu khởi tạo Footer...");
    document.getElementById('current-year')?.textContent = new Date().getFullYear();
    // Thêm các logic khác cho footer nếu cần (vd: form bản tin)
    window.componentState.footerInitialized = true;
    componentLog("Footer đã được khởi tạo.");
}
window.initializeFooter = initializeFooterInternal;

/**
 * Tải và khởi tạo Footer.
 */
async function loadFooter() {
    const placeholder = document.getElementById('footer-placeholder');
    if(placeholder){
        const loaded = await loadComponent('Footer', 'footer-placeholder', '/components/footer.html');
        if (loaded) initializeFooterInternal();
    }
}

/**
 * Điền nội dung động cho các menu FAB (Liên hệ, Chia sẻ).
 */
function populateFabMenus() {
    // Logic điền menu liên hệ
    const contactMenu = document.getElementById('contact-options');
    if(contactMenu) populateContactOptions(contactMenu);

    // Logic điền menu chia sẻ
    const shareMenu = document.getElementById('share-options');
    if(shareMenu) populateShareOptions(shareMenu);
}
// Các hàm populateContactOptions và populateShareOptions được giữ nguyên như anh đã cung cấp
function populateContactOptions(contactMenuElement) {
    if (!contactMenuElement) {
        componentLog("Phần tử menu liên hệ không tồn tại để điền nội dung.", "warn");
        return;
    }
    const contacts = [
        { key: "fab_call_hotline", text: "Gọi Hotline", href: "tel:+84896920547", icon: "fas fa-phone", color: "text-ivs-accent" },
        { key: "fab_send_email", text: "Gửi Email", href: "mailto:info@ivsacademy.edu.vn", icon: "fas fa-envelope", color: "text-ivs-accent" },
        { key: "fab_chat_zalo", text: "Chat Zalo", href: "https://zalo.me/ivsjsc", icon: "fas fa-comment-dots", color: "text-blue-500" },
        { key: "fab_fanpage_fb", text: "Fanpage Facebook", href: "https://www.facebook.com/hr.ivsacademy/", icon: "fab fa-facebook-f", color: "text-blue-600" },
    ];
    let contactHtml = contacts.map(contact => `
        <a href="${contact.href}" role="menuitem" class="fab-submenu-item group" data-lang-key="${contact.key}" ${contact.href.startsWith('http') || contact.href.startsWith('https://zalo.me') ? 'target="_blank" rel="noopener noreferrer"' : ''}>
            <i class="${contact.icon} fa-fw ${contact.color}"></i>
            <span>${contact.text}</span>
        </a>`).join('');
    contactMenuElement.innerHTML = contactHtml;
    if (typeof window.applyTranslations === 'function') window.applyTranslations(contactMenuElement);
}

function populateShareOptions(shareMenuElement) {
    if (!shareMenuElement) {
        componentLog("Phần tử menu chia sẻ không tồn tại.", "warn");
        return;
    }
    const currentUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);
    const shares = [
        { text: "Facebook", icon: "fab fa-facebook-f", color: "text-blue-600", action: `window.open('https://www.facebook.com/sharer/sharer.php?u=${currentUrl}', '_blank', 'noopener,noreferrer')` },
        { text: "Twitter", icon: "fab fa-twitter", color: "text-sky-500", action: `window.open('https://twitter.com/intent/tweet?url=${currentUrl}&text=${pageTitle}', '_blank', 'noopener,noreferrer')` },
        { text: "Sao chép", icon: "fas fa-link", color: "text-gray-500", action: `navigator.clipboard.writeText(decodeURIComponent('${currentUrl}')).then(() => alert('Đã sao chép liên kết!'), () => alert('Không thể sao chép liên kết.'))` }
    ];
    let shareHtml = shares.map(share => `
        <button role="menuitem" class="fab-submenu-item group w-full" onclick="${share.action}">
            <i class="${share.icon} fa-fw ${share.color}"></i>
            <span>${share.text}</span>
        </button>`).join('');
    shareMenuElement.innerHTML = shareHtml;
}


/**
 * Khởi tạo các nút FAB (Floating Action Buttons).
 */
function initializeFabButtonsInternal() {
    if (window.componentState.fabInitialized) return;
    componentLog("Đang khởi tạo các nút FAB...");
    const fabContainer = document.getElementById('fab-container');
    if (!fabContainer) return;
    
    populateFabMenus();

    // Nút cuộn lên đầu trang
    const scrollToTopFab = document.getElementById('scroll-to-top-btn');
    if(scrollToTopFab) {
        window.addEventListener('scroll', debounce(() => {
            scrollToTopFab.classList.toggle('hidden', window.scrollY < 200);
        }, 100));
        scrollToTopFab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Các nút FAB có menu con
    fabContainer.querySelectorAll('button[aria-haspopup="true"]').forEach(btn => {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if(!menu) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyOpen = btn.getAttribute('aria-expanded') === 'true';
            // Đóng tất cả các menu khác trước
            fabContainer.querySelectorAll('[role="menu"]').forEach(m => {
                m.classList.add('hidden', 'opacity-0', 'scale-95');
                m.previousElementSibling.setAttribute('aria-expanded', 'false');
            });
            // Mở menu hiện tại nếu nó đang đóng
            if(!isCurrentlyOpen) {
                menu.classList.remove('hidden');
                setTimeout(() => menu.classList.remove('opacity-0', 'scale-95'), 10);
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
    // Đóng menu khi click ra ngoài
    document.addEventListener('click', () => {
         fabContainer.querySelectorAll('[role="menu"]').forEach(m => {
            m.classList.add('hidden', 'opacity-0', 'scale-95');
            m.previousElementSibling.setAttribute('aria-expanded', 'false');
        });
    });

    window.componentState.fabInitialized = true;
    componentLog("Các nút FAB đã được khởi tạo.");
}
window.initializeFabButtons = initializeFabButtonsInternal;

/**
 * Tải và khởi tạo các nút FAB.
 */
async function loadFabs() {
    const placeholder = document.getElementById('fab-container-placeholder');
    if(placeholder){
        const loaded = await loadComponent('FABs', 'fab-container-placeholder', '/components/fab-container.html');
        if (loaded) initializeFabButtonsInternal();
    }
}

/**
 * Hàm chính: Tải tất cả các thành phần chung theo trình tự.
 */
async function loadCommonComponents() {
    if (window.componentState.componentsLoadedAndInitialized) {
        componentLog('Các thành phần chung đã được tải.', 'info');
        return;
    }
    componentLog('Bắt đầu chuỗi tải các thành phần chung...');

    // Tải đồng thời Header, Footer, và FABs
    await Promise.all([
        loadHeader(),
        loadFooter(),
        loadFabs()
    ]);

    // Khởi tạo hệ thống ngôn ngữ sau khi các thành phần đã được tải
    if (typeof window.initializeLanguageSystem === 'function') {
        try {
            await window.initializeLanguageSystem();
            componentLog('Hệ thống ngôn ngữ đã khởi tạo.');
        } catch (langError) {
            componentLog(`Lỗi khởi tạo hệ thống ngôn ngữ: ${langError.message}`, 'error');
        }
    }

    window.componentState.componentsLoadedAndInitialized = true;
    componentLog('Chuỗi tải các thành phần chung đã hoàn tất.');

    // Gọi callback của trang nếu có
    if (typeof window.onPageComponentsLoadedCallback === 'function') {
        componentLog('Đang gọi onPageComponentsLoadedCallback của trang...');
        try {
            await window.onPageComponentsLoadedCallback();
        } catch (pageCallbackError) {
            componentLog(`Lỗi trong onPageComponentsLoadedCallback: ${pageCallbackError.message}`, 'error');
        }
    }
}

// Chạy hàm chính khi DOM đã sẵn sàng
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCommonComponents);
} else {
    loadCommonComponents();
}
