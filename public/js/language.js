/**
 * @fileoverview This script manages the multi-language system for the website.
 * It handles fetching translations, applying them to the DOM, and saving user preferences.
 * @version 1.0 - Extracted from loadComponents.js and made standalone.
 * @author IVS-Technical-Team
 */

'use strict';

// Ensure componentLog and debounce utilities are available (expected to be defined by loadComponents.js)
// Duplicated here for robustness in case this script loads before loadComponents.js
if (typeof window.componentLog !== 'function') {
    window.componentLog = function(message, level = 'info') {
        console[level](`[IVS LangSystem] ${message}`);
    };
}

if (typeof window.debounce !== 'function') {
    window.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
}


// =================================================================
// LANGUAGE SYSTEM CORE LOGIC
// =================================================================

// Global language system state and configuration
window.langSystem = window.langSystem || {
    translations: {}, // Stores fetched translations by language code (e.g., {en: {...}, vi: {...}})
    defaultLanguage: 'en', // Fallback language if user preference or browser language is not available
    currentLanguage: 'en', // The currently active language
    languageStorageKey: 'userPreferredLanguage_v3', // Key for storing user's preferred language in localStorage
    languageFilesPath: '/lang/', // Path to the directory containing language JSON files (e.g., /lang/en.json)
    isDebugMode: true, // Enable/disable detailed logging for debugging
    initialized: false, // Flag to ensure the system is initialized only once
};

/**
 * Fetches translation JSON files for a given language code.
 * Stores the fetched translations in window.langSystem.translations.
 * @param {string} langCode The language code (e.g., 'en', 'vi').
 * @returns {Promise<void>} A promise that resolves when translations are fetched.
 */
async function fetchTranslations(langCode) {
    // If translations for this language are already loaded, do nothing
    if (window.langSystem.translations[langCode]) {
        return;
    }
    window.componentLog(`[Lang] Fetching translations for: ${langCode}`);
    try {
        const response = await fetch(`${window.langSystem.languageFilesPath}${langCode}.json?v=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} when fetching ${langCode}.json`);
        }
        window.langSystem.translations[langCode] = await response.json();
        window.componentLog(`[Lang] Successfully loaded translations for ${langCode}.`);
    } catch (error) {
        window.componentLog(`[Lang] Failed to fetch translations for ${langCode}: ${error.message}`, 'error');
    }
}

/**
 * Applies the currently active language's translations to the DOM elements.
 * It looks for elements with 'data-lang-key' attribute and updates their content or attributes.
 */
function applyTranslations() {
    const lang = window.langSystem.currentLanguage;
    // Use current language translations, or fallback to default if current is not available
    const translations = window.langSystem.translations[lang] || window.langSystem.translations[window.langSystem.defaultLanguage];

    if (!translations) {
        window.componentLog(`[Lang] No translations available for '${lang}' or default. DOM update skipped.`, 'error');
        return;
    }

    window.componentLog(`[Lang] Applying translations for '${lang}'...`);
    document.documentElement.lang = lang; // Set the HTML lang attribute for accessibility and SEO

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey; // Get the translation key from data-lang-key
        const translation = translations[key]; // Get the translated text

        if (translation !== undefined) {
            // Determine where to apply the translation (textContent, innerHTML, or an attribute)
            const targetAttr = el.dataset.langTarget || 'textContent';

            if (targetAttr === 'textContent') {
                el.textContent = translation;
            } else if (targetAttr === 'innerHTML') {
                el.innerHTML = translation;
            } else {
                el.setAttribute(targetAttr, translation);
            }
        } else {
            // Log a warning if a translation key is missing for the current language
            window.componentLog(`[Lang] Key '${key}' not found for language '${lang}'.`, 'warn');
        }
    });

    // Update the desktop language display (e.g., "VI" or "EN")
    document.querySelectorAll('#current-lang-desktop').forEach(el => {
        if(el) el.textContent = lang.toUpperCase();
    });
}

/**
 * Updates the UI state of language selection buttons (e.g., adding an 'active' class).
 */
function updateLanguageButtonsUI() {
    const currentLang = window.langSystem.currentLanguage;
    document.querySelectorAll('button[data-lang]').forEach(button => {
        const isActive = button.dataset.lang === currentLang;
        button.setAttribute('aria-pressed', isActive); // A11y attribute
        button.classList.toggle('active-language', isActive); // Apply active class
    });
}

