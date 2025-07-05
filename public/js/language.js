/**
 * IVS Language System - Tối ưu hóa cho cấu trúc đa tệp
 * Phiên bản: 4.0 - Hỗ trợ tải và hợp nhất nhiều tệp ngôn ngữ.
 * Mô tả: Script này quản lý chức năng đa ngôn ngữ bằng cách tải đồng thời
 * các tệp -core, -pages, và -components, sau đó gộp chúng thành một đối tượng
 * dịch thuật duy nhất để sử dụng trên toàn trang.
 */
'use strict';

// 1. CẤU HÌNH & TRẠNG THÁI TOÀN CỤC
window.langSystem = window.langSystem || {
    translations: {},
    defaultLanguage: 'vi',
    currentLanguage: 'vi',
    languageStorageKey: 'userPreferredLanguage_v4', // Cập nhật key để tránh xung đột cache
    languageFilesPath: '/lang/',
    isDebugMode: true,
    initialized: false,
};

// 2. HÀM TIỆN ÍCH (Sử dụng componentLog từ utils.js)
// ...

// 3. LOGIC CỐT LÕI (NÂNG CẤP ĐỂ TẢI NHIỀU TỆP)

/**
 * Tải và hợp nhất các tệp ngôn ngữ cho một langCode cụ thể.
 * @param {string} langCode - Mã ngôn ngữ (vd: 'vi', 'en').
 * @returns {Promise<object|null>} - Trả về đối tượng dịch thuật đã hợp nhất hoặc null nếu lỗi.
 */
async function fetchAndMergeTranslations(langCode) {
    if (window.langSystem.translations[langCode]) {
        window.componentLog(`Translations for '${langCode}' loaded from cache.`, 'info');
        return window.langSystem.translations[langCode];
    }

    const filesToFetch = [
        `${window.langSystem.languageFilesPath}${langCode}-core.json`,
        `${window.langSystem.languageFilesPath}${langCode}-pages.json`,
        `${window.langSystem.languageFilesPath}${langCode}-components.json`
    ];

    window.componentLog(`Fetching translation files for '${langCode}'...`, 'group');

    try {
        const responses = await Promise.all(
            filesToFetch.map(file => fetch(`${file}?v=${new Date().getTime()}`).catch(e => {
                // Bắt lỗi mạng cho từng file
                window.componentLog(`Network error fetching ${file}: ${e.message}`, 'error');
                return null; // Trả về null để Promise.all không bị reject ngay lập tức
            }))
        );

        const successfulResponses = responses.filter(response => response && response.ok);
        
        if (successfulResponses.length === 0) {
             throw new Error(`All language files failed to load for '${langCode}'.`);
        }
        
        // Ghi log các file bị lỗi
        responses.forEach((response, index) => {
            if (!response || !response.ok) {
                window.componentLog(`Failed to load ${filesToFetch[index]}. Status: ${response ? response.status : 'Network Error'}`, 'warn');
            }
        });

        const dataObjects = await Promise.all(successfulResponses.map(res => res.json()));

        // Hợp nhất tất cả các đối tượng JSON thành một.
        // Object.assign({}, ...dataObjects) tạo một đối tượng mới chứa tất cả các khóa.
        const mergedTranslations = Object.assign({}, ...dataObjects);

        window.langSystem.translations[langCode] = mergedTranslations;
        window.componentLog(`Successfully merged ${dataObjects.length} files for '${langCode}'. Total keys: ${Object.keys(mergedTranslations).length}`);
        console.groupEnd();
        return mergedTranslations;

    } catch (error) {
        window.componentLog(`Could not load language pack for '${langCode}': ${error.message}`, 'error');
        console.groupEnd();
        return null;
    }
}


/**
 * Áp dụng các bản dịch lên giao diện người dùng.
 * Tối ưu hóa: Thêm cơ chế fallback về ngôn ngữ mặc định một cách an toàn hơn.
 */
function applyTranslations() {
    const lang = window.langSystem.currentLanguage;
    const defaultLang = window.langSystem.defaultLanguage;

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

        if (translation === undefined && lang !== defaultLang) {
            const defaultTranslations = window.langSystem.translations[defaultLang];
            if (defaultTranslations && defaultTranslations[key] !== undefined) {
                translation = defaultTranslations[key];
                 if(window.langSystem.isDebugMode) {
                    el.style.outline = '1px dashed orange';
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
                    el.innerHTML = translation;
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
                el.style.outline = '1px dashed red';
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
 * @param {string} langCode - Mã ngôn ngữ để chuyển đổi (vd: 'vi', 'en').
 */
async function setLanguage(langCode) {
    window.componentLog(`Request to set language to: '${langCode}'`, 'group');
    
    const supportedLanguages = ['vi', 'en'];
    if (!supportedLanguages.includes(langCode)) {
        window.componentLog(`Invalid language code '${langCode}'. Falling back to default '${window.langSystem.defaultLanguage}'.`, 'warn');
        langCode = window.langSystem.defaultLanguage;
    }

    await fetchAndMergeTranslations(langCode);

    if (!window.langSystem.translations[langCode]) {
        window.componentLog(`Failed to load '${langCode}', ensuring default '${window.langSystem.defaultLanguage}' is active.`, 'warn');
        langCode = window.langSystem.defaultLanguage;
        if (!window.langSystem.translations[langCode]) {
            await fetchAndMergeTranslations(langCode);
        }
    }
    
    if (!window.langSystem.translations[langCode]) {
        window.componentLog('CRITICAL: Default language pack could not be loaded. Language system cannot function.', 'error');
        console.groupEnd();
        return;
    }


    window.langSystem.currentLanguage = langCode;
    localStorage.setItem(window.langSystem.languageStorageKey, langCode);    
    applyTranslations();

    if (window.IVSHeaderController && typeof window.IVSHeaderController.updateLanguageButtonStates === 'function') {
        window.IVSHeaderController.updateLanguageButtonStates(langCode);

    }
    
    window.componentLog(`Language successfully set to: '${window.langSystem.currentLanguage}'.`);
    console.groupEnd();
}


// 4. KHỞI TẠO HỆ THỐNG
async function initializeLanguageSystem() {
    if (window.langSystem.initialized) {
        window.componentLog('Language system already initialized.', 'info');
        return;
    }
    window.componentLog('Initializing Language System...', 'group');

    const savedLang = localStorage.getItem(window.langSystem.languageStorageKey);
    const browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
    const initialLang = savedLang || browserLang || window.langSystem.defaultLanguage;

    window.componentLog(`Determined initial language: '${initialLang}'`);
    await fetchAndMergeTranslations(window.langSystem.defaultLanguage);    
    await setLanguage(initialLang);

    window.langSystem.initialized = true;
    window.componentLog(`Language system fully initialized. Active language: '${window.langSystem.currentLanguage}'.`);
    console.groupEnd();
}

// 5. EXPOSE API & THỰC THI

window.changeLanguage = setLanguage;


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLanguageSystem);
    
} else {
    initializeLanguageSystem();

}
