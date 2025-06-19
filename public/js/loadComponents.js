'use strict';

window.componentState = window.componentState || {
    componentsLoadedAndInitialized: false,
    headerInitialized: false,
    fabInitialized: false,
    footerInitialized: false,
    headerElement: null,
    isMobileMenuOpen: false,
};

function componentLog(message, type = 'log') {
    const debugMode = true;
    if (debugMode || type === 'error' || type === 'warn') {
        console[type](`[IVS Components] ${message}`);
    }
}

function isMobileDevice() {
    return window.innerWidth < 768;
}

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

        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenuBottomToggle = document.getElementById('mobile-menu-bottom-toggle');
        const mobileMenuPanel = document.getElementById('mobile-menu-panel');
        const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
        const mobileMenuContainer = mobileMenuPanel ? mobileMenuPanel.querySelector('#mobile-menu-container') : null;
        const mobileMenuCloseBtn = mobileMenuPanel ? mobileMenuPanel.querySelector('#mobile-menu-close-btn') : null;
        const iconOpen = mobileMenuButton ? mobileMenuButton.querySelector('.icon-menu-open') : null;
        const iconClose = mobileMenuButton ? mobileMenuButton.querySelector('.icon-menu-close') : null;

        if (!mobileMenuButton || !mobileMenuPanel || !mobileMenuBackdrop || !mobileMenuContainer || !mobileMenuCloseBtn || !iconOpen || !iconClose) {
            componentLog('Một số phần tử của menu mobile bị thiếu. Chức năng điều hướng có thể bị ảnh hưởng.', 'warn');
        } else {
            const toggleMobileMenu = (forceClose = false) => {
                const isOpen = mobileMenuPanel.classList.contains('active');
                if (forceClose || isOpen) {
                    if (!window.componentState.isMobileMenuOpen && !forceClose) return;
                    window.componentState.isMobileMenuOpen = false;
                    mobileMenuPanel.classList.remove('active');
                    setTimeout(() => { mobileMenuPanel.classList.add('hidden'); }, 300);
                    if (iconOpen) iconOpen.classList.remove('hidden');
                    if (iconClose) iconClose.classList.add('hidden');
                    document.body.style.overflow = '';
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                    componentLog('Menu mobile đã đóng.');
                } else {
                    if (window.componentState.isMobileMenuOpen) return;
                    window.componentState.isMobileMenuOpen = true;
                    mobileMenuPanel.classList.remove('hidden');
                    requestAnimationFrame(() => {
                        mobileMenuPanel.classList.add('active');
                    });
                    if (iconOpen) iconOpen.classList.add('hidden');
                    if (iconClose) iconClose.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                    mobileMenuButton.setAttribute('aria-expanded', 'true');
                    componentLog('Menu mobile đã mở.');
                }
            };

            mobileMenuButton.addEventListener('click', () => toggleMobileMenu());
            mobileMenuBackdrop.addEventListener('click', () => toggleMobileMenu(true));
            mobileMenuCloseBtn.addEventListener('click', () => toggleMobileMenu(true));
            if (mobileMenuBottomToggle) {
                mobileMenuBottomToggle.addEventListener('click', () => toggleMobileMenu());
                componentLog('Đã gán sự kiện cho nút menu ở bottom bar.');
            }

            mobileMenuContainer.querySelectorAll('a:not(.mobile-submenu-toggle), button:not(.mobile-submenu-toggle)').forEach(link => {
                link.addEventListener('click', (e) => {
                    if (!link.closest('.mobile-submenu-toggle')) {
                        if (!e.target.closest('.mobile-submenu-content.expanded')) {
                            toggleMobileMenu(true);
                        }
                    }
                });
            });

            mobileMenuContainer.querySelectorAll('.mobile-submenu-toggle').forEach(toggle => {
                const submenuId = toggle.getAttribute('aria-controls');
                const submenu = document.getElementById(submenuId);
                const icon = toggle.querySelector('.mobile-submenu-icon');
                if (submenu) {
                    submenu.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding-bottom 0.3s ease-in-out';
                    submenu.style.maxHeight = '0px';
                    submenu.style.opacity = '0';
                    submenu.style.overflow = 'hidden';
                    submenu.classList.remove('expanded');
                    submenu.style.paddingBottom = '0';


                    toggle.addEventListener('click', () => {
                        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                        toggle.setAttribute('aria-expanded', String(!isExpanded));
                        if (!isExpanded) {
                            submenu.style.maxHeight = submenu.scrollHeight + "px";
                            submenu.style.opacity = '1';
                            submenu.style.paddingBottom = '0.25rem';
                            if (icon) icon.style.transform = 'rotate(90deg)';
                            submenu.classList.add('expanded');
                        } else {
                            submenu.style.maxHeight = '0px';
                            submenu.style.opacity = '0';
                            submenu.style.paddingBottom = '0';
                            if (icon) icon.style.transform = 'rotate(0deg)';
                            submenu.classList.remove('expanded');
                        }
                    });
                }
            });
        }

        let lastScrollTop = 0;
        const scrollThreshold = 80;
        const handleScroll = () => {
            if (!window.componentState.headerElement) return;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (!isMobileDevice()) {
                if (scrollTop < lastScrollTop || scrollTop <= scrollThreshold) {
                    window.componentState.headerElement.classList.remove('header-hidden');
                } else if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
                    window.componentState.headerElement.classList.add('header-hidden');
                }
            } else {
                window.componentState.headerElement.classList.remove('header-hidden');
            }

            const bottomNavBar = document.getElementById('bottom-nav-bar');
            if (isMobileDevice() && bottomNavBar) {
                if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
                    bottomNavBar.classList.add('bottom-nav-hidden');
                } else {
                    bottomNavBar.classList.remove('bottom-nav-hidden');
                }
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        };
        const debouncedScroll = debounce(handleScroll, 50);
        window.addEventListener('scroll', debouncedScroll, { passive: true });
        handleScroll();


        const updateHeaderHeightVar = () => {
            if (window.componentState.headerElement) {
                const wasHidden = window.componentState.headerElement.classList.contains('header-hidden');
                if(wasHidden) window.componentState.headerElement.classList.remove('header-hidden');
                const height = window.componentState.headerElement.offsetHeight;
                if(wasHidden) window.componentState.headerElement.classList.add('header-hidden');
                if (height > 0) {
                    document.documentElement.style.setProperty('--header-actual-height', `${height}px`);
                    const placeholder = document.getElementById('header-placeholder');
                    if (placeholder) {
                         placeholder.style.minHeight = `${height}px`;
                         placeholder.style.height = `${height}px`;
                    }
                }
            }
        };


        if (window.ResizeObserver && window.componentState.headerElement) {
            new ResizeObserver(debounce(updateHeaderHeightVar, 50)).observe(window.componentState.headerElement);
        } else {
            window.addEventListener('resize', debounce(updateHeaderHeightVar, 200));
        }
        updateHeaderHeightVar();
        setTimeout(updateHeaderHeightVar, 150);


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
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
                    closeMenu(0);
                    button.focus();
                }
            });
        });

        const setActiveBottomNavItem = () => {
            const bottomNav = document.getElementById('bottom-nav-bar');
            if (!bottomNav || !isMobileDevice()) return;

            const currentPath = window.location.pathname;
            const navItems = bottomNav.querySelectorAll('.bottom-nav-item');
            let hasActive = false;

            navItems.forEach(item => {
                const itemPath = item.getAttribute('href');
                item.classList.remove('active-bottom-nav');
                if (itemPath && (currentPath === itemPath || (itemPath !== '/' && currentPath.startsWith(itemPath)))) {
                     item.classList.add('active-bottom-nav');
                     hasActive = true;
                }
            });
            
            if (!hasActive && (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.endsWith('/index'))) {
                 const homeItem = bottomNav.querySelector('a[href="/index.html"]');
                 if(homeItem) homeItem.classList.add('active-bottom-nav');
            }
        };
        setActiveBottomNavItem();
        window.addEventListener('popstate', setActiveBottomNavItem);


        window.componentState.headerInitialized = true;
        componentLog('Header đã được khởi tạo thành công.');
    } catch (error) {
        componentLog(`Lỗi khởi tạo header: ${error.message}`, 'error');
        window.componentState.headerInitialized = false;
    }
}
window.initializeHeader = initializeHeaderInternal;