/**
 * Sets the active language for the website.
 * It fetches translations if not already loaded, saves the preference, and updates the UI.
 * @param {string} langCode The language code to set.
 * @returns {Promise<void>} A promise that resolves when the language is set and translations applied.
 */
async function setLanguage(langCode) {
    window.componentLog(`[Lang] Attempting to set language to: ${langCode}`);

    // Fetch translations for the requested language if not already loaded
    if (!window.langSystem.translations[langCode]) {
        await fetchTranslations(langCode);
    }

    // If requested language translations still can't be loaded, fall back to default
    if (!window.langSystem.translations[langCode]) {
        window.componentLog(`[Lang] Cannot set language to '${langCode}', falling back to default '${window.langSystem.defaultLanguage}'.`, 'warn');
        langCode = window.langSystem.defaultLanguage;
        // Try fetching default language translations if they are also missing
        if (!window.langSystem.translations[langCode]) {
            await fetchTranslations(langCode);
        }
    }

    // Critical error: if even default language pack fails, the system cannot function
    if (!window.langSystem.translations[langCode]) {
        window.componentLog('[Lang] CRITICAL: Default language pack failed to load. Language system cannot function.', 'error');
        return;
    }

    // Update current language and save preference to localStorage
    window.langSystem.currentLanguage = langCode;
    localStorage.setItem(window.langSystem.languageStorageKey, langCode);

    // Apply translations and update button UI
    applyTranslations();
    updateLanguageButtonsUI();
}

/**
 * Initializes the language system.
 * This function should be called once when the page loads.
 * It determines the initial language based on localStorage, browser preference, or default.
 * @param {object} [config] Configuration object (optional)
 * @param {string} [config.language] Sets the default language if provided.
 * @param {string} [config.translationUrl] Sets the path to translation files if provided.
 * @returns {Promise<void>} A promise that resolves when the language system is fully initialized.
 */
async function initializeLanguageSystem(config) {
    if (window.langSystem.initialized) {
        window.componentLog('[Lang] Language system already initialized. Skipping re-initialization.', 'info');
        return;
    }

    // Apply configuration if provided
    if (config && config.language) {
        window.langSystem.defaultLanguage = config.language;
        window.langSystem.currentLanguage = config.language; // Also set current to default initially
    }
    if (config && config.translationUrl) {
        window.langSystem.languageFilesPath = config.translationUrl;
    }

    // Determine the initial language: user preference > browser language > default language
    let initialLang = localStorage.getItem(window.langSystem.languageStorageKey) ||
                      (navigator.language || navigator.userLanguage).split('-')[0] ||
                      window.langSystem.defaultLanguage;

    // Fetch translations for the initial language and the default language concurrently
    // This ensures both are available for fallback if needed
    await Promise.all([
        fetchTranslations(initialLang),
        fetchTranslations(window.langSystem.defaultLanguage)
    ]);

    // Set the language and apply translations
    await setLanguage(initialLang);

    window.langSystem.initialized = true;
    window.componentLog(`[Lang] Language system initialized. Current language: '${window.langSystem.currentLanguage}'.`);

    // Add event listeners to all language selection buttons
    document.querySelectorAll('button[data-lang]').forEach(button => {
        button.addEventListener('click', (e) => {
            const newLang = e.currentTarget.dataset.lang;
            if (newLang) {
                setLanguage(newLang); // Call setLanguage when a button is clicked
            }
        });
    });
}

// Expose the system object globally to allow other scripts (like loadComponents.js) to interact with it
window.system = window.system || {};
window.system.setLanguage = setLanguage;
window.system.init = initializeLanguageSystem; // Expose the init function

// Initialize the language system when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only call initializeLanguageSystem if it hasn't been called yet.
    // loadComponents.js will call this with proper config, so this is a safeguard.
    if (!window.langSystem.initialized) {
        // Provide a default config if initializeLanguageSystem is called directly here
        window.system.init({ language: 'en', translationUrl: '/lang/' });
        window.componentLog("[Lang] Language system initialized via DOMContentLoaded fallback.", "info");
    }
});
