'use strict';

/**
 * @fileoverview Central component and script loader for the IVS website.
 * This script ensures all shared components (header, footer, FAB) and their
 * dependent scripts (language, interactions) are loaded in the correct order
 * to prevent race conditions and execution errors.
 */

// --- UTILITY FUNCTIONS ---

/**
 * Logs messages with a consistent prefix for easier debugging.
 * @param {string} message The message to log.
 * @param {'log'|'warn'|'error'} type The console method to use.
 */
const componentLog = (message, type = 'log') => {
    const debugMode = true; // Set to false in production
    if (debugMode || type === 'error') {
        console[type](`[IVS Loader] ${message}`);
    }
};

/**
 * Fetches HTML content and injects it into a specified placeholder element.
 * @param {string} componentName A friendly name for the component for logging.
 * @param {string} placeholderId The ID of the element to inject HTML into.
 * @param {string} filePath The path to the component's HTML file.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on failure.
 */
const loadComponent = async (componentName, placeholderId, filePath) => {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        // This is not an error, some pages might not have all placeholders.
        // componentLog(`Placeholder #${placeholderId} not found, skipping ${componentName}.`, 'warn');
        return true; // Resolve true to not break the Promise.all chain
    }
    componentLog(`Loading ${componentName}...`, 'log');
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        placeholder.innerHTML = await response.text();
        componentLog(`${componentName} loaded successfully.`);
        return true;
    } catch (error) {
        componentLog(`Failed to load ${componentName}: ${error.message}`, 'error');
        placeholder.innerHTML = `<div style="text-align:center;color:red;padding:1rem;">Error loading ${componentName}.</div>`;
        return false;
    }
};

/**
 * Dynamically loads a JavaScript file by creating a <script> tag.
 * @param {string} scriptPath The path to the JavaScript file.
 * @returns {Promise<void>} A promise that resolves when the script is loaded or rejects on error.
 */
const loadScript = (scriptPath) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${scriptPath}"]`)) {
            componentLog(`Script ${scriptPath} is already in the DOM.`, 'log');
            resolve();
            return;
        }
        componentLog(`Loading script: ${scriptPath}...`);
        const script = document.createElement('script');
        script.src = scriptPath;
        script.async = false; // Load scripts sequentially
        script.defer = true;
        script.onload = () => {
            componentLog(`Script ${scriptPath} loaded successfully.`);
            resolve();
        };
        script.onerror = () => {
            componentLog(`Failed to load script: ${scriptPath}`, 'error');
            reject(new Error(`Script load error for ${scriptPath}`));
        };
        document.body.appendChild(script);
    });
};


// --- MAIN EXECUTION LOGIC ---

/**
 * The main function that orchestrates the loading of all components and scripts.
 */
const initializeSite = async () => {
    componentLog('Initialization sequence started.');

    // 1. Load all visual HTML components concurrently.
    const componentsLoaded = await Promise.all([
        loadComponent('Header', 'header-placeholder', '/components/header.html'),
        loadComponent('Footer', 'footer-placeholder', '/components/footer.html'),
        loadComponent('FABs', 'fab-container-placeholder', '/components/fab-container.html')
    ]);

    // Proceed only if all components were loaded successfully (or skipped gracefully).
    if (componentsLoaded.includes(false)) {
        componentLog('One or more components failed to load. Halting script execution.', 'error');
        return;
    }
    
    componentLog('All HTML components loaded. Now loading dependent scripts...');

    // 2. Load critical scripts in a defined sequence.
    try {
        // language.js is required by script.js and the rest of the site.
        await loadScript('/js/language.js');
        // script.js contains the interaction logic for header, FABs, etc.
        await loadScript('/js/script.js');
        // posts-loader.js is a general utility that might be needed.
        await loadScript('/js/posts-loader.js');
    } catch (error) {
        componentLog('A critical script failed to load. Site functionality may be limited.', 'error');
        return; // Stop if core scripts fail
    }

    componentLog('Core scripts loaded. Initializing interactions...');

    // 3. Initialize the loaded components. The functions should now be available from the loaded scripts.
    if (typeof window.initializeLanguageSystem === 'function') {
        await window.initializeLanguageSystem();
        componentLog('Language system initialized.');
    }
    if (typeof window.initializeHeader === 'function') {
        window.initializeHeader();
    }
     if (typeof window.initializeFabButtons === 'function') {
        window.initializeFabButtons();
    }
    if (typeof window.initializeFooter === 'function') {
        window.initializeFooter();
    }
    
    // 4. Dispatch a custom event to notify page-specific scripts that everything is ready.
    componentLog('All components and core scripts are ready. Firing "componentsLoaded" event.');
    document.dispatchEvent(new CustomEvent('componentsLoaded'));
    
    componentLog('Initialization sequence complete.');
};

// Start the entire process once the initial DOM is ready.
document.addEventListener('DOMContentLoaded', initializeSite);
