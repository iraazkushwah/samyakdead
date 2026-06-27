/* ==========================================================================
   SAMYAK - AI LAYOUT OPTIMIZER & COMPACTOR
   ========================================================================== */

import { state, dom } from './state.js';

let optimizerCallbacks = {};

export function performSmartShrink(showFeedbackAlert = true) {
    return new Promise((resolve) => {
        const originalPageCount = state.pagesData.length;
        
        if (originalPageCount <= 2) {
            if (showFeedbackAlert) {
                alert("Smart Shrink only works when you have multiple pages!");
            }
            resolve(false);
            return;
        }

        const originalFontSize = state.contentFontSize;
        const originalLineSpacing = parseFloat(dom.globalLineSpacingSelect.value || '1.45');
        
        const lastPageText = state.pagesData[originalPageCount - 1].text.trim();
        const characterCount = lastPageText.length;
        const lineCount = lastPageText.split('\n').filter(l => l.trim()).length;

        if (showFeedbackAlert && (characterCount > 600 || lineCount > 6)) {
            const proceed = confirm(`The last page contains a lot of content (${lineCount} lines, ${characterCount} chars). Fitting this on previous pages might require making the text size significantly smaller. Do you still want to proceed?`);
            if (!proceed) {
                resolve(false);
                return;
            }
        }

        if (dom.loadingOverlay) {
            dom.loadingOverlay.classList.add('active');
        }

        setTimeout(() => {
            const candidates = [];
            
            for (let ls = originalLineSpacing - 0.03; ls >= 1.3; ls -= 0.03) {
                candidates.push({ fs: originalFontSize, ls: Math.round(ls * 100) / 100 });
            }

            for (let fs = originalFontSize - 0.2; fs >= 13; fs -= 0.2) {
                const roundedFs = Math.round(fs * 100) / 100;
                candidates.push({ fs: roundedFs, ls: originalLineSpacing });
                
                if (originalLineSpacing > 1.4) {
                    candidates.push({ fs: roundedFs, ls: 1.4 });
                }
                candidates.push({ fs: roundedFs, ls: 1.35 });
                candidates.push({ fs: roundedFs, ls: 1.3 });
            }

            let success = false;
            let bestFs = originalFontSize;
            let bestLs = originalLineSpacing;

            const setSelectValue = (selectEl, val) => {
                let optionExists = Array.from(selectEl.options).some(opt => parseFloat(opt.value) === val);
                if (!optionExists) {
                    const tempOpt = document.createElement('option');
                    tempOpt.value = val.toString();
                    tempOpt.textContent = `Custom (${val})`;
                    tempOpt.id = 'temp-spacing-option';
                    selectEl.appendChild(tempOpt);
                }
                selectEl.value = val.toString();
            };

            for (const candidate of candidates) {
                state.contentFontSize = candidate.fs;
                setSelectValue(dom.globalLineSpacingSelect, candidate.ls);
                
                document.documentElement.style.setProperty('--content-font-size', `${state.contentFontSize}px`);
                document.documentElement.style.setProperty('--content-line-height', candidate.ls.toString());
                state.cachedMaxContentHeight = null;
                
                optimizerCallbacks.renderPreview();

                if (state.pagesData.length < originalPageCount) {
                    success = true;
                    bestFs = candidate.fs;
                    bestLs = candidate.ls;
                    break;
                }
            }

            const cleanTempOptions = (selectEl, activeVal) => {
                Array.from(selectEl.options).forEach(opt => {
                    if (opt.id === 'temp-spacing-option' && parseFloat(opt.value) !== activeVal) {
                        selectEl.removeChild(opt);
                    }
                });
            };

            if (dom.loadingOverlay) {
                dom.loadingOverlay.classList.remove('active');
            }

            setTimeout(() => {
                if (success) {
                    dom.fontSizeValSpan.textContent = `${bestFs}px`;
                    cleanTempOptions(dom.globalLineSpacingSelect, bestLs);
                    optimizerCallbacks.renderPreview();
                    optimizerCallbacks.saveWorkspaceToLocalStorage();
                    if (showFeedbackAlert) {
                        alert(`🪄 Smart Shrink was successful!\n\nPages: ${originalPageCount} -> ${state.pagesData.length}\nFont Size: ${bestFs}px\nLine Spacing: ${bestLs}`);
                    }
                    resolve(true);
                } else {
                    state.contentFontSize = originalFontSize;
                    setSelectValue(dom.globalLineSpacingSelect, originalLineSpacing);
                    cleanTempOptions(dom.globalLineSpacingSelect, originalLineSpacing);
                    
                    document.documentElement.style.setProperty('--content-font-size', `${originalFontSize}px`);
                    document.documentElement.style.setProperty('--content-line-height', originalLineSpacing.toString());
                    dom.fontSizeValSpan.textContent = `${originalFontSize}px`;
                    state.cachedMaxContentHeight = null;
                    
                    optimizerCallbacks.renderPreview();
                    if (showFeedbackAlert) {
                        alert("Attempted, but could not fit the content onto the previous pages without shrinking the font size below 13px.");
                    }
                    resolve(false);
                }
            }, 60);
        }, 80);
    });
}

