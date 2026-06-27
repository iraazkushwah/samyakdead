/* ==========================================================================
   SAMYAK - HIGH-FIDELITY PDF GENERATOR & PRINT CONTROLLER
   ========================================================================== */

import { dom } from './state.js';

let pdfCallbacks = {};

export function triggerPrintSequence() {
    pdfCallbacks.saveCurrentInputState();
    pdfCallbacks.renderPreview();
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                window.print();
            }, 350);
        });
    });
}

export function initPdfGenerator(callbacks) {
    pdfCallbacks = callbacks;

    if (dom.printPdfBtn) {
        dom.printPdfBtn.addEventListener('click', triggerPrintSequence);
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            triggerPrintSequence();
        }
    });
}
