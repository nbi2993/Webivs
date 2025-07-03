/**
 * @fileoverview IVSFabController - Quản lý các chức năng của Floating Action Button (FAB).
 * Script này xử lý các nút cuộn lên đầu trang, tùy chọn liên hệ, tùy chọn chia sẻ và các menu con của chúng.
 * Nó phụ thuộc vào các hàm tiện ích toàn cục từ utils.js (componentLog, debounce).
 * @version 1.7 - Đã tối ưu hóa khởi tạo, loại bỏ JS/CSS nội tuyến khỏi HTML, và đồng bộ icon Zalo.
 * @author IVS-Technical-Team
 */

'use strict';

// Đảm bảo các hàm tiện ích toàn cục có sẵn (componentLog, debounce)
// Các hàm này được mong đợi sẽ được tải qua public/js/utils.js
if (typeof window.componentLog !== 'function') {
    console.error("[IVSFabController] window.componentLog không được định nghĩa. Vui lòng đảm bảo utils.js được tải trước fabController.js.");
    window.componentLog = (msg, level = 'error') => console[level](msg); // Hàm dự phòng
}
if (typeof window.debounce !== 'function') {
    console.error("[IVSFabController] window.debounce không được định nghĩa. Vui lòng đảm bảo utils.js được tải trước fabController.js.");
    window.debounce = (func) => func; // Hàm dự phòng
}

