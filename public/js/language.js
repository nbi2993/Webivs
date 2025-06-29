/**
 * IVS Language System - Optimized for Direct Integration
 * Version: 3.2 - Enhanced Debugging & Error Logging
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
    defaultLanguage: 'vi', // Changed default to Vietnamese as per standard practice
    currentLanguage: 'vi',
    languageStorageKey: 'userPreferredLanguage_v3',
    languageFilesPath: '/lang/', // Absolute path is more robust
    isDebugMode: true, // Keep this true for debugging
    initialized: false,
};

// 2. UTILITY FUNCTIONS
function langLog(message, type = 'log') {
    if (window.langSystem.isDebugMode || type === 'error' || type === 'warn') {
        console[type](`[IVS Lang] ${message}`);
    }
}

// 3. CORE TRANSLATION LOGIC
async function fetchTranslations(langCode) {
    if (window.langSystem.translations[langCode]) {
        langLog(`Translations for ${langCode} already loaded.`, 'info');
        return; // Already loaded
    }
    langLog(`Attempting to fetch translations for: ${langCode} from ${window.langSystem.languageFilesPath}${langCode}.json`);
    try {
        const response = await fetch(`${window.langSystem.languageFilesPath}${langCode}.json?v=${new Date().getTime()}`);
        langLog(`Fetch response status for ${langCode}.json: ${response.status} - OK: ${response.ok}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`404 Not Found: Language file ${langCode}.json does not exist at ${response.url}`);
            } else {
                throw new Error(`HTTP ${response.status} for ${langCode}.json: ${response.statusText}`);
            }
        }
        window.langSystem.translations[langCode] = await response.json();
        langLog(`Successfully loaded and parsed translations for ${langCode}. Keys loaded: ${Object.keys(window.langSystem.translations[langCode]).length}`);
    } catch (error) {
        langLog(`Failed to fetch or parse translations for ${langCode}: ${error.message}`, 'error');
        // Do not load default here, handle fallback during language setting.
    }
}

function applyTranslations() {
    const lang = window.langSystem.currentLanguage;
    const translations = window.langSystem.translations[lang] || window.langSystem.translations[window.langSystem.defaultLanguage];

    if (!translations) {
        langLog(`CRITICAL: No translations available for '${lang}' or default language '${window.langSystem.defaultLanguage}'. DOM update skipped. This might indicate file loading issues.`, 'error');
        return;
    }

    langLog(`Applying translations for '${lang}'. Total keys in active pack: ${Object.keys(translations).length}`);
    document.documentElement.lang = lang;

    let translatedElementsCount = 0;
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
            translatedElementsCount++;
        } else {
            langLog(`Key '${key}' not found for current language '${lang}' or default. Element not translated.`, 'warn');
        }
    });
    langLog(`Finished applying translations. Total elements updated: ${translatedElementsCount}`);
}

function updateLanguageButtonsUI() {
    // This function can be kept if there are other language buttons outside the one-touch toggle
    // For now, it's less relevant as the one-touch toggle doesn't have active/inactive states
    // but rather triggers a full language change.
    langLog('updateLanguageButtonsUI called. This function is typically handled by headerController for button states.', 'info');
    
    // Notify headerController to update its buttons if it's available
    if (window.IVSHeaderController && typeof window.IVSHeaderController.updateLanguageButtonStates === 'function') {
        window.IVSHeaderController.updateLanguageButtonStates(window.langSystem.currentLanguage);
        langLog('Notified IVSHeaderController to update language button states.');
    }
}

// 4. PUBLIC API & INITIALIZATION
window.langSystem.setLanguage = async function(langCode) { // Expose setLanguage directly on window.langSystem
    langLog(`Attempting to set language to: ${langCode}`);
    
    // Ensure the requested language pack is loaded
    if (!window.langSystem.translations[langCode]) {
        await fetchTranslations(langCode);
    }
    
    // Fallback to default if the requested language is still not available
    if (!window.langSystem.translations[langCode]) {
        langLog(`Cannot set language to '${langCode}', falling back to default '${window.langSystem.defaultLanguage}'. Requested lang pack not available.`, 'warn');
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
    updateLanguageButtonsUI(); // Call this to update any remaining language buttons if needed
    langLog(`Language successfully set to: '${window.langSystem.currentLanguage}'.`);
};


async function initializeLanguageSystem() {
    if (window.langSystem.initialized) {
        langLog('Language system already initialized. Skipping re-initialization.', 'info');
        return;
    }

    // Determine initial language: 1. LocalStorage, 2. Browser, 3. Default
    let initialLang = localStorage.getItem(window.langSystem.languageStorageKey) || 
                      (navigator.language || navigator.userLanguage).split('-')[0] || 
                      window.langSystem.defaultLanguage;

    langLog(`Initial language determined: '${initialLang}'. Attempting to load packs...`);

    // Load initial language pack and default pack for fallback
    await Promise.all([
        fetchTranslations(initialLang),
        fetchTranslations(window.langSystem.defaultLanguage)
    ]);

    // Set the final language (with fallback logic)
    // This call will use the setLanguage function defined above
    await window.langSystem.setLanguage(initialLang);

    window.langSystem.initialized = true;
    langLog(`Language system fully initialized. Current active language: '${window.langSystem.currentLanguage}'.`);
}

// Make changeLanguage available globally
window.changeLanguage = async function(langCode) {
    langLog(`Initiating language change to: ${langCode}`);
    
    if (!['en', 'vi'].includes(langCode)) {
        langLog(`Invalid language code: ${langCode}`, 'error');
        return;
    }

    try {
        // Fetch translations if not already loaded
        await fetchTranslations(langCode);
        
        // Update current language
        window.langSystem.currentLanguage = langCode;
        
        // Save preference
        localStorage.setItem(window.langSystem.languageStorageKey, langCode);
        
        // Update all elements with data-lang-key
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            const translation = window.langSystem.translations[langCode][key];
            
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        langLog(`Successfully changed language to: ${langCode}`);
        return true;
    } catch (error) {
        langLog(`Error changing language: ${error.message}`, 'error');
        throw error;
    }
}

// 5. SCRIPT EXECUTION
// The script will now self-initialize once the DOM is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLanguageSystem);
    langLog('DOMContentLoaded listener added for language system initialization.');
} else {
    initializeLanguageSystem();
    langLog('DOM already loaded, language system initializing immediately.');
}
