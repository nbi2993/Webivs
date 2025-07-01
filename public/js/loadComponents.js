/**
 * @fileoverview This script handles dynamic loading of shared HTML components
 * and initializes their respective controllers in a reliable sequence.
 * @version 5.1 - Robust initialization call.
 * @author IVS-Technical-Team
 */

'use strict';

async function loadAndInject(url, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        console.error(`[IVS Components] Placeholder '${placeholderId}' not found.`);
        return false;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        const scripts = Array.from(tempDiv.querySelectorAll('script'));
        tempDiv.querySelectorAll('script').forEach(s => s.remove());
        placeholder.replaceWith(...tempDiv.childNodes); // Use replaceWith to inject content directly

        // Execute scripts after HTML is in the DOM
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = oldScript.textContent;
            document.body.appendChild(newScript);
        }
        return true;
    } catch (error) {
        console.error(`[IVS Components] Failed to load ${url}: ${error.message}`);
        return false;
    }
}

async function loadCommonComponents() {
    console.log("[IVS Components] Initializing component sequence...");
    const components = [
        { id: 'header-placeholder', url: '/components/header.html', controller: 'IVSHeaderController' },
        { id: 'fab-container-placeholder', url: '/components/fab-container.html', controller: 'IVSFabController' },
        { id: 'footer-placeholder', url: '/components/footer.html', controller: null }
    ];

    for (const comp of components) {
        if (document.getElementById(comp.id)) {
            const success = await loadAndInject(comp.url, comp.id);
            // After successful load and script execution, initialize the controller
            if (success && comp.controller && window[comp.controller] && typeof window[comp.controller].init === 'function') {
                console.log(`[IVS Components] Initializing ${comp.controller}...`);
                window[comp.controller].init();
            } else if (success && comp.controller) {
                console.warn(`[IVS Components] Controller ${comp.controller} not found after loading component.`);
            }
        }
    }

    if (typeof window.onPageComponentsLoadedCallback === 'function') {
        window.onPageComponentsLoadedCallback();
    }
    console.log("[IVS Components] Component sequence complete.");
}

document.addEventListener('DOMContentLoaded', loadCommonComponents);