const IVSFabController = {
    /**
     * Khởi tạo bộ điều khiển FAB.
     * Lưu trữ các phần tử DOM, điền nội dung menu và gắn các trình lắng nghe sự kiện.
     */
    init() {
        window.componentLog("IVSFabController: Bắt đầu khởi tạo.", "info");
        this.cacheDOM();
        if (!this.fabContainer) {
            window.componentLog("IVSFabController: Không tìm thấy phần tử FAB container (#fab-container). Logic FAB sẽ không chạy.", "warn");
            return;
        }
        this.populateMenus();
        this.bindEvents();
        window.componentLog("IVSFabController: Khởi tạo hoàn tất.", "info");
    },

    /**
     * Lưu trữ các phần tử DOM cần thiết cho FAB.
     */
    cacheDOM() {
        this.fabContainer = document.getElementById('fab-container');
        this.scrollToTopBtn = document.getElementById('scroll-to-top-btn');
        // Sử dụng Optional Chaining (?) để tránh lỗi nếu fabContainer không tìm thấy
        this.buttonsWithSubmenu = this.fabContainer?.querySelectorAll('button[aria-haspopup="true"]') || [];

        window.componentLog(`IVSFabController: FAB Container: ${!!this.fabContainer}, ScrollToTopBtn: ${!!this.scrollToTopBtn}, ButtonsWithSubmenu count: ${this.buttonsWithSubmenu.length}`, 'info');
    },

    /**
     * Điền nội dung cho các menu con liên hệ và chia sẻ.
     */
    populateMenus() {
        const contactMenu = document.getElementById('contact-options');
        const shareMenu = document.getElementById('share-options');

        if (contactMenu) {
            this.populateContactOptions(contactMenu);
            window.componentLog("IVSFabController: Đã điền nội dung menu liên hệ.");
        }
        if (shareMenu) {
            this.populateShareOptions(shareMenu);
            window.componentLog("IVSFabController: Đã điền nội dung menu chia sẻ.");
        }
    },

    /**
     * Điền nội dung cho menu con tùy chọn liên hệ.
     * @param {HTMLElement} element Phần tử HTML để điền nội dung.
     */
    populateContactOptions(element) {
        const contacts = [
            { key: "fab_call_hotline", text: "Hotline", href: "tel:+84896920547", icon: "fas fa-phone", color: "text-orange-500" },
            { key: "fab_send_email", text: "Email", href: "mailto:info@ivsacademy.edu.vn", icon: "fas fa-envelope", color: "text-red-500" },
            // Đã đồng bộ icon Zalo với fas fa-comment-dots
            { key: "fab_chat_zalo", text: "Zalo", href: "https://zalo.me/ivsjsc", icon: "fas fa-comment-dots", color: "text-blue-500" }, 
            { key: "fab_fanpage_fb", text: "Facebook", href: "https://www.facebook.com/hr.ivsacademy/", icon: "fab fa-facebook-f", color: "text-blue-600" },
        ];
        element.innerHTML = contacts.map(c => `<a href="${c.href}" role="menuitem" class="fab-submenu-item group" data-lang-key="${c.key}" ${c.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}><i class="${c.icon} fa-fw ${c.color}"></i><span>${c.text}</span></a>`).join('');
    },

    /**
     * Điền nội dung cho menu con tùy chọn chia sẻ.
     * @param {HTMLElement} element Phần tử HTML để điền nội dung.
     */
    populateShareOptions(element) {
        const currentUrl = window.location.href;
        const pageTitle = document.title;

        const shares = [
            { text: "Facebook", icon: "fab fa-facebook-f", color: "text-blue-600", action: `window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}', '_blank', 'noopener,noreferrer')` },
            { text: "X (Twitter)", icon: "fab fa-x-twitter", color: "text-neutral-500", action: `window.open('https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(pageTitle)}', '_blank', 'noopener,noreferrer')` },
            { text: "LinkedIn", icon: "fab fa-linkedin", color: "text-blue-700", action: `window.open('https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(pageTitle)}', '_blank', 'noopener,noreferrer')` },
            {
                text: "Copy Link",
                icon: "fas fa-link",
                color: "text-gray-500",
                action: null // Hành động sẽ được xử lý qua trình lắng nghe sự kiện
            }
        ];
        element.innerHTML = shares.map((s, index) => {
            const btnId = `share-action-${index}`;
            return `<button id="${btnId}" role="menuitem" class="fab-submenu-item group w-full"><i class="${s.icon} fa-fw ${s.color}"></i><span>${s.text}</span></button>`;
        }).join('');

        shares.forEach((s, index) => {
            const btn = document.getElementById(`share-action-${index}`);
            if (btn) {
                if (s.text === "Copy Link") {
                    btn.addEventListener('click', () => {
                        try {
                            // Sử dụng document.execCommand('copy') để tương thích tốt hơn với iframe
                            const textarea = document.createElement('textarea');
                            textarea.value = currentUrl;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            window.componentLog('Đã sao chép liên kết vào clipboard!');
                            this.showCopiedConfirmation(btn); // Hiển thị thông báo xác nhận
                        } catch (err) {
                            window.componentLog('Không thể sao chép liên kết: ' + err, 'error');
                        }
                    });
                } else if (s.action) {
                    btn.addEventListener('click', () => eval(s.action)); // Thực thi chuỗi hành động
                }
            }
        });
    },

    /**
     * Hiển thị thông báo xác nhận "Đã sao chép!" tạm thời gần phần tử mục tiêu.
     * @param {HTMLElement} targetElement Phần tử gần đó để hiển thị thông báo.
     */
    showCopiedConfirmation(targetElement) {
        const message = 'Đã sao chép!';
        const confirmationDiv = document.createElement('div');
        confirmationDiv.textContent = message;
        confirmationDiv.className = 'absolute z-10 bg-black text-white text-xs px-2 py-1 rounded-md shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none whitespace-nowrap';

        // Định vị tương đối với nút mục tiêu
        const rect = targetElement.getBoundingClientRect();
        confirmationDiv.style.top = `${rect.top - 30}px`; // Phía trên nút
        confirmationDiv.style.left = `${rect.left + rect.width / 2}px`; // Căn giữa theo chiều ngang
        confirmationDiv.style.transform = 'translateX(-50%)';

        document.body.appendChild(confirmationDiv);

        // Hiển thị dần
        setTimeout(() => {
            confirmationDiv.classList.remove('opacity-0');
            confirmationDiv.classList.add('opacity-100');
        }, 10);

        // Ẩn dần và xóa
        setTimeout(() => {
            confirmationDiv.classList.remove('opacity-100');
            confirmationDiv.classList.add('opacity-0');
            confirmationDiv.addEventListener('transitionend', () => {
                confirmationDiv.remove();
            }, { once: true });
        }, 1500); // Hiển thị trong 1.5 giây
    },

    /**
     * Gắn các trình lắng nghe sự kiện cho nút cuộn lên đầu trang và các nút bật/tắt menu con.
     */
    bindEvents() {
        if (this.scrollToTopBtn) {
            const handleScroll = () => {
                if (window.scrollY > 200) { // Sử dụng window.scrollY để nhất quán
                    this.scrollToTopBtn.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
                } else {
                    this.scrollToTopBtn.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
                }
            };
            window.addEventListener('scroll', window.debounce(handleScroll, 100), { passive: true });
            this.scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            handleScroll(); // Kiểm tra ban đầu khi tải trang
            window.componentLog("IVSFabController: Đã gắn sự kiện cho nút cuộn lên đầu trang.");
        }

        if (this.buttonsWithSubmenu && this.buttonsWithSubmenu.forEach) {
            this.buttonsWithSubmenu.forEach(btn => btn.addEventListener('click', e => {
                e.stopPropagation(); // Ngăn sự kiện click vào document đóng ngay lập tức
                this.toggleSubmenu(btn);
            }));
            window.componentLog("IVSFabController: Đã gắn sự kiện click cho các nút có submenu.");
        }

        document.addEventListener('click', (e) => {
            if (this.fabContainer && !this.fabContainer.contains(e.target)) {
                if (this.buttonsWithSubmenu && this.buttonsWithSubmenu.forEach) {
                    this.buttonsWithSubmenu.forEach(btn => this.closeSubmenu(btn));
                }
            }
        });
        window.componentLog("IVSFabController: Đã gắn sự kiện click toàn cục để đóng submenu FAB.");
    },

    /**
     * Bật/tắt hiển thị của một menu con.
     * @param {HTMLElement} btn Nút điều khiển menu con.
     */
    toggleSubmenu(btn) {
        const isCurrentlyOpen = btn.getAttribute('aria-expanded') === 'true';
        if (this.buttonsWithSubmenu && this.buttonsWithSubmenu.forEach) {
            this.buttonsWithSubmenu.forEach(otherBtn => {
                if (otherBtn !== btn) {
                    this.closeSubmenu(otherBtn); // Đóng các menu con khác
                }
            });
        }
        if (!isCurrentlyOpen) this.openSubmenu(btn);
        else this.closeSubmenu(btn);
    },

    /**
     * Mở một menu con cụ thể.
     * @param {HTMLElement} btn Nút có menu con cần mở.
     */
    openSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.remove('hidden', 'pointer-events-none');
        // Sử dụng rAF để hiển thị ngay lập tức trước khi chuyển đổi
        requestAnimationFrame(() => {
            menu.classList.remove('opacity-0', 'scale-95', 'translate-y-2'); // Đã thêm lại translate-y-2 cho animation mở
        });
        btn.setAttribute('aria-expanded', 'true');
        window.componentLog(`IVSFabController: Đã mở submenu cho nút: ${btn.id}`);
    },

    /**
     * Đóng một menu con cụ thể.
     * @param {HTMLElement} btn Nút có menu con cần đóng.
     */
    closeSubmenu(btn) {
        const menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (!menu) return;
        menu.classList.add('opacity-0', 'scale-95', 'translate-y-2'); // Đã thêm lại translate-y-2 cho animation đóng
        const onTransitionEnd = () => {
            if (menu.classList.contains('opacity-0')) {
                menu.classList.add('hidden', 'pointer-events-none');
            }
            menu.removeEventListener('transitionend', onTransitionEnd);
        };
        menu.addEventListener('transitionend', onTransitionEnd);
        btn.setAttribute('aria-expanded', 'false');
        window.componentLog(`IVSFabController: Đã đóng submenu cho nút: ${btn.id}`);
    },
};

// Xuất IVSFabController để loadComponents.js có thể truy cập
window.IVSFabController = IVSFabController;

// Tự động khởi tạo bộ điều khiển FAB khi DOM được tải hoàn toàn.
// Điều này đảm bảo FAB được thiết lập ngay cả khi loadComponents.js không gọi init một cách rõ ràng,
// hoặc nếu fab-container được bao gồm trực tiếp trong một trang.
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra xem phần tử fabContainer có tồn tại trước khi khởi tạo
    if (document.getElementById('fab-container')) {
        IVSFabController.init();
    } else {
        // Nếu fab-container không có sẵn ngay lập tức, nó có thể được tải động.
        // Trong trường hợp đó, loadComponents.js (hoặc tương tự) nên gọi IVSFabController.init() một cách rõ ràng
        // sau khi chèn nội dung fab-container.html.
        window.componentLog("IVSFabController: Không tìm thấy FAB container trên DOMContentLoaded. Giả định tải động. Đảm bảo init() được gọi thủ công sau khi chèn.", "warn");
    }
});
