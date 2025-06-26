/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, including Firebase and Language System.
 * @version 6.0 - Consolidated Firebase and Language System initialization.
 * @author IVS-Technical-Team
 */

'use strict';

// =================================================================
//  GLOBAL LOGGING & UTILITIES (Centralized and unique global definitions)
// =================================================================
/**
 * Ghi log các thông báo liên quan đến tải component và hệ thống.
 * @param {string} message Thông điệp cần ghi log.
 * @param {'info'|'warn'|'error'} [level='info'] Mức độ log (info, warn, error).
 */
function componentLog(message, level = 'info') {
    console[level](`[IVS Core] ${message}`);
}
// Expose componentLog globally
window.componentLog = componentLog;

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
// Expose debounce globally
window.debounce = debounce;


// =================================================================
//  FIREBASE INITIALIZATION (From script.js)
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyD1Hi7-EnAN_--THeRY958fVaPWZbQNZzs",
    authDomain: "ivsjsc-6362f.firebaseapp.com",
    databaseURL: "https://ivsjsc-6362f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ivsjsc-6362f",
    storageBucket: "ivsjsc-6362f.appspot.com",
    messagingSenderId: "910278613224",
    appId: "1:910278613224:web:16b3f0faf041ac5703115d",
    measurementId: "G-SEP5LC4EMB"
};

try {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app); // eslint-disable-line no-unused-vars
    componentLog('[Firebase] Initialization successful.');
} catch (error) {
    componentLog('[Firebase] Initialization error: ' + error.message, 'error');
}


// =================================================================
//  LANGUAGE SYSTEM (From language.js)
// =================================================================
window.langSystem = window.langSystem || {
    translations: {},
    defaultLanguage: 'en',
    currentLanguage: 'en',
    languageStorageKey: 'userPreferredLanguage_v3',
    languageFilesPath: '/lang/',
    isDebugMode: true,
    initialized: false,
};

async function fetchTranslations(langCode) {
    if (window.langSystem.translations[langCode]) {
        return;
    }
    componentLog(`[Lang] Fetching translations for: ${langCode}`);
    try {
        const response = await fetch(`${window.langSystem.languageFilesPath}${langCode}.json?v=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${langCode}.json`);
        }
        window.langSystem.translations[langCode] = await response.json();
        componentLog(`[Lang] Successfully loaded translations for ${langCode}.`);
    } catch (error) {
        componentLog(`[Lang] Failed to fetch translations for ${langCode}: ${error.message}`, 'error');
    }
}

function applyTranslations() {
    const lang = window.langSystem.currentLanguage;
    const translations = window.langSystem.translations[lang] || window.langSystem.translations[window.langSystem.defaultLanguage];

    if (!translations) {
        componentLog(`[Lang] No translations available for '${lang}' or default. DOM update skipped.`, 'error');
        return;
    }

    componentLog(`[Lang] Applying translations for '${lang}'...`);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        const translation = translations[key];

        if (translation !== undefined) {
            const targetAttr = el.dataset.langTarget || 'textContent';

            if (targetAttr === 'textContent') {
                el.textContent = translation;
            } else if (targetAttr === 'innerHTML') {
                el.innerHTML = translation;
            } else {
                el.setAttribute(targetAttr, translation);
            }
        } else {
            componentLog(`[Lang] Key '${key}' not found for lang '${lang}'.`, 'warn');
        }
    });

    document.querySelectorAll('#current-lang-desktop').forEach(el => {
        if(el) el.textContent = lang.toUpperCase();
    });
}

function updateLanguageButtonsUI() {
    const currentLang = window.langSystem.currentLanguage;
    document.querySelectorAll('button[data-lang]').forEach(button => {
        const isActive = button.dataset.lang === currentLang;
        button.setAttribute('aria-pressed', isActive);
        button.classList.toggle('active-language', isActive);
    });
}

async function setLanguage(langCode) {
    componentLog(`[Lang] Attempting to set language to: ${langCode}`);

    if (!window.langSystem.translations[langCode]) {
        await fetchTranslations(langCode);
    }

    if (!window.langSystem.translations[langCode]) {
        componentLog(`[Lang] Cannot set language to '${langCode}', falling back to default '${window.langSystem.defaultLanguage}'.`, 'warn');
        langCode = window.langSystem.defaultLanguage;
        if (!window.langSystem.translations[langCode]) {
            await fetchTranslations(langCode);
        }
    }

    if (!window.langSystem.translations[langCode]) {
        componentLog('[Lang] CRITICAL: Default language pack failed to load. Language system cannot function.', 'error');
        return;
    }

    window.langSystem.currentLanguage = langCode;
    localStorage.setItem(window.langSystem.languageStorageKey, langCode);

    applyTranslations();
    updateLanguageButtonsUI();
}

window.system = window.system || {};
window.system.setLanguage = setLanguage;
window.system.init = async function(config) {
    componentLog("[Lang] window.system.init called. Config:", config);
    if (config && config.language) {
        window.langSystem.defaultLanguage = config.language;
        window.langSystem.currentLanguage = config.language;
    }
    if (config && config.translationUrl) {
        window.langSystem.languageFilesPath = config.translationUrl;
    }
    await initializeLanguageSystem();
    componentLog("[Lang] window.system initialized successfully.");
};

