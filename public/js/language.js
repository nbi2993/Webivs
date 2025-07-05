/**
 * IVS Language System - Tối ưu hóa và Nâng cao
 * Phiên bản: 3.5 - Giữ nguyên chức năng cốt lõi, tăng cường độ ổn định và xử lý lỗi.
 * Mô tả: Script này quản lý toàn bộ chức năng đa ngôn ngữ, tương thích hoàn toàn
 * với cấu trúc file và thuộc tính `data-lang-key` hiện có của hệ thống.
 * Tích hợp: Giữ nguyên cách tích hợp hiện tại trong các trang HTML.
 */
'use strict';

// 1. CẤU HÌNH & TRẠNG THÁI TOÀN CỤC (KHÔNG THAY ĐỔI)
window.langSystem = window.langSystem || {
    translations: {},
    defaultLanguage: 'vi',
    currentLanguage: 'vi',
    languageStorageKey: 'userPreferredLanguage_v3',
    languageFilesPath: '/lang/',
    isDebugMode: true,
    initialized: false,
};

// 2. HÀM TIỆN ÍCH (Sử dụng componentLog từ utils.js)
// Giữ nguyên, không thay đổi.

// 3. LOGIC CỐT LÕI (ĐƯỢC TỐI ƯU HÓA)

/**
 * Lấy dữ liệu dịch thuật cho một ngôn ngữ.
 * Tối ưu hóa: Thêm cơ chế cache và xử lý lỗi mạng chi tiết hơn.
 * @param {string} langCode - Mã ngôn ngữ (vd: 'vi', 'en').
 * @returns {Promise<object|null>} - Trả về đối tượng dịch thuật hoặc null nếu lỗi.
 */
async function fetchTranslations(langCode) {
    // Nếu đã có trong cache, trả về ngay lập tức.
    if (window.langSystem.translations[langCode]) {
        window.componentLog(`Translations for '${langCode}' loaded from cache.`, 'info');
        return window.langSystem.translations[langCode];
    }

    const filePath = `${window.langSystem.languageFilesPath}${langCode}.json?v=${new Date().getTime()}`;
    window.componentLog(`Fetching translations for: '${langCode}' from ${filePath}`);

    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            // Ném lỗi cụ thể hơn để dễ dàng gỡ lỗi.
            throw new Error(`Failed to load language file. Status: ${response.status} - ${response.statusText}. URL: ${response.url}`);
        }

        const data = await response.json();
        window.langSystem.translations[langCode] = data; // Lưu vào cache
        window.componentLog(`Successfully loaded and parsed translations for '${langCode}'. Keys: ${Object.keys(data).length}`);
        return data;

    } catch (error) {
        window.componentLog(`Failed to fetch or parse translations for '${langCode}': ${error.message}`, 'error');
        return null; // Trả về null khi có lỗi.
    }
}

/**
 * Áp dụng các bản dịch lên giao diện người dùng.
 * Tối ưu hóa: Thêm cơ chế fallback về ngôn ngữ mặc định một cách an toàn hơn.
 */
function applyTranslations() {
    const lang = window.langSystem.currentLanguage;
    const defaultLang = window.langSystem.defaultLanguage;

    // Ưu tiên ngôn ngữ hiện tại, nếu không có thì dùng ngôn ngữ mặc định.
    const translations = window.langSystem.translations[lang] || window.langSystem.translations[defaultLang];

    if (!translations) {
        window.componentLog(`CRITICAL: No translations available for current ('${lang}') or default ('${defaultLang}') language. DOM update skipped.`, 'error');
        return;
    }

    window.componentLog(`Applying translations for '${lang}'.`, 'group');
    document.documentElement.lang = lang;

    let translatedElementsCount = 0;
    let missingKeys = [];

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        let translation = translations[key];

        // Nếu không tìm thấy key trong ngôn ngữ hiện tại, thử tìm trong ngôn ngữ mặc định.
        if (translation === undefined && lang !== defaultLang) {
            const defaultTranslations = window.langSystem.translations[defaultLang];
            if (defaultTranslations && defaultTranslations[key] !== undefined) {
                translation = defaultTranslations[key];
                 if(window.langSystem.isDebugMode) {
                    el.style.outline = '1px dashed orange'; // Đánh dấu phần tử dùng fallback
                    el.title = `Fallback: '${key}' from default language '${defaultLang}'`;
                }
            }
        }

        if (translation !== undefined) {
            const targetAttr = el.dataset.langTarget || 'textContent';
            try {
                if (targetAttr === 'textContent') {
                    el.textContent = translation;
                } else if (targetAttr === 'innerHTML') {
                    el.innerHTML = translation; // Giữ nguyên để tương thích chức năng cũ
                } else {
                    el.setAttribute(targetAttr, translation);
                }
                translatedElementsCount++;
            } catch (e) {
                window.componentLog(`Error applying translation for key '${key}': ${e.message}`, 'error');
            }
        } else {
            missingKeys.push(key);
            if(window.langSystem.isDebugMode) {
                el.style.outline = '1px dashed red'; // Đánh dấu key bị thiếu
                el.title = `Missing translation key: '${key}'`;
            }
        }
    });

    if (missingKeys.length > 0) {
        window.componentLog(`Translation keys not found for '${lang}': [${missingKeys.join(', ')}]`, 'warn');
    }
    window.componentLog(`Finished applying translations. ${translatedElementsCount} elements updated.`);
    console.groupEnd();
}


