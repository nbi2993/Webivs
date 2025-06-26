/**
 * IVS Language System - Optimized for Direct Integration
 * Version: 3.1 - Removed #current-lang-mobile element update.
 * * Description: This script handles all multilingual functionalities.
 * It is now self-contained and initializes on DOMContentLoaded, removing
 * the dependency on external loaders like loadComponents.js.
 * * Integration: Include this script in your HTML pages after the main content,
 * preferably before the closing </body> tag.
 */
'use strict';

// 1. GLOBAL CONFIGURATION & STATE
window.langSystem = window.langSystem || {
    translations: {},
    defaultLanguage: 'en', // Changed default to English as per user request
    currentLanguage: 'en', // Set current language to English initially
    languageStorageKey: 'userPreferredLanguage_v3',
    languageFilesPath: '/lang/', // Absolute path is more robust
    isDebugMode: true,
    initialized: false,
};

// 2. UTILITY FUNCTIONS
function langLog(message, level = 'info') {
    // Ensure window.componentLog is available, fallback to console if not
    // Corrected the way 'level' is passed to window.componentLog
    if (window.componentLog && (window.langSystem.isDebugMode || level === 'error' || level === 'warn')) {
        window.componentLog(`[IVS Lang] ${message}`, level); // Pass level directly
    } else if (window.langSystem.isDebugMode || level === 'error' || level === 'warn') {
        console[level](`[IVS Lang] ${message}`);
    }
}
// Expose langLog globally for potential external use or debugging
window.langLog = langLog;


// 3. CORE TRANSLATION LOGIC
async function fetchTranslations(langCode) {
    if (window.langSystem.translations[langCode]) {
        return; // Already loaded
    }
    langLog(`Fetching translations for: ${langCode}`);
    try {
        const response = await fetch(`${window.langSystem.languageFilesPath}${langCode}.json?v=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${langCode}.json`);
        }
        window.langSystem.translations[langCode] = await response.json();
        langLog(`Successfully loaded translations for ${langCode}.`);
    } catch (error) {
        langLog(`Failed to fetch translations for ${langCode}: ${error.message}`, 'error');
        // Do not load default here, handle fallback during language setting.
    }
}

function applyTranslations() {
    const lang = window.langSystem.currentLanguage;
    const translations = window.langSystem.translations[lang] || window.langSystem.translations[window.langSystem.defaultLanguage];

    if (!translations) {
        langLog(`No translations available for '${lang}' or default. DOM update skipped.`, 'error');
        return;
    }

    langLog(`Applying translations for '${lang}'...`);
    document.documentElement.lang = lang; // Set lang attribute on HTML element

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        const translation = translations[key];

        if (translation !== undefined) {
            // Determine the target attribute based on data-lang-target or element type
            const targetAttr = el.dataset.langTarget || 'textContent'; // Default to textContent

            if (targetAttr === 'textContent') {
                el.textContent = translation;
            } else if (targetAttr === 'innerHTML') {
                el.innerHTML = translation;
            } else {
                el.setAttribute(targetAttr, translation);
            }
        } else {
            langLog(`Key '${key}' not found for lang '${lang}'.`, 'warn');
        }
    });

    // Update UI elements that show the current language code (e.g., "EN", "VI")
    // '#current-lang-mobile-outside' was removed from header.html and is no longer needed
    document.querySelectorAll('#current-lang-desktop').forEach(el => {
        if(el) el.textContent = lang.toUpperCase();
    });
}

function updateLanguageButtonsUI() {
    const currentLang = window.langSystem.currentLanguage;
    document.querySelectorAll('button[data-lang]').forEach(button => {
        const isActive = button.dataset.lang === currentLang;
        button.setAttribute('aria-pressed', isActive);
        // Add/remove a class to visually indicate the active language
        button.classList.toggle('active-language', isActive); 
    });
}

// 4. PUBLIC API & INITIALIZATION
async function setLanguage(langCode) {
    langLog(`Attempting to set language to: ${langCode}`);
    
    // Ensure the requested language pack is loaded
    if (!window.langSystem.translations[langCode]) {
        await fetchTranslations(langCode);
    }
    
    // Fallback to default if the requested language is still not available
    if (!window.langSystem.translations[langCode]) {
        langLog(`Cannot set language to '${langCode}', falling back to default '${window.langSystem.defaultLanguage}'.`, 'warn');
        langCode = window.langSystem.defaultLanguage;
        // Ensure default is loaded if it also failed somehow
        if (!window.langSystem.translations[langCode]) {
            await fetchTranslations(langCode);
        }
    }

    // Final check before setting
    if (!window.langSystem.translations[langCode]) {
        langLog('CRITICAL: Default language pack failed to load. Language system cannot function.', 'error');
        return;
    }

    window.langSystem.currentLanguage = langCode;
    localStorage.setItem(window.langSystem.languageStorageKey, langCode);
    
    applyTranslations();
    updateLanguageButtonsUI();
}
// Expose setLanguage globally as window.system.setLanguage
window.system = window.system || {};
window.system.setLanguage = setLanguage;
window.system.init = async function(config) {
    langLog("window.system.init called. Config:", config);
    // Overwrite default settings if provided in config
    if (config && config.language) {
        window.langSystem.defaultLanguage = config.language;
        window.langSystem.currentLanguage = config.language;
    }
    if (config && config.translationUrl) {
        window.langSystem.languageFilesPath = config.translationUrl;
    }
    await initializeLanguageSystem();
    langLog("window.system initialized successfully.");
};


async function initializeLanguageSystem() {
    if (window.langSystem.initialized) {
        langLog('Language system already initialized.', 'info');
        return;
    }

    // Determine initial language: 1. LocalStorage, 2. Browser, 3. Default
    let initialLang = localStorage.getItem(window.langSystem.languageStorageKey) || 
                      (navigator.language || navigator.userLanguage).split('-')[0] || 
                      window.langSystem.defaultLanguage;

    // Load initial language pack and default pack for fallback
    await Promise.all([
        fetchTranslations(initialLang),
        fetchTranslations(window.langSystem.defaultLanguage)
    ]);

    // Set the final language (with fallback logic)
    await setLanguage(initialLang);

    window.langSystem.initialized = true;
    langLog(`Language system initialized. Current language: '${window.langSystem.currentLanguage}'.`);

    // Add event listeners to all language switcher buttons
    // This part can be simplified as loadComponents.js handles binding for header/bottom nav buttons
    // But keeping it here for other potential standalone language buttons
    document.querySelectorAll('button[data-lang]').forEach(button => {
        button.addEventListener('click', (e) => {
            const newLang = e.currentTarget.dataset.lang;
            if (newLang) {
                setLanguage(newLang);
            }
        });
    });
}

// 5. SCRIPT EXECUTION
// The script will now self-initialize once the DOM is ready.
// This ensures language system is ready even if loadComponents.js is not present or delayed.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLanguageSystem);
} else {
    initializeLanguageSystem();
}