async function loadHeader(basePath = '/components/') {
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) {
        componentLog('Placeholder của Header không tìm thấy.', 'error');
        return false;
    }
    placeholder.setAttribute('aria-busy', 'true');
    try {
        const filePath = `/components/header.html`;
        const loaded = await loadComponent('Header', 'header-placeholder', filePath);
        if (!loaded) throw new Error('Nội dung HTML của Header không tải được.');

        if (typeof initializeHeaderInternal === 'function') {
            initializeHeaderInternal();
        } else {
            componentLog('Hàm initializeHeaderInternal không tồn tại.', 'error');
        }

        placeholder.setAttribute('aria-busy', 'false');
        componentLog('Header đã được tải và khởi tạo.');
        return true;
    } catch (error) {
        componentLog(`Không thể tải và khởi tạo header: ${error.message}`, 'error');
        if (placeholder) placeholder.innerHTML = `<div class="p-3 text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-md">Lỗi tải header.</div>`;
        placeholder.setAttribute('aria-busy', 'false');
        return false;
    }
}

function initializeFooterInternal() {
    if (window.componentState.footerInitialized) {
        componentLog('Footer đã được khởi tạo trước đó.', 'warn');
        return;
    }
    componentLog("Bắt đầu khởi tạo Footer...");
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        const newsletterMessage = document.getElementById('newsletterMessage');
        newsletterForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const emailInput = newsletterForm.querySelector('input[name="email"]');
            if (!emailInput || !emailInput.value.trim()) {
                if (newsletterMessage) {
                    newsletterMessage.textContent = 'Vui lòng nhập địa chỉ email hợp lệ.';
                    newsletterMessage.className = 'mt-2 text-sm text-ivs-danger dark:text-ivs-danger';
                } return;
            }
            if (newsletterMessage) {
                newsletterMessage.textContent = 'Cảm ơn bạn đã đăng ký!';
                newsletterMessage.className = 'mt-2 text-sm text-ivs-success dark:text-ivs-success';
                newsletterForm.reset();
                setTimeout(() => { newsletterMessage.textContent = ''; }, 3000);
            }
        });
    }
    window.componentState.footerInitialized = true;
    componentLog("Footer đã được khởi tạo.");
}
window.initializeFooter = initializeFooterInternal;


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

    let contactHtml = '';
    contacts.forEach(contact => {
        contactHtml += `
            <a href="${contact.href}"
               role="menuitem"
               class="fab-submenu-item group"
               data-lang-key="${contact.key}"
               ${contact.href.startsWith('http') || contact.href.startsWith('https://zalo.me') ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                <i class="${contact.icon} fa-fw ${contact.color} group-hover:${contact.color.replace('-500', '-600').replace('-accent', '-accent-dark')}"></i>
                <span>${contact.text}</span>
            </a>
        `;
    });
    contactMenuElement.innerHTML = contactHtml;

    if (typeof window.applyTranslations === 'function' && window.langSystem && window.langSystem.initialized) {
        window.applyTranslations(contactMenuElement);
    } else if (typeof window.applyLanguage === 'function' && window.langSystem && window.langSystem.initialized) {
        window.applyLanguage(contactMenuElement);
    }
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
        { text: "Sao chép", icon: "fas fa-link", color: "text-gray-500", action: `navigator.clipboard.writeText(decodeURIComponent('${currentUrl}')).then(() => { if(typeof showAppModal === 'function') showAppModal('Thành công', 'Đã sao chép liên kết!', 'success', {showConfirm:true, confirmText:'OK'}); else alert('Đã sao chép liên kết!'); }, () => { if(typeof showAppModal === 'function') showAppModal('Lỗi', 'Không thể sao chép liên kết.', 'error', {showConfirm:true, confirmText:'OK'}); else alert('Không thể sao chép liên kết.');})` }
    ];

    let shareHtml = '';
    shares.forEach(share => {
        shareHtml += `
            <button role="menuitem" class="fab-submenu-item group w-full" onclick="${share.action}">
                <i class="${share.icon} fa-fw ${share.color} group-hover:${share.color.replace('-500', '-600').replace('-600', '-700')}"></i>
                <span>${share.text}</span>
            </button>
        `;
    });
    shareMenuElement.innerHTML = shareHtml;
}