export function performRemoveDocumentGaps(forceAllPages = false, showFeedbackAlert = true) {
    optimizerCallbacks.saveCurrentInputState();

    let allPages = forceAllPages;
    if (!forceAllPages && showFeedbackAlert) {
        if (state.activePageIndex <= 0 || state.activePageIndex >= state.pagesData.length) {
            alert("कृपया कोई कंटेंट पेज चुनें (बदलाव केवल कंटेंट पेजों पर लागू होते हैं)।");
            return { success: false, emptyLinesRemoved: 0, spacersRemoved: 0, pagesCleaned: 0 };
        }

        const proceed = confirm("क्या आप खाली लाइनें (blank lines) और [space] गैप हटाना चाहते हैं?");
        if (!proceed) return { success: false, emptyLinesRemoved: 0, spacersRemoved: 0, pagesCleaned: 0 };

        allPages = confirm("क्या आप इसे सभी पेजों पर लागू करना चाहते हैं?\n\n- OK: सभी पेजों से हटाएं\n- Cancel: केवल वर्तमान सक्रिय पेज से हटाएं");
    }

    let pagesCleaned = 0;
    let emptyLinesRemoved = 0;
    let spacersRemoved = 0;

    function cleanText(text) {
        if (!text) return { text: '', emptyLines: 0, spacers: 0 };
        let original = text;
        
        const spacerRegex = /^\[?(space|spce)(?:\s+\d+)?\]?$/gim;
        const spacerMatches = original.match(spacerRegex) || [];
        let cleaned = original.replace(spacerRegex, '');

        let lines = cleaned.split('\n');
        let originalLineCount = lines.length;
        let nonSpaceLines = lines.filter(line => line.trim() !== '');
        let cleanedLineCount = nonSpaceLines.length;
        
        let emptyLinesRemovedCount = Math.max(0, originalLineCount - cleanedLineCount - (lines[lines.length - 1] === '' ? 1 : 0));
        cleaned = nonSpaceLines.join('\n');

        return {
            text: cleaned,
            emptyLines: emptyLinesRemovedCount,
            spacers: spacerMatches.length
        };
    }

    if (allPages) {
        for (let idx = 1; idx < state.pagesData.length; idx++) {
            if (state.pagesData[idx] && state.pagesData[idx].type === 'content' && state.pagesData[idx].text) {
                const res = cleanText(state.pagesData[idx].text);
                if (res.text !== state.pagesData[idx].text) {
                    state.pagesData[idx].text = res.text;
                    pagesCleaned++;
                    emptyLinesRemoved += res.emptyLines;
                    spacersRemoved += res.spacers;
                }
            }
        }
        if (state.activePageIndex > 0 && state.activePageIndex < state.pagesData.length) {
            dom.pageContentInput.value = state.pagesData[state.activePageIndex].text;
        }
    } else {
        if (state.activePageIndex > 0 && state.activePageIndex < state.pagesData.length) {
            const res = cleanText(state.pagesData[state.activePageIndex].text);
            if (res.text !== state.pagesData[state.activePageIndex].text) {
                state.pagesData[state.activePageIndex].text = res.text;
                dom.pageContentInput.value = res.text;
                pagesCleaned = 1;
                emptyLinesRemoved = res.emptyLines;
                spacersRemoved = res.spacers;
            }
        }
    }

    if (pagesCleaned > 0) {
        if (showFeedbackAlert) {
            alert(`सफलतापूर्वक खाली लाइनें और गैप हटा दिए गए हैं! ✨\n- हटाए गए खाली लाइन्स: ${emptyLinesRemoved}\n- हटाए गए स्पेस टैग: ${spacersRemoved}\n- अपडेट किए गए पेज: ${pagesCleaned}`);
        }
        optimizerCallbacks.renderPreview();
        optimizerCallbacks.saveWorkspaceToLocalStorage();
        return { success: true, emptyLinesRemoved, spacersRemoved, pagesCleaned };
    } else {
        if (showFeedbackAlert) {
            alert("पेज में कोई अतिरिक्त खाली लाइन या गैप नहीं मिला। ✨");
        }
        return { success: false, emptyLinesRemoved: 0, spacersRemoved: 0, pagesCleaned: 0 };
    }
}

export function initLayoutOptimizer(callbacks) {
    optimizerCallbacks = callbacks;

    if (dom.smartShrinkBtn) {
        dom.smartShrinkBtn.addEventListener('click', () => {
            performSmartShrink(true);
        });
    }

    if (dom.removeGapsBtn) {
        dom.removeGapsBtn.addEventListener('click', () => {
            performRemoveDocumentGaps(false, true);
        });
    }
    if (dom.btnRemoveGaps) {
        dom.btnRemoveGaps.addEventListener('click', () => {
            performRemoveDocumentGaps(false, true);
        });
    }
}