async function initializeLanguageSystem() {
    if (window.langSystem.initialized) {
        componentLog('[Lang] Language system already initialized.', 'info');
        return;
    }

    let initialLang = localStorage.getItem(window.langSystem.languageStorageKey) ||
                      (navigator.language || navigator.userLanguage).split('-')[0] ||
                      window.langSystem.defaultLanguage;

    await Promise.all([
        fetchTranslations(initialLang),
        fetchTranslations(window.langSystem.defaultLanguage)
    ]);

    await setLanguage(initialLang);

    window.langSystem.initialized = true;
    componentLog(`[Lang] Language system initialized. Current language: '${window.langSystem.currentLanguage}'.`);

    document.querySelectorAll('button[data-lang]').forEach(button => {
        button.addEventListener('click', (e) => {
            const newLang = e.currentTarget.dataset.lang;
            if (newLang) {
                setLanguage(newLang);
            }
        });
    });
}


// =================================================================
//  MAIN COMPONENT LOADER (Existing functionality with increased delays)
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
        componentLog(`[Loader] Placeholder '${placeholderId}' không tìm thấy. Không thể tải ${url}.`, "error");
        return false;
    }
    componentLog(`[Loader] Bắt đầu tải và chèn '${url}' vào '${placeholderId}'.`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP ${response.status} khi tải ${url}`);
        }

        const text = await response.text();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        const scripts = Array.from(tempDiv.querySelectorAll('script'));

        scripts.forEach(script => script.parentNode?.removeChild(script));

        placeholder.innerHTML = tempDiv.innerHTML;
        componentLog(`[Loader] Nội dung HTML của '${url}' đã chèn vào '${placeholderId}'.`);

        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));

            if (oldScript.src) {
                newScript.src = oldScript.src;
                await new Promise((resolve, reject) => {
                    newScript.onload = () => {
                        componentLog(`[Loader] Script bên ngoài đã tải: ${newScript.src}`);
                        resolve();
                    };
                    newScript.onerror = (e) => {
                        componentLog(`[Loader] Lỗi tải script bên ngoài: ${newScript.src}, Lỗi: ${e.message || e}`, 'error');
                        reject(e);
                    };
                    document.body.appendChild(newScript);
                });
            } else {
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript);
                componentLog(`[Loader] Script nội tuyến đã thực thi trong placeholder '${placeholderId}'.`);
            }
        }

        componentLog(`[Loader] Component '${url}' đã được tải và chèn thành công vào '${placeholderId}'.`);
        return true;
    } catch (error) {
        componentLog(`[Loader] Thất bại khi tải và chèn component '${url}' vào '${placeholderId}': ${error.message}`, 'error');
        return false;
    }
}

/**
 * Tải các component phổ biến (header, footer, fab-container).
 */
async function loadCommonComponents() {
    componentLog("[Loader] Bắt đầu trình tự tải component...");
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
                    setTimeout(() => {
                        if (window.IVSHeaderController && typeof window.IVSHeaderController.init === 'function') {
                            window.IVSHeaderController.init();
                            componentLog("[Loader] IVSHeaderController đã được khởi tạo qua setTimeout.", "info");
                        } else {
                            componentLog("[Loader] IVSHeaderController không tìm thấy hoặc không có hàm init sau khi tải header. Đảm bảo headerController.js được tải.", 'error');
                        }
                    }, 300); // Tăng lên 300ms để ổn định
                } else if (comp.id === 'fab-container-placeholder') {
                    setTimeout(() => {
                        if (window.IVSFabController && typeof window.IVSFabController.init === 'function') {
                            window.IVSFabController.init();
                            componentLog("[Loader] IVSFabController đã được khởi tạo qua setTimeout.", "info");
                        } else {
                            componentLog("[Loader] IVSFabController không tìm thấy hoặc không có hàm init sau khi tải fab-container. Đảm bảo fabController.js được tải.", 'error');
                        }
                    }, 300); // Tăng lên 300ms để ổn định
                }
            }
        } else {
            componentLog(`[Loader] Placeholder '${comp.id}' không tồn tại trên trang, bỏ qua tải component '${comp.url}'.`, 'warn');
        }
    }

    // Initialize global language system
    setTimeout(() => {
        if (window.system && typeof window.system.init === 'function') {
            window.system.init({ language: 'en', translationUrl: '/lang/' }); // Default to 'en'
            componentLog("[Loader] Hệ thống ngôn ngữ đã được khởi tạo qua setTimeout.", "info");
        } else {
            componentLog("[Loader] window.system hoặc window.system.init không được định nghĩa. Đảm bảo language.js đã tải và ngôn ngữ đã được gộp đúng.", 'error');
        }
    }, 400); // Tăng lên 400ms để đảm bảo language.js đã sẵn sàng và tất cả DOM đã được tải

    // Update current year span (from script.js)
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
        componentLog("[Loader] Đã cập nhật năm hiện tại.");
    }

    componentLog("[Loader] Trình tự tải component và khởi tạo cơ bản đã hoàn tất.");
    window.onPageComponentsLoadedCallback?.();
}

document.addEventListener('DOMContentLoaded', loadCommonComponents);