function initializeFabButtonsInternal() {
    if (window.componentState.fabInitialized) {
        componentLog('FABs đã được khởi tạo.', 'warn');
        return;
    }
    componentLog("Đang khởi tạo các nút FAB...");
    const fabContainerHost = document.getElementById('fab-container-placeholder');
    if (!fabContainerHost) {
        componentLog("Placeholder FAB (#fab-container-placeholder) không tìm thấy.", 'error');
        return;
    }

    const fabContainer = fabContainerHost.querySelector('#fab-container');
    if (!fabContainer) {
        componentLog("#fab-container không tìm thấy trong placeholder. Đảm bảo fab-container.html được tải.", "error");
        return;
    }

    const scrollToTopFab = fabContainer.querySelector('#scroll-to-top-btn');
    if (scrollToTopFab) {
        const fabScrollHandler = debounce(() => {
            const isVisible = window.scrollY > (isMobileDevice() ? 180 : 100);
            scrollToTopFab.classList.toggle('hidden', !isVisible);
            scrollToTopFab.classList.toggle('opacity-0', !isVisible);
            scrollToTopFab.classList.toggle('scale-90', !isVisible);
            scrollToTopFab.classList.toggle('pointer-events-none', !isVisible);

            scrollToTopFab.classList.toggle('opacity-100', isVisible);
            scrollToTopFab.classList.toggle('scale-100', isVisible);
            scrollToTopFab.classList.toggle('pointer-events-auto', isVisible);
        }, 100);
        window.addEventListener('scroll', fabScrollHandler, { passive: true });
        fabScrollHandler();
        scrollToTopFab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        componentLog('Nút cuộn lên đầu trang đã khởi tạo.');
    } else { componentLog('Nút #scroll-to-top-btn không tìm thấy.', 'warn'); }

    const fabButtonsWithSubmenu = fabContainer.querySelectorAll('button[aria-haspopup="true"]');
    fabButtonsWithSubmenu.forEach(btn => {
        const menuId = btn.getAttribute('aria-controls');
        const menu = fabContainer.querySelector(`#${menuId}`);
        if (menu) {
            if (menuId === 'contact-options') {
                populateContactOptions(menu);
                componentLog('Đã điền nội dung cho menu liên hệ.');
            } else if (menuId === 'share-options') {
                populateShareOptions(menu);
                componentLog('Đã điền nội dung cho menu chia sẻ.');
            }

            const openFabMenu = () => {
                menu.classList.remove('hidden');
                requestAnimationFrame(() => {
                    ['opacity-0', 'scale-95', 'pointer-events-none'].forEach(cls => menu.classList.remove(cls));
                    ['opacity-100', 'scale-100', 'pointer-events-auto'].forEach(cls => menu.classList.add(cls));
                });
                btn.setAttribute('aria-expanded', 'true');
                componentLog(`Menu FAB '${menuId}' đã mở.`);
            };

            const closeFabMenu = () => {
                ['opacity-100', 'scale-100', 'pointer-events-auto'].forEach(cls => menu.classList.remove(cls));
                ['opacity-0', 'scale-95', 'pointer-events-none'].forEach(cls => menu.classList.add(cls));

                const handleTransitionEnd = () => {
                    if (menu.classList.contains('opacity-0')) {
                        menu.classList.add('hidden');
                    }
                    menu.removeEventListener('transitionend', handleTransitionEnd);
                };
                menu.addEventListener('transitionend', handleTransitionEnd, { once: true });
                btn.setAttribute('aria-expanded', 'false');
                componentLog(`Menu FAB '${menuId}' đã đóng.`);
            };

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCurrentlyOpen = btn.getAttribute('aria-expanded') === 'true';

                fabButtonsWithSubmenu.forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        const otherMenuId = otherBtn.getAttribute('aria-controls');
                        const otherMenu = fabContainer.querySelector(`#${otherMenuId}`);
                        if (otherMenu && otherBtn.getAttribute('aria-expanded') === 'true') {
                            ['opacity-100', 'scale-100', 'pointer-events-auto'].forEach(cls => otherMenu.classList.remove(cls));
                            ['opacity-0', 'scale-95', 'pointer-events-none'].forEach(cls => otherMenu.classList.add(cls));
                            const handleOtherTransitionEnd = () => {
                                if (otherMenu.classList.contains('opacity-0')) {
                                    otherMenu.classList.add('hidden');
                                }
                                otherMenu.removeEventListener('transitionend', handleOtherTransitionEnd);
                            };
                            otherMenu.addEventListener('transitionend', handleOtherTransitionEnd, { once: true });
                            otherBtn.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                if (isCurrentlyOpen) {
                    closeFabMenu();
                } else {
                    openFabMenu();
                }
            });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
                    closeFabMenu();
                    btn.focus();
                }
            });
        } else {
            componentLog(`Không tìm thấy menu con #${menuId} cho nút FAB.`, 'warn');
        }
    });

    document.addEventListener('click', (e) => {
        if (fabContainer && !fabContainer.contains(e.target)) {
            fabButtonsWithSubmenu.forEach(btn => {
                const menu = fabContainer.querySelector(`#${btn.getAttribute('aria-controls')}`);
                if (menu && btn.getAttribute('aria-expanded') === 'true') {
                    ['opacity-100', 'scale-100', 'pointer-events-auto'].forEach(cls => menu.classList.remove(cls));
                    ['opacity-0', 'scale-95', 'pointer-events-none'].forEach(cls => menu.classList.add(cls));
                    const handleDocClickTransitionEnd = () => {
                        if (menu.classList.contains('opacity-0')) {
                            menu.classList.add('hidden');
                        }
                        menu.removeEventListener('transitionend', handleDocClickTransitionEnd);
                    };
                    menu.addEventListener('transitionend', handleDocClickTransitionEnd, { once: true });
                    btn.setAttribute('aria-expanded', 'false');
                }
            });
        }
    });

    window.componentState.fabInitialized = true;
    componentLog("Các nút FAB đã được khởi tạo với nội dung động.");
}
window.initializeFabButtons = initializeFabButtonsInternal;

