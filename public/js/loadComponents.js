/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 4.8 - Updated IVSHeaderController init.
 * @author IVS-Technical-Team
 */

'use strict';

// =================================================================
//  LOGGING & UTILITIES
// =================================================================
function componentLog(message, level = 'info') {
    console[level](`[IVS Components] ${message}`);
}

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

// IVSHeaderController and IVSFabController are now expected to be defined globally
// by the components they are associated with (e.g., fab-container.html defines IVSFabController)
// This script will just call their init methods.

/**
 * All logic related to the Header and Mobile Menu.
 * Handles responsive menu, submenus, and scroll effects.
 * (This is a placeholder, actual logic is in headerController.js)
 */
const IVSHeaderController = {
    init() {
        // This is a minimal init for loadComponents.js's purpose.
        // The detailed init is in the separate headerController.js file.
        // Ensure that headerController.js actually contains the full init logic.
        if (window.IVSHeaderController && typeof window.IVSHeaderController.init === 'function') {
            window.IVSHeaderController.init();
        } else {
            componentLog("IVSHeaderController global object or its init method not found. Full header functionality might be impaired.", "error");
        }
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
        componentLog(`Placeholder '${placeholderId}' not found.`, "error");
        return false;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
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
                    newScript.onload = resolve;
                    newScript.onerror = reject;
                    placeholder.appendChild(newScript); // Append to trigger load
                });
            } else {
                newScript.textContent = oldScript.textContent;
                placeholder.appendChild(newScript); // Append to execute inline scripts
            }
        }
        
        return true;
    } catch (error) {
        componentLog(`Failed to load ${url}: ${error.message}`, 'error');
        return false;
    }
}

async function loadCommonComponents() {
    componentLog("Initializing component sequence...");
    const components = [
        { id: 'header-placeholder', url: '/components/header.html', controller: IVSHeaderController },
        { id: 'fab-container-placeholder', url: '/components/fab-container.html', controller: null }, // Controller is defined within this HTML
        { id: 'footer-placeholder', url: '/components/footer.html', controller: null }
    ];

    for (const comp of components) {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            if (success) {
                if (comp.controller) {
                    comp.controller.init();
                } 
                // Special handling for FAB Controller which is defined globally inside its HTML
                else if (comp.id === 'fab-container-placeholder' && window.IVSFabController && typeof window.IVSFabController.init === 'function') {
                    window.IVSFabController.init();
                }
            }
        }
    }

    // Ensure the language system is initialized after components are loaded
    if (window.langSystem && typeof window.langSystem.initializeLanguageSystem === 'function') {
        window.langSystem.initializeLanguageSystem(); // Call the global language system init
    } else {
        componentLog('Language system (window.langSystem.initializeLanguageSystem) not found or not ready.', 'warn');
    }

    componentLog("Component sequence complete.");
    window.onPageComponentsLoadedCallback?.();
}

document.addEventListener('DOMContentLoaded', loadCommonComponents);