/**
 * Thiết lập và chuyển đổi ngôn ngữ cho toàn bộ trang.
 * Tối ưu hóa: Hợp nhất logic từ `setLanguage` và `changeLanguage` cũ thành một hàm duy nhất, mạnh mẽ hơn.
 * @param {string} langCode - Mã ngôn ngữ để chuyển đổi (vd: 'vi', 'en').
 */
async function setLanguage(langCode) {
    window.componentLog(`Request to set language to: '${langCode}'`, 'group');

    // 1. Xác thực ngôn ngữ đầu vào
    const supportedLanguages = ['vi', 'en']; // Có thể mở rộng sau
    if (!supportedLanguages.includes(langCode)) {
        window.componentLog(`Invalid language code '${langCode}'. Falling back to default '${window.langSystem.defaultLanguage}'.`, 'warn');
        langCode = window.langSystem.defaultLanguage;
    }

    // 2. Tải bản dịch (nếu cần)
    await fetchTranslations(langCode);

    // 3. Kiểm tra lại sau khi tải, nếu thất bại thì dùng ngôn ngữ mặc định
    if (!window.langSystem.translations[langCode]) {
        window.componentLog(`Failed to load '${langCode}', ensuring default '${window.langSystem.defaultLanguage}' is active.`, 'warn');
        langCode = window.langSystem.defaultLanguage;
        // Đảm bảo ngôn ngữ mặc định đã được tải
        if (!window.langSystem.translations[langCode]) {
            await fetchTranslations(langCode);
        }
    }

    // Kiểm tra cuối cùng trước khi áp dụng
    if (!window.langSystem.translations[langCode]) {
        window.componentLog('CRITICAL: Default language pack could not be loaded. Language system cannot function.', 'error');
        console.groupEnd();
        return;
    }

    // 4. Cập nhật trạng thái hệ thống
    window.langSystem.currentLanguage = langCode;
    localStorage.setItem(window.langSystem.languageStorageKey, langCode);

    // 5. Áp dụng lên giao diện
    applyTranslations();

    // 6. Cập nhật UI của các nút chuyển ngôn ngữ (nếu có)
    if (window.IVSHeaderController && typeof window.IVSHeaderController.updateLanguageButtonStates === 'function') {
        window.IVSHeaderController.updateLanguageButtonStates(langCode);
        window.componentLog('Notified IVSHeaderController to update UI.');
    }
    
    window.componentLog(`Language successfully set to: '${window.langSystem.currentLanguage}'.`);
    console.groupEnd();
}


// 4. KHỞI TẠO HỆ THỐNG (Tối ưu hóa)
async function initializeLanguageSystem() {
    if (window.langSystem.initialized) {
        window.componentLog('Language system already initialized.', 'info');
        return;
    }
    window.componentLog('Initializing Language System...', 'group');

    // Ưu tiên ngôn ngữ đã lưu, sau đó đến ngôn ngữ trình duyệt, cuối cùng là mặc định.
    const savedLang = localStorage.getItem(window.langSystem.languageStorageKey);
    const browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
    const initialLang = savedLang || browserLang || window.langSystem.defaultLanguage;

    window.componentLog(`Determined initial language: '${initialLang}' (Saved: ${savedLang}, Browser: ${browserLang})`);

    // Luôn tải ngôn ngữ mặc định trước để đảm bảo có fallback
    await fetchTranslations(window.langSystem.defaultLanguage);
    
    // Tải và thiết lập ngôn ngữ ban đầu
    await setLanguage(initialLang);

    window.langSystem.initialized = true;
    window.componentLog(`Language system fully initialized. Active language: '${window.langSystem.currentLanguage}'.`);
    console.groupEnd();
}

// 5. EXPOSE API & THỰC THI
// Cung cấp hàm `changeLanguage` ra toàn cục để các nút bấm có thể gọi.
// Nó sẽ trỏ đến hàm `setLanguage` đã được tối ưu hóa.
window.changeLanguage = setLanguage;

// Tự khởi tạo khi DOM đã sẵn sàng (Giữ nguyên)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLanguageSystem);

} else {
    initializeLanguageSystem();
    
}
