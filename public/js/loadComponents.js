/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their interactive logic, ensuring reliable execution.
 * @version 4.8 - Centralized Utilities & Improved Component Init Flow.
 * @author IVS-Technical-Team
 */

'use strict';

// =================================================================
//  LOGGING & UTILITIES (Centralized here)
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
                    // Append to head or body depending on where it's usually expected
                    // For component scripts, body is generally safer.
                    document.body.appendChild(newScript); 
                });
            } else {
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript); // Append to execute inline scripts
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
        // IVSHeaderController is defined in headerController.js, which loadComponents.js will load and init
        { id: 'header-placeholder', url: '/components/header.html', controller: null }, 
        { id: 'fab-container-placeholder', url: '/components/fab-container.html', controller: null }, // Controller is defined within this HTML
        { id: 'footer-placeholder', url: '/components/footer.html', controller: null }
    ];

    for (const comp of components) {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            if (success) {
                // Special handling for controllers defined within injected HTML
                if (comp.id === 'header-placeholder' && window.IVSHeaderController && typeof window.IVSHeaderController.init === 'function') {
                    window.IVSHeaderController.init();
                }
                else if (comp.id === 'fab-container-placeholder' && window.IVSFabController && typeof window.IVSFabController.init === 'function') {
                    window.IVSFabController.init();
                }
                // No need for a generic comp.controller.init() because the controllers are now explicitly window-scoped
            }
        }
    }

    // Initialize global system (e.g., language system) if available
    if (window.system?.init) window.system.init({ language: 'vi', translationUrl: '/lang/' });

    componentLog("Component sequence complete.");
    window.onPageComponentsLoadedCallback?.(); // Trigger callback if defined by the page
}

document.addEventListener('DOMContentLoaded', loadCommonComponents);