async function loadCommonComponents() {
    if (window.componentState.componentsLoadedAndInitialized) {
        componentLog('Các thành phần chung đã được tải và khởi tạo.', 'info');
        return;
    }
    componentLog('Bắt đầu chuỗi tải các thành phần chung...');

    // ĐỊNH NGHĨA ĐƯỜNG DẪN CƠ SỞ. Sử dụng './' để đảm bảo tính tương đối.
    // Nếu tệp HTML (vd: about.html) nằm trong 1 thư mục con, anh có thể đổi thành '../components/'
    const basePath = './components/';
    
    const headerLoaded = await loadHeader(basePath);

    if (headerLoaded && window.componentState.headerInitialized) {
        if (typeof window.initializeLanguageSystem === 'function') {
            try {
                await window.initializeLanguageSystem();
                componentLog('Hệ thống ngôn ngữ đã khởi tạo sau header.');
            } catch (langError) { componentLog(`Lỗi khởi tạo hệ thống ngôn ngữ: ${langError.message}`, 'error'); }
        } else {
            componentLog('Hàm initializeLanguageSystem không tồn tại. Thử fallback.', 'warn');
            if (typeof window.applyTranslations === 'function') {
                try { window.applyTranslations(document.documentElement); } catch (e) { componentLog('Lỗi gọi applyTranslations fallback: ' + e.message, 'error'); }
            } else if (typeof window.applyLanguage === 'function') {
                try { window.applyLanguage(document.documentElement); } catch (e) { componentLog('Lỗi gọi applyLanguage fallback: ' + e.message, 'error'); }
            } else {
                componentLog('Không tìm thấy hàm initializeLanguageSystem, applyTranslations, hoặc applyLanguage.', 'error');
            }
        }
    } else {
        componentLog('Header không tải/khởi tạo thành công. Hệ thống ngôn ngữ có thể không hoạt động đúng.', 'error');
        if (typeof window.initializeLanguageSystem === 'function') {
            try { await window.initializeLanguage-system(); } catch (e) { componentLog('Lỗi khởi tạo ngôn ngữ (fallback khi header lỗi): ' + e.message, 'error'); }
        }
    }

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        const footerFilePath = `/components/footer.html`;
        const footerLoaded = await loadComponent('Footer', 'footer-placeholder', footerFilePath);
        if (footerLoaded && typeof initializeFooterInternal === 'function') {
            initializeFooterInternal();
        }
        else if (footerLoaded) {
            componentLog("initializeFooterInternal không tìm thấy sau khi tải footer.", "warn");
        }
    } else { componentLog('Placeholder Footer không tìm thấy.', 'info'); }

    const fabPlaceholder = document.getElementById('fab-container-placeholder');
    if (fabPlaceholder) {
        const fabFilePath = `/components/fab-container.html`;
        const fabLoaded = await loadComponent('FABs', 'fab-container-placeholder', fabFilePath);
        if (fabLoaded && typeof initializeFabButtonsInternal === 'function') {
            initializeFabButtonsInternal();
        } else if (fabLoaded) {
            componentLog('initializeFabButtonsInternal không tìm thấy sau khi tải FABs.', 'warn');
        } else {
            componentLog(`Không tải được ${fabFilePath}.`, 'error');
        }
    } else { componentLog('Placeholder FAB không tìm thấy.', 'info'); }

    window.componentState.componentsLoadedAndInitialized = true;
    componentLog('Chuỗi tải các thành phần chung đã hoàn tất.');

    if (typeof window.onPageComponentsLoadedCallback === 'function') {
        componentLog('Đang gọi onPageComponentsLoadedCallback của trang...');
        try {
            await new Promise(resolve => setTimeout(resolve, 0));
            await window.onPageComponentsLoadedCallback();
        } catch (pageCallbackError) {
            componentLog(`Lỗi trong onPageComponentsLoadedCallback: ${pageCallbackError.message}`, 'error');
        }
    } else {
        componentLog('Không tìm thấy onPageComponentsLoadedCallback của trang.', 'info');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCommonComponents);
} else {
    if (!window.componentState.componentsLoadedAndInitialized) {
        loadCommonComponents();
    }
}
