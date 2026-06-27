/* ==========================================================================
   SAMYAK - MAIN WORKSPACE ENTRYPOINT
   ========================================================================== */

import { state, dom, initDOM, sectionIcons } from './js/state.js';
import { openDB, getFromDB, saveToDB } from './js/db.js';
import {
    hindiDictionary,
    transliterateWord,
    getCaretCoordinates,
    generatePhoneticSuggestions,
    renderPhoneticSuggestionsTooltip,
    selectPhoneticSuggestion,
    hidePhoneticSuggestionsTooltip
} from './js/translit.js';
import {
    initParser,
    clearHeightEstimationCache,
    preProcessText,
    parseTextToBlocks,
    getBlockMarkdown,
    estimateBlockHeight,
    renderPreview,
    reorderDocumentSectionsByTOC,
    normalizeSecName
} from './js/parser.js';
import { initOcr, resetOcrDashProject, handleOcrDashFileSelection, triggerOcrDashBoundingBoxScan } from './js/ocr.js';
import { initPageGrid, renderGridPages, duplicatePageAt, deletePageAt } from './js/pageGrid.js';
import { initLayoutOptimizer, performSmartShrink, performRemoveDocumentGaps } from './js/layoutOptimizer.js';
import { initPdfGenerator, triggerPrintSequence } from './js/pdfGenerator.js';

// ==========================================
// CORE WORKSPACE OPERATIONS
// ==========================================

function saveCurrentInputState() {
    if (state.activePageIndex === 0) {
        if (!state.pagesData[0]) state.pagesData[0] = { type: 'cover' };
        state.pagesData[0].title = dom.docTitleInput.value;
        state.pagesData[0].tagline = dom.docTaglineInput.value;
        state.pagesData[0].subtitle = dom.docSubtitleInput.value;
        state.pagesData[0].theme = dom.docThemeInput.value;
        if (dom.coverThemeSelect) state.pagesData[0].coverTheme = dom.coverThemeSelect.value;
        if (dom.coverBorderPatternSelect) state.pagesData[0].coverBorderPattern = dom.coverBorderPatternSelect.value;
        if (dom.coverEmblemSelect) state.pagesData[0].coverEmblem = dom.coverEmblemSelect.value;
        if (dom.docClassificationInput) state.pagesData[0].classification = dom.docClassificationInput.value;
        if (dom.coverTitleSizeSlider) state.pagesData[0].titleSize = parseInt(dom.coverTitleSizeSlider.value, 10);
        if (dom.coverClassificationSizeSlider) state.pagesData[0].classificationSize = parseInt(dom.coverClassificationSizeSlider.value, 10);
        if (dom.coverTaglineSizeSlider) state.pagesData[0].taglineSize = parseInt(dom.coverTaglineSizeSlider.value, 10);
        if (dom.coverSubtitleSizeSlider) state.pagesData[0].subtitleSize = parseInt(dom.coverSubtitleSizeSlider.value, 10);
        if (dom.showTocToggle) state.pagesData[0].showTOC = dom.showTocToggle.checked;
    } else if (state.activePageIndex === state.pagesData.length) {
        state.lastPageData.title = dom.lastTitleInput.value;
        state.lastPageData.subtitle = dom.lastSubtitleInput.value;
        state.lastPageData.tagline = dom.lastTaglineInput.value;
    } else {
        if (state.pagesData[state.activePageIndex]) {
            state.pagesData[state.activePageIndex].text = dom.pageContentInput.value;
        }
    }
    
    // Watermark settings sync
    state.watermarkSettings.type = dom.watermarkTypeSelect.value;
    state.watermarkSettings.text = dom.watermarkTextInput.value;
    state.watermarkSettings.position = dom.watermarkPositionSelect.value;
    state.watermarkSettings.rotation = dom.watermarkRotationSelect.value;
    state.watermarkSettings.opacity = parseFloat(dom.watermarkOpacitySlider.value) / 100;
    state.watermarkSettings.size = parseInt(dom.watermarkSizeSlider.value, 10);
    state.watermarkSettings.color = dom.watermarkColorInput.value;

    // Custom Design settings sync
    state.customDesignSettings.sectionBg = dom.designSectionBg.value;
    state.customDesignSettings.sectionAccent = dom.designSectionAccent.value;
    state.customDesignSettings.sectionText = dom.designSectionText.value;
    state.customDesignSettings.sectionSize = dom.designSectionSize.value;
    state.customDesignSettings.sectionAlignment = dom.designSectionAlign.value;
    
    if (dom.designChapterNumSize) state.customDesignSettings.chapterNumSize = dom.designChapterNumSize.value;
    if (dom.designChapterTitleSize) state.customDesignSettings.chapterTitleSize = dom.designChapterTitleSize.value;
    if (dom.designChapterSubtitleSize) state.customDesignSettings.chapterSubtitleSize = dom.designChapterSubtitleSize.value;

    state.customDesignSettings.topicText = dom.designTopicText.value;
    state.customDesignSettings.topicBorder = dom.designTopicBorder.value;
    state.customDesignSettings.topicBorderStyle = dom.designTopicBorderStyle.value;
    state.customDesignSettings.topicMarginTop = dom.designTopicMargin.value.split(' ')[0] || '12px';
    state.customDesignSettings.topicMarginBottom = dom.designTopicMargin.value.split(' ')[1] || '4px';
    state.customDesignSettings.topicSize = dom.designTopicSize.value;
    state.customDesignSettings.topicThick = dom.designTopicThick.value;
    state.customDesignSettings.topicAlignment = dom.designTopicAlign.value;

    state.customDesignSettings.innerBorderColor = dom.designInnerBorder.value;
    state.customDesignSettings.cornerColor = dom.designCornerColor.value;
    state.customDesignSettings.borderThick = dom.designBorderThick.value;
    state.customDesignSettings.cornerSize = dom.designCornerSize.value;

    state.customDesignSettings.dividerColor = dom.designDividerColor.value;
    state.customDesignSettings.dividerStyle = dom.designDividerStyle.value;
    state.customDesignSettings.dividerThickness = dom.designDividerThick.value;

    if (dom.designEndStarSymbol) state.customDesignSettings.endStarSymbol = dom.designEndStarSymbol.value;
    if (dom.designEndStarColor) state.customDesignSettings.endStarColor = dom.designEndStarColor.value;
    if (dom.designEndStarSize) state.customDesignSettings.endStarSize = dom.designEndStarSize.value;
    if (dom.designEndStarPulse) state.customDesignSettings.endStarPulse = dom.designEndStarPulse.checked;

    state.customDesignSettings.pageNumColor = dom.designPageNumColor.value;
    state.customDesignSettings.pageNumPlacement = dom.designPageNumPlace.value;
    state.customDesignSettings.pageNumPrefix = dom.designPageNumPrefix.value;
    state.customDesignSettings.pageNumSize = dom.designPageNumSize.value;

    if (dom.pageMarginXInput) state.customDesignSettings.pageMarginX = dom.pageMarginXInput.value;
    if (dom.pageMarginYInput) state.customDesignSettings.pageMarginY = dom.pageMarginYInput.value;
    if (dom.pagePaddingXInput) state.customDesignSettings.pagePaddingX = dom.pagePaddingXInput.value;
    if (dom.pagePaddingYInput) state.customDesignSettings.pagePaddingY = dom.pagePaddingYInput.value;

    if (dom.designSectionShape) state.customDesignSettings.sectionShape = dom.designSectionShape.value;
    if (dom.designTopicIcon) state.customDesignSettings.topicIcon = dom.designTopicIcon.value;
    if (dom.designBulletStyle) state.customDesignSettings.bulletStyle = dom.designBulletStyle.value;
    if (dom.designExplanationStyle) state.customDesignSettings.explanationStyle = dom.designExplanationStyle.value;
    if (dom.designTableHeaderSize) state.customDesignSettings.tableHeaderFontSize = dom.designTableHeaderSize.value;
    if (dom.designTableBodySize) state.customDesignSettings.tableBodyFontSize = dom.designTableBodySize.value;
    if (dom.designTableColWidths) state.customDesignSettings.tableColWidths = dom.designTableColWidths.value;

    // Social settings sync
    state.socialSettings.telegramText = dom.footerTelegramInput.value;
    state.socialSettings.youtubeText = dom.footerYoutubeInput.value;
    state.socialSettings.fontSize = parseInt(dom.footerSocialSizeInput.value, 10);
    state.socialSettings.placement = dom.footerSocialPlacementSelect.value;
}

function saveWorkspaceToLocalStorage() {
    saveCurrentInputState();
    const workspaceState = {
        pagesData: state.pagesData,
        lastPageData: state.lastPageData,
        activePageIndex: state.activePageIndex,
        contentFontSize: state.contentFontSize,
        watermarkSettings: state.watermarkSettings,
        customDesignSettings: state.customDesignSettings,
        socialSettings: state.socialSettings,
        spacingSettings: {
            fontStyle: dom.globalFontStyleSelect.value,
            fontWeight: dom.globalFontWeightSelect.value,
            lineSpacing: dom.globalLineSpacingSelect.value,
            letterSpacing: dom.globalLetterSpacingSelect.value
        }
    };
    saveToDB('samyak_workspace_state', workspaceState).catch(e => console.error("Error saving workspace:", e));
}

function updateStats() {
    const fullText = state.pagesData.slice(1).map(p => p.text).join('\n');
    const cleanWords = fullText.split(/\s+/).filter(Boolean).length;
    if (dom.wordCountSpan) {
        dom.wordCountSpan.textContent = `Words: ${cleanWords}`;
    }
}

function updatePageTabsUI() {
    if (!dom.pageTabsList) return;
    dom.pageTabsList.innerHTML = '';
    
    const showCover = (state.pagesData[0] && state.pagesData[0].showCoverPage !== false);
    
    if (showCover) {
        const coverTab = createPageTabDOM(0, '🎨 Cover Page');
        dom.pageTabsList.appendChild(coverTab);
    }
    
    for (let i = 1; i < state.pagesData.length; i++) {
        const pageText = state.pagesData[i].text ? state.pagesData[i].text.trim().substring(0, 16).replace(/[#*`>🔶•-]/g, '').trim() : '';
        const label = pageText ? `📄 Page ${i + 1} (${pageText})` : `📄 Page ${i + 1} (Empty)`;
        const tab = createPageTabDOM(i, label);
        dom.pageTabsList.appendChild(tab);
    }
    
    const endTab = createPageTabDOM(state.pagesData.length, '🏁 End Page');
    dom.pageTabsList.appendChild(endTab);
}

function createPageTabDOM(idx, label) {
    const item = document.createElement('div');
    item.className = 'page-tab-item' + (idx === state.activePageIndex ? ' active' : '');
    item.textContent = label;
    
    const previewPages = dom.pagesContainer.querySelectorAll('.a4-page');
    if (previewPages && previewPages[idx] && previewPages[idx].classList.contains('page-overflow')) {
        item.classList.add('overflow-warning');
        item.innerHTML += ' ⚠️';
    }

    item.addEventListener('click', () => {
        switchActivePage(idx);
    });
    return item;
}

function switchActivePage(idx, syncUI = true) {
    if (syncUI) {
        saveCurrentInputState();
    }
    
    state.activePageIndex = Math.max(0, Math.min(idx, state.pagesData.length));
    
    dom.coverEditorZone.style.display = 'none';
    dom.contentEditorZone.style.display = 'none';
    dom.lastEditorZone.style.display = 'none';
    
    if (state.activePageIndex === 0) {
        dom.coverEditorZone.style.display = 'flex';
        if (syncUI) {
            const cover = state.pagesData[0] || {};
            dom.docTitleInput.value = cover.title || '';
            dom.docTaglineInput.value = cover.tagline || '';
            dom.docSubtitleInput.value = cover.subtitle || '';
            dom.docThemeInput.value = cover.theme || 'royal-durbar';
            if (dom.coverThemeSelect) dom.coverThemeSelect.value = cover.coverTheme || 'default';
            if (dom.coverBorderPatternSelect) dom.coverBorderPatternSelect.value = cover.coverBorderPattern || 'solid';
            if (dom.coverEmblemSelect) dom.coverEmblemSelect.value = cover.coverEmblem || 'none';
            if (dom.docClassificationInput) dom.docClassificationInput.value = cover.classification || '';
            if (dom.coverTitleSizeSlider) {
                dom.coverTitleSizeSlider.value = cover.titleSize || 52;
                dom.coverTitleSizeVal.textContent = `${cover.titleSize || 52}px`;
            }
            if (dom.coverClassificationSizeSlider) {
                dom.coverClassificationSizeSlider.value = cover.classificationSize || 24;
                dom.coverClassificationSizeVal.textContent = `${cover.classificationSize || 24}px`;
            }
            if (dom.coverTaglineSizeSlider) {
                dom.coverTaglineSizeSlider.value = cover.taglineSize || 20;
                dom.coverTaglineSizeVal.textContent = `${cover.taglineSize || 20}px`;
            }
            if (dom.coverSubtitleSizeSlider) {
                dom.coverSubtitleSizeSlider.value = cover.subtitleSize || 21;
                dom.coverSubtitleSizeVal.textContent = `${cover.subtitleSize || 21}px`;
            }
            if (dom.showTocToggle) dom.showTocToggle.checked = cover.showTOC !== false;
        }
    } else if (state.activePageIndex === state.pagesData.length) {
        dom.lastEditorZone.style.display = 'flex';
        if (syncUI) {
            dom.lastTitleInput.value = state.lastPageData.title || '';
            dom.lastSubtitleInput.value = state.lastPageData.subtitle || '';
            dom.lastTaglineInput.value = state.lastPageData.tagline || '';
        }
    } else {
        dom.contentEditorZone.style.display = 'flex';
        if (syncUI && state.pagesData[state.activePageIndex]) {
            dom.pageContentInput.value = state.pagesData[state.activePageIndex].text || '';
        }
    }

    if (state.activePageIndex === 0) {
        dom.activePageLabel.textContent = 'Cover Page';
    } else if (state.activePageIndex === state.pagesData.length) {
        dom.activePageLabel.textContent = 'End Page';
    } else {
        dom.activePageLabel.textContent = `Page ${state.activePageIndex + 1}`;
    }
    
    updatePageTabsUI();
    
    const previewPages = dom.pagesContainer.querySelectorAll('.a4-page');
    if (previewPages && previewPages[state.activePageIndex]) {
        previewPages[state.activePageIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        previewPages.forEach(p => p.classList.remove('active-block-highlight'));
        previewPages[state.activePageIndex].classList.add('active-block-highlight');
    }
    
    updateStats();
}

function addPage() {
    saveCurrentInputState();
    const newPage = {
        type: 'content',
        text: '',
        layout: 'two-column'
    };
    state.pagesData.push(newPage);
    renderPreview();
    switchActivePage(state.pagesData.length - 1);
    saveWorkspaceToLocalStorage();
}

function deletePage() {
    if (state.activePageIndex === 0) {
        alert("The Cover Page cannot be deleted!");
        return;
    }
    if (state.activePageIndex === state.pagesData.length) {
        alert("The End Page cannot be deleted!");
        return;
    }
    if (state.pagesData.length <= 2) {
        alert("At least one Content Page is required!");
        return;
    }
    if (confirm(`Are you sure you want to delete Page ${state.activePageIndex}?`)) {
        state.pagesData.splice(state.activePageIndex, 1);
        const newIndex = Math.min(state.activePageIndex, state.pagesData.length - 1);
        renderPreview();
        switchActivePage(newIndex);
        saveWorkspaceToLocalStorage();
    }
}

// Snappy live preview render debounce (300ms)
let renderDebounceTimer = null;
function debouncedRenderAndSave() {
    clearTimeout(renderDebounceTimer);
    renderDebounceTimer = setTimeout(() => {
        renderPreview();
        saveWorkspaceToLocalStorage();
    }, 300);
}

// ==========================================
// THEME SWITCH & UTILITIES
// ==========================================

function applyTheme(themeName, isManualChange = false) {
    const classesToRemove = Array.from(document.body.classList).filter(c => c.startsWith('theme-'));
    classesToRemove.forEach(c => document.body.classList.remove(c));

    if (themeName !== 'maroon-gold') {
        document.body.classList.add(`theme-${themeName}`);
    }

    if (isManualChange) {
        saveWorkspaceToLocalStorage();
        renderPreview();
    }
}

function updateDocumentTitle() {
    const titleVal = dom.docTitleInput ? dom.docTitleInput.value.trim() : '';
    const subtitleVal = dom.docSubtitleInput ? dom.docSubtitleInput.value.trim() : '';
    
    let docTitle = 'Samyak Document';
    if (titleVal) {
        docTitle = titleVal;
        if (subtitleVal) docTitle += ` - ${subtitleVal}`;
    } else if (subtitleVal) {
        docTitle = subtitleVal;
    }
    document.title = docTitle + ' | Samyak';
}

// ==========================================
// WORKSPACE INITIALIZATION & RESTORATION
// ==========================================

function loadWorkspaceFromLocalStorage() {
    return Promise.all([
        getFromDB('samyak_workspace_state'),
        getFromDB('samyak_uploaded_images'),
        getFromDB('samyak_image_counter')
    ])
    .then(([workspaceState, savedImages, savedCounter]) => {
        clearHeightEstimationCache();
        if (!workspaceState) return false;
        
        try {
            state.pagesData = workspaceState.pagesData || [];
            state.lastPageData = workspaceState.lastPageData || { title: 'THANK YOU', subtitle: 'Samyak', tagline: 'कोचिंग नहीं क्रांति' };
            state.activePageIndex = (state.pagesData.length > 1) ? 1 : 0;
            state.contentFontSize = workspaceState.contentFontSize || 16.1;
            state.watermarkSettings = workspaceState.watermarkSettings || state.watermarkSettings;
            state.customDesignSettings = workspaceState.customDesignSettings || state.customDesignSettings;
            
            state.socialSettings = workspaceState.socialSettings || { telegramText: '', youtubeText: '' };
            state.uploadedImages = savedImages || {};
            state.imageCounter = savedCounter || 1;

            if (state.pagesData[0]) {
                dom.docTitleInput.value = state.pagesData[0].title || '';
                dom.docTaglineInput.value = state.pagesData[0].tagline || '';
                dom.docSubtitleInput.value = state.pagesData[0].subtitle || '';
                dom.docThemeInput.value = state.pagesData[0].theme || 'royal-durbar';
                if (dom.coverThemeSelect) dom.coverThemeSelect.value = state.pagesData[0].coverTheme || 'default';
                if (dom.coverBorderPatternSelect) dom.coverBorderPatternSelect.value = state.pagesData[0].coverBorderPattern || 'solid';
                if (dom.coverEmblemSelect) dom.coverEmblemSelect.value = state.pagesData[0].coverEmblem || 'none';
                if (dom.docClassificationInput) dom.docClassificationInput.value = state.pagesData[0].classification || '';
                if (dom.coverTitleSizeSlider) {
                    dom.coverTitleSizeSlider.value = state.pagesData[0].titleSize || 52;
                    dom.coverTitleSizeVal.textContent = `${dom.coverTitleSizeSlider.value}px`;
                }
                if (dom.coverClassificationSizeSlider) {
                    dom.coverClassificationSizeSlider.value = state.pagesData[0].classificationSize || 24;
                    dom.coverClassificationSizeVal.textContent = `${dom.coverClassificationSizeSlider.value}px`;
                }
                if (dom.coverTaglineSizeSlider) {
                    dom.coverTaglineSizeSlider.value = state.pagesData[0].taglineSize || 20;
                    dom.coverTaglineSizeVal.textContent = `${dom.coverTaglineSizeSlider.value}px`;
                }
                if (dom.coverSubtitleSizeSlider) {
                    dom.coverSubtitleSizeSlider.value = state.pagesData[0].subtitleSize || 21;
                    dom.coverSubtitleSizeVal.textContent = `${dom.coverSubtitleSizeSlider.value}px`;
                }
                if (dom.showTocToggle) dom.showTocToggle.checked = state.pagesData[0].showTOC !== false;
            }
            if (state.lastPageData) {
                dom.lastTitleInput.value = state.lastPageData.title || 'THANK YOU';
                dom.lastSubtitleInput.value = state.lastPageData.subtitle || 'Samyak';
                dom.lastTaglineInput.value = state.lastPageData.tagline || 'कोचिंग नहीं क्रांति';
            }

            if (dom.footerTelegramInput) dom.footerTelegramInput.value = state.socialSettings.telegramText || '';
            if (dom.footerYoutubeInput) dom.footerYoutubeInput.value = state.socialSettings.youtubeText || '';
            
            if (workspaceState.spacingSettings) {
                dom.globalFontStyleSelect.value = workspaceState.spacingSettings.fontStyle || 'modern-sans';
                dom.globalFontWeightSelect.value = workspaceState.spacingSettings.fontWeight || '500';
                dom.globalLineSpacingSelect.value = workspaceState.spacingSettings.lineSpacing || '1.45';
                dom.globalLetterSpacingSelect.value = workspaceState.spacingSettings.letterSpacing || '0px';
            }
            
            dom.fontSizeValSpan.textContent = `${state.contentFontSize}px`;
            document.documentElement.style.setProperty('--content-font-size', `${state.contentFontSize}px`);
            document.documentElement.style.setProperty('--content-font-weight', dom.globalFontWeightSelect.value);
            document.documentElement.style.setProperty('--content-line-height', dom.globalLineSpacingSelect.value);
            document.documentElement.style.setProperty('--content-letter-spacing', dom.globalLetterSpacingSelect.value);
            
            document.body.classList.remove('font-poppins-sans', 'font-traditional-serif', 'font-hybrid-style');
            if (dom.globalFontStyleSelect.value !== 'modern-sans') {
                document.body.classList.add(`font-${dom.globalFontStyleSelect.value}`);
            }

            dom.watermarkTypeSelect.value = state.watermarkSettings.type;
            dom.watermarkTextInput.value = state.watermarkSettings.text;
            dom.watermarkPositionSelect.value = state.watermarkSettings.position;
            dom.watermarkRotationSelect.value = state.watermarkSettings.rotation;
            dom.watermarkOpacitySlider.value = state.watermarkSettings.opacity * 100;
            dom.watermarkOpacityVal.textContent = `${state.watermarkSettings.opacity * 100}%`;
            dom.watermarkSizeSlider.value = state.watermarkSettings.size;
            dom.watermarkSizeVal.textContent = `${state.watermarkSettings.size}px`;
            dom.watermarkColorInput.value = state.watermarkSettings.color;
            
            dom.watermarkTextGroup.style.display = (state.watermarkSettings.type === 'text') ? 'flex' : 'none';
            dom.watermarkColorGroup.style.display = (state.watermarkSettings.type === 'text') ? 'flex' : 'none';
            dom.watermarkImageGroup.style.display = (state.watermarkSettings.type === 'image') ? 'flex' : 'none';

            const restoredTheme = (state.pagesData[0] && state.pagesData[0].theme) || 'royal-durbar';
            if (dom.docThemeInput) {
                dom.docThemeInput.value = restoredTheme;
            }
            localStorage.setItem('samyak-global-theme', restoredTheme);
            applyTheme(restoredTheme, false);

            applyCustomDesignSettingsToDOM();

            switchActivePage(state.activePageIndex, false);
            renderPreview();
            
            updateDocumentTitle();
            return true;
        } catch (e) {
            console.error("Error setting state from IndexedDB:", e);
            return false;
        }
    })
    .catch(e => {
        console.error("Error loading IndexedDB state:", e);
        return false;
    });
}

function clearWorkspaceContent() {
    const activeTheme = 'royal-durbar';
    localStorage.setItem('samyak-global-theme', activeTheme);
    applyTheme(activeTheme, false);

    state.isTightCompaction = false;
    localStorage.setItem('samyak-tight-compaction', 'false');
    document.body.classList.remove('tight-compaction');
    if (dom.tightCompactionToggle) {
        dom.tightCompactionToggle.checked = false;
    }
    if (dom.showCoverPageToggle) {
        dom.showCoverPageToggle.checked = true;
    }

    const currentCover = {
        type: 'cover',
        title: '',
        tagline: '',
        subtitle: '',
        theme: activeTheme,
        coverTheme: 'default',
        coverBorderPattern: 'solid',
        coverEmblem: 'none',
        classification: '',
        titleSize: 52,
        classificationSize: 24,
        taglineSize: 20,
        subtitleSize: 21,
        showTOC: true,
        showCoverPage: true
    };

    state.pagesData = [
        currentCover,
        {
            type: 'content',
            text: '',
            layout: 'two-column'
        }
    ];
    
    state.activePageIndex = 1;
    
    dom.docTitleInput.value = '';
    dom.docTaglineInput.value = '';
    dom.docSubtitleInput.value = '';
    if (dom.docClassificationInput) dom.docClassificationInput.value = '';
    if (dom.coverTitleSizeSlider) {
        dom.coverTitleSizeSlider.value = 52;
        dom.coverTitleSizeVal.textContent = '52px';
    }
    if (dom.coverClassificationSizeSlider) {
        dom.coverClassificationSizeSlider.value = 24;
        dom.coverClassificationSizeVal.textContent = '24px';
    }
    if (dom.coverTaglineSizeSlider) {
        dom.coverTaglineSizeSlider.value = 20;
        dom.coverTaglineSizeVal.textContent = '20px';
    }
    if (dom.coverSubtitleSizeSlider) {
        dom.coverSubtitleSizeSlider.value = 21;
        dom.coverSubtitleSizeVal.textContent = '21px';
    }
    
    dom.docThemeInput.value = activeTheme;
    dom.docThemeInput.dispatchEvent(new Event('change'));
    
    state.uploadedImages = {};
    state.imageCounter = 1;
    saveToDB('samyak_uploaded_images', {});
    saveToDB('samyak_image_counter', 1);
    clearHeightEstimationCache();
    
    switchActivePage(1);
    switchSidebarTab('panel-pages');
}

function applyCustomDesignSettingsToDOM() {
    state.cachedMaxContentHeight = null;
    if (dom.compactSpacingToggle) {
        dom.compactSpacingToggle.checked = !!state.customDesignSettings.compactMode;
    }
    if (dom.tightCompactionToggle) {
        dom.tightCompactionToggle.checked = !!state.isTightCompaction;
    }
    if (dom.showCoverPageToggle) {
        dom.showCoverPageToggle.checked = (state.pagesData[0] && state.pagesData[0].showCoverPage !== false);
    }
    document.body.classList.toggle('compact-mode', !!state.customDesignSettings.compactMode);

    const styles = getComputedStyle(document.body);
    const primary = styles.getPropertyValue('--primary-color').trim() || '#850f0f';
    const secondary = styles.getPropertyValue('--secondary-color').trim() || '#c5a353';
    const accent = styles.getPropertyValue('--accent-color').trim() || '#1d6ea5';

    document.documentElement.style.setProperty('--custom-header-font-size', `${state.customDesignSettings.pageNumSize || 15}px`);
    document.documentElement.style.setProperty('--custom-chapter-num-size', `${state.customDesignSettings.chapterNumSize || 20}px`);
    document.documentElement.style.setProperty('--custom-chapter-title-size', `${state.customDesignSettings.chapterTitleSize || 22}px`);
    document.documentElement.style.setProperty('--custom-chapter-subtitle-size', `${state.customDesignSettings.chapterSubtitleSize || 14}px`);
    document.documentElement.style.setProperty('--custom-section-bg', state.customDesignSettings.sectionBg || primary);
    document.documentElement.style.setProperty('--custom-section-border-left', state.customDesignSettings.sectionAccent || accent);
    document.documentElement.style.setProperty('--custom-section-text', state.customDesignSettings.sectionText || '#ffffff');
    document.documentElement.style.setProperty('--custom-section-size', `${state.customDesignSettings.sectionSize || 18}px`);

    const secAlign = state.customDesignSettings.sectionAlignment || 'left';
    document.documentElement.style.setProperty('--custom-section-align', secAlign);
    if (secAlign === 'center') {
        document.documentElement.style.setProperty('--custom-section-display', 'block');
        document.documentElement.style.setProperty('--custom-section-width', '100%');
        document.documentElement.style.setProperty('--custom-section-align-self', 'stretch');
        document.documentElement.style.setProperty('--custom-section-border-right', `6px solid ${state.customDesignSettings.sectionAccent || accent}`);
        document.documentElement.style.setProperty('--custom-section-border-radius', '4px');
    } else {
        document.documentElement.style.setProperty('--custom-section-display', 'inline-block');
        document.documentElement.style.setProperty('--custom-section-width', 'max-content');
        document.documentElement.style.setProperty('--custom-section-align-self', 'flex-start');
        document.documentElement.style.setProperty('--custom-section-border-right', 'none');
        document.documentElement.style.setProperty('--custom-section-border-radius', '0 4px 4px 0');
    }

    document.documentElement.style.setProperty('--custom-topic-text', state.customDesignSettings.topicText || accent);
    document.documentElement.style.setProperty('--custom-topic-border-color', state.customDesignSettings.topicBorder || secondary);
    document.documentElement.style.setProperty('--custom-topic-border-color-val', state.customDesignSettings.topicBorder || secondary);
    document.documentElement.style.setProperty('--custom-topic-border-style', state.customDesignSettings.topicBorderStyle || 'dashed');
    document.documentElement.style.setProperty('--custom-topic-margin-top', state.customDesignSettings.topicMarginTop || '4px');
    document.documentElement.style.setProperty('--custom-topic-margin-bottom', state.customDesignSettings.topicMarginBottom || '2px');
    document.documentElement.style.setProperty('--custom-topic-size', `${state.customDesignSettings.topicSize || 15}px`);
    document.documentElement.style.setProperty('--custom-topic-border-thickness', `${state.customDesignSettings.topicThick || 1.5}px`);
    document.documentElement.style.setProperty('--custom-topic-alignment', state.customDesignSettings.topicAlignment || 'flex-start');

    document.documentElement.style.setProperty('--custom-inner-border-color', state.customDesignSettings.innerBorderColor || secondary);
    document.documentElement.style.setProperty('--custom-corner-color', state.customDesignSettings.cornerColor || secondary);
    document.documentElement.style.setProperty('--custom-inner-border-thickness', `${state.customDesignSettings.borderThick !== undefined ? state.customDesignSettings.borderThick : 0}px`);
    document.documentElement.style.setProperty('--custom-corner-size', `${state.customDesignSettings.cornerSize !== undefined ? state.customDesignSettings.cornerSize : 10}px`);

    document.documentElement.style.setProperty('--custom-divider-color', state.customDesignSettings.dividerColor || secondary);
    document.documentElement.style.setProperty('--custom-divider-style', state.customDesignSettings.dividerStyle || 'dashed');
    document.documentElement.style.setProperty('--custom-divider-thickness', `${state.customDesignSettings.dividerThickness || 1.5}px`);

    document.documentElement.style.setProperty('--custom-page-margin-x', `${state.customDesignSettings.pageMarginX || 8}mm`);
    document.documentElement.style.setProperty('--custom-page-margin-y', `${state.customDesignSettings.pageMarginY || 6}mm`);
    document.documentElement.style.setProperty('--custom-page-padding-x', `${state.customDesignSettings.pagePaddingX || 6}mm`);
    document.documentElement.style.setProperty('--custom-page-padding-y', `${state.customDesignSettings.pagePaddingY || 4}mm`);

    document.documentElement.style.setProperty('--table-header-font-size', `${state.customDesignSettings.tableHeaderFontSize || 12.5}px`);
    document.documentElement.style.setProperty('--table-body-font-size', `${state.customDesignSettings.tableBodyFontSize || 11.5}px`);

    const esc = state.customDesignSettings.endStarColor || secondary;
    document.documentElement.style.setProperty('--custom-end-star-color', esc);
    document.documentElement.style.setProperty('--custom-end-star-size', `${state.customDesignSettings.endStarSize || 18}px`);
    document.documentElement.style.setProperty('--custom-end-star-animation', (state.customDesignSettings.endStarPulse !== false) ? 'pulseStar 3s ease-in-out infinite' : 'none');
    
    if (esc.startsWith('#') && esc.length === 7) {
        const r = parseInt(esc.substring(1, 3), 16);
        const g = parseInt(esc.substring(3, 5), 16);
        const b = parseInt(esc.substring(5, 7), 16);
        document.documentElement.style.setProperty('--custom-end-star-shadow', `rgba(${r}, ${g}, ${b}, 0.35)`);
    } else {
        if (secondary.startsWith('#') && secondary.length === 7) {
            const r = parseInt(secondary.substring(1, 3), 16);
            const g = parseInt(secondary.substring(3, 5), 16);
            const b = parseInt(secondary.substring(5, 7), 16);
            document.documentElement.style.setProperty('--custom-end-star-shadow', `rgba(${r}, ${g}, ${b}, 0.35)`);
        } else {
            document.documentElement.style.setProperty('--custom-end-star-shadow', 'rgba(197, 162, 83, 0.35)');
        }
    }

    // Sync input UI values
    dom.designSectionBg.value = state.customDesignSettings.sectionBg || primary;
    dom.designSectionAccent.value = state.customDesignSettings.sectionAccent || accent;
    dom.designSectionText.value = state.customDesignSettings.sectionText || '#ffffff';
    dom.designSectionSize.value = state.customDesignSettings.sectionSize || '18';
    dom.designSectionSizeVal.textContent = `${state.customDesignSettings.sectionSize || 18}px`;
    dom.designSectionAlign.value = secAlign;

    if (dom.designChapterNumSize) {
        dom.designChapterNumSize.value = state.customDesignSettings.chapterNumSize || '20';
        if (dom.designChapterNumSizeVal) dom.designChapterNumSizeVal.textContent = `${state.customDesignSettings.chapterNumSize || 20}px`;
    }
    if (dom.designChapterTitleSize) {
        dom.designChapterTitleSize.value = state.customDesignSettings.chapterTitleSize || '22';
        if (dom.designChapterTitleSizeVal) dom.designChapterTitleSizeVal.textContent = `${state.customDesignSettings.chapterTitleSize || 22}px`;
    }
    if (dom.designChapterSubtitleSize) {
        dom.designChapterSubtitleSize.value = state.customDesignSettings.chapterSubtitleSize || '14';
        if (dom.designChapterSubtitleSizeVal) dom.designChapterSubtitleSizeVal.textContent = `${state.customDesignSettings.chapterSubtitleSize || 14}px`;
    }

    dom.designTopicText.value = state.customDesignSettings.topicText || accent;
    dom.designTopicBorder.value = state.customDesignSettings.topicBorder || secondary;
    dom.designTopicBorderStyle.value = state.customDesignSettings.topicBorderStyle || 'dashed';
    dom.designTopicMargin.value = `${state.customDesignSettings.topicMarginTop || '4px'} ${state.customDesignSettings.topicMarginBottom || '2px'}`;
    dom.designTopicSize.value = state.customDesignSettings.topicSize || '15';
    dom.designTopicSizeVal.textContent = `${state.customDesignSettings.topicSize || 15}px`;
    dom.designTopicThick.value = state.customDesignSettings.topicThick || '1.5';
    dom.designTopicThickVal.textContent = `${state.customDesignSettings.topicThick || 1.5}px`;
    dom.designTopicAlign.value = state.customDesignSettings.topicAlignment || 'flex-start';

    dom.designInnerBorder.value = state.customDesignSettings.innerBorderColor || secondary;
    dom.designCornerColor.value = state.customDesignSettings.cornerColor || secondary;
    dom.designBorderThick.value = state.customDesignSettings.borderThick !== undefined ? state.customDesignSettings.borderThick : '0';
    dom.designBorderThickVal.textContent = `${state.customDesignSettings.borderThick !== undefined ? state.customDesignSettings.borderThick : 0}px`;
    dom.designCornerSize.value = state.customDesignSettings.cornerSize !== undefined ? state.customDesignSettings.cornerSize : '10';
    dom.designCornerSizeVal.textContent = `${state.customDesignSettings.cornerSize !== undefined ? state.customDesignSettings.cornerSize : 10}px`;

    dom.designDividerColor.value = state.customDesignSettings.dividerColor || secondary;
    dom.designDividerStyle.value = state.customDesignSettings.dividerStyle || 'dashed';
    dom.designDividerThick.value = state.customDesignSettings.dividerThickness || '1.5';
    dom.designDividerThickVal.textContent = `${state.customDesignSettings.dividerThickness || 1.5}px`;

    if (dom.designEndStarSymbol) dom.designEndStarSymbol.value = state.customDesignSettings.endStarSymbol || '✦';
    if (dom.designEndStarColor) dom.designEndStarColor.value = state.customDesignSettings.endStarColor || secondary;
    if (dom.designEndStarSize) dom.designEndStarSize.value = state.customDesignSettings.endStarSize || '18';
    if (dom.designEndStarSizeVal) dom.designEndStarSizeVal.textContent = `${state.customDesignSettings.endStarSize || 18}px`;
    if (dom.designEndStarPulse) dom.designEndStarPulse.checked = (state.customDesignSettings.endStarPulse !== false);

    dom.designPageNumColor.value = state.customDesignSettings.pageNumColor || primary;
    dom.designPageNumPlace.value = state.customDesignSettings.pageNumPlacement || 'bottom-center';
    dom.designPageNumPrefix.value = state.customDesignSettings.pageNumPrefix || 'पेज - ';
    dom.designPageNumSize.value = state.customDesignSettings.pageNumSize || '15';
    dom.designPageNumSizeVal.textContent = `${state.customDesignSettings.pageNumSize || 15}px`;

    if (dom.pageMarginXInput) {
        dom.pageMarginXInput.value = state.customDesignSettings.pageMarginX || '8';
        if (dom.marginXValSpan) dom.marginXValSpan.textContent = `${state.customDesignSettings.pageMarginX || 8}mm`;
    }
    if (dom.pageMarginYInput) {
        dom.pageMarginYInput.value = state.customDesignSettings.pageMarginY || '6';
        if (dom.marginYValSpan) dom.marginYValSpan.textContent = `${state.customDesignSettings.pageMarginY || 6}mm`;
    }
    if (dom.pagePaddingXInput) {
        dom.pagePaddingXInput.value = state.customDesignSettings.pagePaddingX || '6';
        if (dom.paddingXValSpan) dom.paddingXValSpan.textContent = `${state.customDesignSettings.pagePaddingX || 6}mm`;
    }
    if (dom.pagePaddingYInput) {
        dom.pagePaddingYInput.value = state.customDesignSettings.pagePaddingY || '4';
        if (dom.paddingYValSpan) dom.paddingYValSpan.textContent = `${state.customDesignSettings.pagePaddingY || 4}mm`;
    }

    if (dom.designSectionShape) dom.designSectionShape.value = state.customDesignSettings.sectionShape || 'rectangle';
    if (dom.designTopicIcon) dom.designTopicIcon.value = state.customDesignSettings.topicIcon || 'orange-diamond';
    if (dom.designBulletStyle) dom.designBulletStyle.value = state.customDesignSettings.bulletStyle || 'classic';
    if (dom.designExplanationStyle) dom.designExplanationStyle.value = state.customDesignSettings.explanationStyle || 'modern-accent';
    if (dom.designTableHeaderSize) {
        dom.designTableHeaderSize.value = state.customDesignSettings.tableHeaderFontSize || '12.5';
        if (dom.designTableHeaderSizeVal) dom.designTableHeaderSizeVal.textContent = `${state.customDesignSettings.tableHeaderFontSize || 12.5}px`;
    }
    if (dom.designTableBodySize) {
        dom.designTableBodySize.value = state.customDesignSettings.tableBodyFontSize || '11.5';
        if (dom.designTableBodySizeVal) dom.designTableBodySizeVal.textContent = `${state.customDesignSettings.tableBodyFontSize || 11.5}px`;
    }
    if (dom.designTableColWidths) dom.designTableColWidths.value = state.customDesignSettings.tableColWidths || '';

    if (dom.headerLogoPreview && dom.headerLogoPreviewGroup) {
        if (state.customDesignSettings.headerLogoSrc) {
            dom.headerLogoPreview.src = state.customDesignSettings.headerLogoSrc;
            dom.headerLogoPreviewGroup.style.display = 'block';
        } else {
            dom.headerLogoPreview.src = '';
            dom.headerLogoPreviewGroup.style.display = 'none';
        }
    }
}

// ==========================================
// ACCORDIONS, TABS & LAYOUT DYNAMICS
// ==========================================

function switchSidebarTab(tabId) {
    const tabs = ['panel-editor', 'panel-pages', 'panel-design', 'panel-watermark', 'panel-social', 'panel-ocr'];
    tabs.forEach(t => {
        const btn = document.querySelector(`.sidebar-tab-btn[data-target="${t}"]`);
        const panel = document.getElementById(t);
        if (btn) btn.classList.toggle('active', t === tabId);
        if (panel) panel.style.display = (t === tabId) ? 'flex' : 'none';
    });
}

function updateZoom() {
    if (dom.zoomLevelSpan && dom.pagesContainer) {
        dom.zoomLevelSpan.textContent = `${state.zoomLevel}%`;
        dom.pagesContainer.style.transform = `scale(${state.zoomLevel / 100})`;
    }
}

// caret absolute location helper for tooltips
function safeScrollToElement(el) {
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ==========================================
// DRAG-AND-DROP MARKDOWN BLOCKS REORDERING
// ==========================================

function reorderMarkdownBlocks(draggedId, dropId, isBefore) {
    saveCurrentInputState();
    const fullContent = state.pagesData.slice(1).map(p => p.text).join('\n');
    const blocks = parseTextToBlocks(fullContent);
    
    blocks.forEach((b, idx) => {
        b.id = idx;
    });
    
    const draggedBlockIndex = blocks.findIndex(b => b.id === draggedId);
    if (draggedBlockIndex === -1) return;
    
    const [draggedBlock] = blocks.splice(draggedBlockIndex, 1);
    const dropBlockIndex = blocks.findIndex(b => b.id === dropId);
    if (dropBlockIndex === -1) return;
    
    const insertIndex = isBefore ? dropBlockIndex : dropBlockIndex + 1;
    blocks.splice(insertIndex, 0, draggedBlock);
    
    const newMarkdown = blocks.map(b => getBlockMarkdown(b)).join('\n');
    
    const cover = state.pagesData[0];
    const layouts = state.pagesData.slice(1).map(p => p.layout || 'two-column');
    if (layouts.length === 0) layouts.push('two-column');
    
    const newPages = layouts.map((lay, idx) => ({
        type: 'content',
        text: (idx === 0) ? newMarkdown : '',
        layout: lay
    }));
    state.pagesData = [cover, ...newPages];
    
    renderPreview();
    saveWorkspaceToLocalStorage();
}

// ==========================================
// INITIAL APPLICATION SETUP
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    state.domInitialized = true;

    // Arrange toolbar widgets
    const renderToolbarLayout = () => {
        const toolbar = document.querySelector('.editor-toolbar');
        const trayDrawer = dom.toolbarTrayDrawer;
        const trayTrigger = dom.toolbarTrayTrigger;
        if (!toolbar || !trayDrawer || !trayTrigger) return;
        
        state.currentToolbarLayout.main.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) toolbar.insertBefore(btn, trayTrigger);
        });
        state.currentToolbarLayout.tray.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) trayDrawer.appendChild(btn);
        });
    };
    renderToolbarLayout();

    // Bind subcomponents init procedures
    initParser({ saveWorkspaceToLocalStorage, switchActivePage, saveCurrentInputState });
    initOcr({ addPage, switchActivePage, renderPreview, saveWorkspaceToLocalStorage, updateStats, switchSidebarTab });
    initPageGrid({ addPage, switchActivePage, renderPreview, saveWorkspaceToLocalStorage, saveCurrentInputState });
    initLayoutOptimizer({ renderPreview, saveWorkspaceToLocalStorage, saveCurrentInputState });
    initPdfGenerator({ renderPreview, saveCurrentInputState });

    // Sidebar navigation tabs
    const sidebarTabButtons = document.querySelectorAll('.sidebar-tab-btn');
    sidebarTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            switchSidebarTab(target);
        });
    });

    // Option settings input dynamic auto-save & preview sync
    const autoSyncInputs = [
        dom.docTitleInput, dom.docTaglineInput, dom.docSubtitleInput,
        dom.coverThemeSelect, dom.coverBorderPatternSelect, dom.coverEmblemSelect,
        dom.docClassificationInput, dom.coverTitleSizeSlider,
        dom.coverClassificationSizeSlider, dom.coverTaglineSizeSlider, dom.coverSubtitleSizeSlider,
        dom.showTocToggle, dom.lastTitleInput, dom.lastSubtitleInput, dom.lastTaglineInput,
        dom.watermarkTypeSelect, dom.watermarkTextInput, dom.watermarkPositionSelect,
        dom.watermarkRotationSelect, dom.watermarkOpacitySlider, dom.watermarkSizeSlider,
        dom.watermarkColorInput, dom.designSectionBg, dom.designSectionAccent,
        dom.designSectionText, dom.designSectionSize, dom.designSectionAlign,
        dom.designChapterNumSize, dom.designChapterTitleSize, dom.designChapterSubtitleSize,
        dom.designTopicText, dom.designTopicBorder, dom.designTopicBorderStyle,
        dom.designTopicMargin, dom.designTopicSize, dom.designTopicThick, dom.designTopicAlign,
        dom.designInnerBorder, dom.designCornerColor, dom.designBorderThick, dom.designCornerSize,
        dom.designDividerColor, dom.designDividerStyle, dom.designDividerThick,
        dom.designEndStarSymbol, dom.designEndStarColor, dom.designEndStarSize, dom.designEndStarPulse,
        dom.designPageNumColor, dom.designPageNumPlace, dom.designPageNumPrefix, dom.designPageNumSize,
        dom.pageMarginXInput, dom.pageMarginYInput, dom.pagePaddingXInput, dom.pagePaddingYInput,
        dom.designSectionShape, dom.designTopicIcon, dom.designBulletStyle, dom.designExplanationStyle,
        dom.designTableHeaderSize, dom.designTableBodySize, dom.designTableColWidths,
        dom.footerTelegramInput, dom.footerYoutubeInput, dom.footerSocialSizeInput,
        dom.footerSocialPlacementSelect, dom.pageLayoutSelect, dom.compactSpacingToggle,
        dom.tightCompactionToggle, dom.showCoverPageToggle, dom.pageTemplateSelect
    ];

    autoSyncInputs.forEach(input => {
        if (!input) return;
        
        const eventType = (input.type === 'range' || input.type === 'text' || input.tagName === 'TEXTAREA') ? 'input' : 'change';
        input.addEventListener(eventType, () => {
            saveCurrentInputState();
            
            // Labels visual sync for range sliders
            if (input === dom.watermarkOpacitySlider && dom.watermarkOpacityVal) {
                dom.watermarkOpacityVal.textContent = `${input.value}%`;
            }
            if (input === dom.watermarkSizeSlider && dom.watermarkSizeVal) {
                dom.watermarkSizeVal.textContent = `${input.value}px`;
            }
            if (input === dom.coverTitleSizeSlider && dom.coverTitleSizeVal) {
                dom.coverTitleSizeVal.textContent = `${input.value}px`;
            }
            if (input === dom.coverClassificationSizeSlider && dom.coverClassificationSizeVal) {
                dom.coverClassificationSizeVal.textContent = `${input.value}px`;
            }
            if (input === dom.coverTaglineSizeSlider && dom.coverTaglineSizeVal) {
                dom.coverTaglineSizeVal.textContent = `${input.value}px`;
            }
            if (input === dom.coverSubtitleSizeSlider && dom.coverSubtitleSizeVal) {
                dom.coverSubtitleSizeVal.textContent = `${input.value}px`;
            }
            
            if (input === dom.watermarkTypeSelect) {
                dom.watermarkTextGroup.style.display = (input.value === 'text') ? 'flex' : 'none';
                dom.watermarkColorGroup.style.display = (input.value === 'text') ? 'flex' : 'none';
                dom.watermarkImageGroup.style.display = (input.value === 'image') ? 'flex' : 'none';
            }

            if (input === dom.compactSpacingToggle) {
                state.customDesignSettings.compactMode = input.checked;
            }
            if (input === dom.tightCompactionToggle) {
                state.isTightCompaction = input.checked;
                localStorage.setItem('samyak-tight-compaction', state.isTightCompaction ? 'true' : 'false');
                document.body.classList.toggle('tight-compaction', state.isTightCompaction);
            }
            if (input === dom.showCoverPageToggle) {
                if (state.pagesData[0]) {
                    state.pagesData[0].showCoverPage = input.checked;
                }
            }

            // Sync visual decorations layout
            applyCustomDesignSettingsToDOM();
            debouncedRenderAndSave();
            updateDocumentTitle();
        });
    });

    // Document theme listener
    if (dom.docThemeInput) {
        dom.docThemeInput.addEventListener('change', () => {
            const theme = dom.docThemeInput.value;
            localStorage.setItem('samyak-global-theme', theme);
            applyTheme(theme, true);
        });
    }

    // Main page actions
    if (dom.addPageBtn) {
        dom.addPageBtn.addEventListener('click', addPage);
    }
    if (dom.deletePageBtn) {
        dom.deletePageBtn.addEventListener('click', deletePage);
    }
    if (dom.clearAllBtn) {
        dom.clearAllBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear all content pages, text, and settings? This cannot be undone.")) {
                clearWorkspaceContent();
            }
        });
    }

    // Zoom listeners
    if (dom.zoomInBtn) {
        dom.zoomInBtn.addEventListener('click', () => {
            if (state.zoomLevel < 150) {
                state.zoomLevel += 5;
                updateZoom();
            }
        });
    }
    if (dom.zoomOutBtn) {
        dom.zoomOutBtn.addEventListener('click', () => {
            if (state.zoomLevel > 30) {
                state.zoomLevel -= 5;
                updateZoom();
            }
        });
    }

    // Page layout single col/two col selector listener
    if (dom.pageLayoutSelect) {
        dom.pageLayoutSelect.addEventListener('change', () => {
            if (state.activePageIndex > 0 && state.pagesData[state.activePageIndex]) {
                state.pagesData[state.activePageIndex].layout = dom.pageLayoutSelect.value;
                renderPreview();
                saveWorkspaceToLocalStorage();
            }
        });
    }

    if (dom.applyLayoutAllBtn) {
        dom.applyLayoutAllBtn.addEventListener('click', () => {
            if (!dom.pageLayoutSelect) return;
            const chosenLayout = dom.pageLayoutSelect.value;
            if (confirm(`Apply "${chosenLayout === 'two-column' ? 'Two Column' : 'Single Column'}" layout to all content pages?`)) {
                for (let i = 1; i < state.pagesData.length; i++) {
                    state.pagesData[i].layout = chosenLayout;
                }
                renderPreview();
                saveWorkspaceToLocalStorage();
                alert('Layout updated for all pages!');
            }
        });
    }

    // Fonts size click controls
    if (dom.fontIncreaseBtn) {
        dom.fontIncreaseBtn.addEventListener('click', () => {
            if (state.contentFontSize < 20) {
                state.contentFontSize += 0.5;
                dom.fontSizeValSpan.textContent = `${state.contentFontSize}px`;
                document.documentElement.style.setProperty('--content-font-size', `${state.contentFontSize}px`);
                clearHeightEstimationCache();
                renderPreview();
                saveWorkspaceToLocalStorage();
            }
        });
    }
    if (dom.fontDecreaseBtn) {
        dom.fontDecreaseBtn.addEventListener('click', () => {
            if (state.contentFontSize > 10) {
                state.contentFontSize -= 0.5;
                dom.fontSizeValSpan.textContent = `${state.contentFontSize}px`;
                document.documentElement.style.setProperty('--content-font-size', `${state.contentFontSize}px`);
                clearHeightEstimationCache();
                renderPreview();
                saveWorkspaceToLocalStorage();
            }
        });
    }

    // Font style change listener
    if (dom.globalFontStyleSelect) {
        dom.globalFontStyleSelect.addEventListener('change', () => {
            clearHeightEstimationCache();
            document.body.classList.remove('font-poppins-sans', 'font-traditional-serif', 'font-hybrid-style');
            
            const selectedStyle = dom.globalFontStyleSelect.value;
            if (selectedStyle !== 'modern-sans') {
                document.body.classList.add(`font-${selectedStyle}`);
            }
            renderPreview();
            saveWorkspaceToLocalStorage();
        });
    }

    // Font weights and spacing adjustments listeners
    const typographySelects = [dom.globalFontWeightSelect, dom.globalLineSpacingSelect, dom.globalLetterSpacingSelect];
    typographySelects.forEach(select => {
        if (!select) return;
        select.addEventListener('change', () => {
            clearHeightEstimationCache();
            document.documentElement.style.setProperty('--content-font-weight', dom.globalFontWeightSelect.value);
            document.documentElement.style.setProperty('--content-line-height', dom.globalLineSpacingSelect.value);
            document.documentElement.style.setProperty('--content-letter-spacing', dom.globalLetterSpacingSelect.value);
            renderPreview();
            saveWorkspaceToLocalStorage();
        });
    });

    // Content Editor page input listener
    if (dom.pageContentInput) {
        dom.pageContentInput.addEventListener('input', () => {
            if (state.activePageIndex > 0 && state.pagesData[state.activePageIndex]) {
                state.pagesData[state.activePageIndex].text = dom.pageContentInput.value;
            }
            debouncedRenderAndSave();
        });
    }

    // Watermark file logo uploader
    if (dom.watermarkImageFileInput) {
        dom.watermarkImageFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                state.watermarkSettings.imageSrc = event.target.result;
                saveWorkspaceToLocalStorage();
                renderPreview();
            };
            reader.readAsDataURL(file);
        });
    }

    // Design Logo image upload listener
    if (dom.headerLogoFileInput) {
        dom.headerLogoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                state.customDesignSettings.headerLogoSrc = event.target.result;
                if (dom.headerLogoPreview && dom.headerLogoPreviewGroup) {
                    dom.headerLogoPreview.src = event.target.result;
                    dom.headerLogoPreviewGroup.style.display = 'block';
                }
                saveWorkspaceToLocalStorage();
                renderPreview();
            };
            reader.readAsDataURL(file);
        });
    }

    if (dom.removeHeaderLogoBtn) {
        dom.removeHeaderLogoBtn.addEventListener('click', () => {
            state.customDesignSettings.headerLogoSrc = '';
            if (dom.headerLogoPreview && dom.headerLogoPreviewGroup) {
                dom.headerLogoPreview.src = '';
                dom.headerLogoPreviewGroup.style.display = 'none';
            }
            saveWorkspaceToLocalStorage();
            renderPreview();
        });
    }

    // Drag-and-drop elements reordering inside pagesContainer
    let draggedBlockId = null;
    dom.pagesContainer.addEventListener('dragstart', (e) => {
        const target = e.target.closest('[data-block-id]');
        if (target) {
            draggedBlockId = parseInt(target.getAttribute('data-block-id'), 10);
            e.dataTransfer.setData('text/plain', draggedBlockId);
            target.classList.add('dragging-block');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    dom.pagesContainer.addEventListener('dragend', (e) => {
        const target = e.target.closest('[data-block-id]');
        if (target) {
            target.classList.remove('dragging-block');
        }
        document.querySelectorAll('[data-block-id]').forEach(el => {
            el.classList.remove('drag-hover-before', 'drag-hover-after');
        });
        draggedBlockId = null;
    });

    // Helper to search closest block under coordinates
    const getClosestBlock = (pageContent, clientX, clientY) => {
        const children = pageContent.querySelectorAll('[data-block-id]');
        let closestNode = null;
        let minDistance = Infinity;

        children.forEach(child => {
            const rect = child.getBoundingClientRect();
            const px = Math.max(rect.left, Math.min(clientX, rect.right));
            const py = Math.max(rect.top, Math.min(clientY, rect.bottom));

            const dx = clientX - px;
            const dy = clientY - py;
            const distance = dx * dx + dy * dy;

            if (distance < minDistance) {
                minDistance = distance;
                closestNode = child;
            }
        });
        return closestNode;
    };

    dom.pagesContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const pageContent = e.target.closest('.page-content');
        if (!pageContent || draggedBlockId === null) return;

        const target = getClosestBlock(pageContent, e.clientX, e.clientY);
        if (target) {
            const dropBlockId = parseInt(target.getAttribute('data-block-id'), 10);
            if (draggedBlockId === dropBlockId) return;

            document.querySelectorAll('[data-block-id]').forEach(el => {
                if (el !== target) {
                    el.classList.remove('drag-hover-before', 'drag-hover-after');
                }
            });

            const rect = target.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            e.dataTransfer.dropEffect = 'move';

            if (e.clientY < midpoint) {
                target.classList.add('drag-hover-before');
                target.classList.remove('drag-hover-after');
            } else {
                target.classList.add('drag-hover-after');
                target.classList.remove('drag-hover-before');
            }
        }
    });

    dom.pagesContainer.addEventListener('dragleave', (e) => {
        const target = e.target.closest('[data-block-id]');
        if (target) {
            target.classList.remove('drag-hover-before', 'drag-hover-after');
        }
    });

    dom.pagesContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const pageContent = e.target.closest('.page-content');
        if (!pageContent || draggedBlockId === null) return;

        const target = getClosestBlock(pageContent, e.clientX, e.clientY);
        if (target) {
            const dropBlockId = parseInt(target.getAttribute('data-block-id'), 10);
            if (draggedBlockId === dropBlockId) return;

            const isBefore = target.classList.contains('drag-hover-before');
            target.classList.remove('drag-hover-before', 'drag-hover-after');
            reorderMarkdownBlocks(draggedBlockId, dropBlockId, isBefore);
        }
    });

    // Table of contents drag section reorder handling
    dom.pagesContainer.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.toc-row');
        if (target) {
            const secName = target.getAttribute('data-section-name');
            if (secName) {
                state.draggedTOCSectionName = secName;
                target.classList.add('dragging-toc-row');
                e.dataTransfer.effectAllowed = 'move';
            }
        }
    });

    dom.pagesContainer.addEventListener('dragend', (e) => {
        const target = e.target.closest('.toc-row');
        if (target) {
            target.classList.remove('dragging-toc-row');
        }
        dom.pagesContainer.querySelectorAll('.toc-row').forEach(row => {
            row.classList.remove('drag-hover-before', 'drag-hover-after');
        });
        state.draggedTOCSectionName = null;
    });

    dom.pagesContainer.addEventListener('dragover', (e) => {
        const target = e.target.closest('.toc-row');
        if (!target || state.draggedTOCSectionName === null) return;
        
        const targetSecName = target.getAttribute('data-section-name');
        if (targetSecName === state.draggedTOCSectionName) return;

        e.preventDefault();
        const rect = target.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        e.dataTransfer.dropEffect = 'move';

        dom.pagesContainer.querySelectorAll('.toc-row').forEach(row => {
            if (row !== target) {
                row.classList.remove('drag-hover-before', 'drag-hover-after');
            }
        });

        if (e.clientY < midpoint) {
            target.classList.add('drag-hover-before');
            target.classList.remove('drag-hover-after');
        } else {
            target.classList.add('drag-hover-after');
            target.classList.remove('drag-hover-before');
        }
    });

    dom.pagesContainer.addEventListener('drop', (e) => {
        const target = e.target.closest('.toc-row');
        if (!target || state.draggedTOCSectionName === null) return;
        
        const targetSecName = target.getAttribute('data-section-name');
        if (targetSecName === state.draggedTOCSectionName) return;

        e.preventDefault();
        const isBefore = target.classList.contains('drag-hover-before');
        target.classList.remove('drag-hover-before', 'drag-hover-after');

        reorderDocumentSectionsByTOC(state.draggedTOCSectionName, targetSecName, isBefore);
    });

    // Mobile Preview Drawer triggers
    if (dom.mobilePreviewToggleBtn) {
        dom.mobilePreviewToggleBtn.addEventListener('click', () => {
            if (dom.previewPanel) {
                dom.previewPanel.classList.add('drawer-open');
                document.body.classList.add('mobile-drawer-active');
            }
        });
    }

    if (dom.mobilePreviewCloseBtn) {
        dom.mobilePreviewCloseBtn.addEventListener('click', () => {
            if (dom.previewPanel) {
                dom.previewPanel.classList.remove('drawer-open');
                document.body.classList.remove('mobile-drawer-active');
            }
        });
    }

    // Draggable Sidebar resizer
    const editorPanel = document.querySelector('.editor-panel');
    const resizeHandle = document.getElementById('sidebar-resize-handle');
    let isResizing = false;

    if (resizeHandle && editorPanel) {
        const savedWidth = localStorage.getItem('editor_panel_width');
        if (savedWidth) editorPanel.style.width = savedWidth;

        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (toggleBtn) {
            const toggleSidebar = (forceState = null) => {
                const willCollapse = forceState !== null ? forceState : !editorPanel.classList.contains('collapsed');
                if (willCollapse) {
                    editorPanel.classList.add('collapsed');
                    toggleBtn.textContent = '▶';
                    toggleBtn.setAttribute('title', 'Expand Sidebar');
                    resizeHandle.style.cursor = 'default';
                } else {
                    editorPanel.classList.remove('collapsed');
                    toggleBtn.textContent = '◀';
                    toggleBtn.setAttribute('title', 'Collapse Sidebar');
                    resizeHandle.style.cursor = 'col-resize';
                }
                localStorage.setItem('sidebar_collapsed', willCollapse ? 'true' : 'false');
                state.cachedMaxContentHeight = null;
                renderPreview();
            };

            toggleBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            toggleBtn.addEventListener('touchstart', (e) => e.stopPropagation());
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSidebar();
            });

            const savedCollapsed = localStorage.getItem('sidebar_collapsed');
            if (savedCollapsed === 'true') {
                editorPanel.classList.add('collapsed');
                toggleBtn.textContent = '▶';
                toggleBtn.setAttribute('title', 'Expand Sidebar');
                resizeHandle.style.cursor = 'default';
            }
        }

        resizeHandle.addEventListener('mousedown', (e) => {
            if (editorPanel.classList.contains('collapsed')) return;
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            resizeHandle.classList.add('resizing');
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const maxAllowedWidth = Math.max(380, window.innerWidth - 860);
            const newWidth = Math.max(380, Math.min(maxAllowedWidth, e.clientX));
            editorPanel.style.width = `${newWidth}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                resizeHandle.classList.remove('resizing');
                document.body.style.userSelect = '';
                localStorage.setItem('editor_panel_width', editorPanel.style.width);
            }
        });
    }

    // Toggle Toolbar keyboard bindings
    if (dom.toggleToolbarBtn) {
        dom.toggleToolbarBtn.addEventListener('click', () => {
            const toolbar = document.querySelector('.editor-toolbar');
            const editorZone = document.getElementById('content-editor-zone');
            if (toolbar && editorZone) {
                toolbar.classList.toggle('collapsed');
                editorZone.classList.toggle('toolbar-collapsed');
                const isCollapsed = toolbar.classList.contains('collapsed');
                dom.toggleToolbarBtn.setAttribute('title', isCollapsed ? 'Show Toolbar (Ctrl+/)' : 'Hide Toolbar (Ctrl+/)');
                localStorage.setItem('samyak-toolbar-collapsed', isCollapsed ? 'true' : 'false');
            }
        });
        const savedToolbarState = localStorage.getItem('samyak-toolbar-collapsed');
        if (savedToolbarState === 'true') {
            const toolbar = document.querySelector('.editor-toolbar');
            const editorZone = document.getElementById('content-editor-zone');
            if (toolbar && editorZone) {
                toolbar.classList.add('collapsed');
                editorZone.classList.add('toolbar-collapsed');
                dom.toggleToolbarBtn.setAttribute('title', 'Show Toolbar (Ctrl+/)');
            }
        }
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            if (dom.toggleToolbarBtn) dom.toggleToolbarBtn.click();
        }
    });

    // Clear height cache on window resize
    window.addEventListener('resize', () => {
        state.cachedMaxContentHeight = null;
    });

    // Safe save on page exiting
    window.addEventListener('beforeunload', () => saveWorkspaceToLocalStorage());
    window.addEventListener('pagehide', () => saveWorkspaceToLocalStorage());

    // Import/Export configuration handlers
    if (dom.exportProjectBtn) {
        dom.exportProjectBtn.addEventListener('click', () => {
            saveCurrentInputState();
            const projectData = {
                pagesData: state.pagesData,
                lastPageData: state.lastPageData,
                contentFontSize: state.contentFontSize,
                watermarkSettings: state.watermarkSettings,
                customDesignSettings: state.customDesignSettings,
                socialSettings: state.socialSettings,
                slateImages: state.uploadedImages,
                imageCounter: state.imageCounter
            };
            const file = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(file);
            a.download = `samyak-project-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    if (dom.importProjectBtn && dom.importProjectFile) {
        dom.importProjectBtn.addEventListener('click', () => dom.importProjectFile.click());
        dom.importProjectFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (imported && Array.isArray(imported.pagesData)) {
                        state.pagesData = imported.pagesData;
                        state.lastPageData = imported.lastPageData || state.lastPageData;
                        state.contentFontSize = imported.contentFontSize || 16.1;
                        state.watermarkSettings = imported.watermarkSettings || state.watermarkSettings;
                        state.customDesignSettings = imported.customDesignSettings || state.customDesignSettings;
                        state.socialSettings = imported.socialSettings || state.socialSettings;
                        state.uploadedImages = imported.slateImages || imported.uploadedImages || {};
                        state.imageCounter = imported.imageCounter || 1;
                        
                        saveToDB('samyak_uploaded_images', state.uploadedImages);
                        saveToDB('samyak_image_counter', state.imageCounter);
                        
                        saveWorkspaceToLocalStorage();
                        loadWorkspaceFromLocalStorage();
                        alert('Project successfully imported!');
                    } else {
                        alert('Invalid Samyak project file format.');
                    }
                } catch (err) {
                    alert('Error parsing project file: ' + err.message);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Google input emulation handlers on pageContentInput
    if (dom.pageContentInput) {
        dom.pageContentInput.addEventListener('keydown', (e) => {
            if (!dom.phoneticTypingToggle || !dom.phoneticTypingToggle.checked) return;

            if (state.suggestionsActive) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    state.activeSuggestionIndex = (state.activeSuggestionIndex + 1) % state.suggestionsList.length;
                    renderPhoneticSuggestionsTooltip(state.suggestionsList);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    state.activeSuggestionIndex = (state.activeSuggestionIndex - 1 + state.suggestionsList.length) % state.suggestionsList.length;
                    renderPhoneticSuggestionsTooltip(state.suggestionsList);
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    selectPhoneticSuggestion(state.activeSuggestionIndex);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    hidePhoneticSuggestionsTooltip();
                } else if (e.key >= '1' && e.key <= '5') {
                    e.preventDefault();
                    selectPhoneticSuggestion(parseInt(e.key) - 1);
                } else if (e.key === ' ') {
                    e.preventDefault();
                    selectPhoneticSuggestion(state.activeSuggestionIndex);
                }
            }
        });

        dom.pageContentInput.addEventListener('input', (e) => {
            if (!dom.phoneticTypingToggle || !dom.phoneticTypingToggle.checked) {
                hidePhoneticSuggestionsTooltip();
                return;
            }

            const val = dom.pageContentInput.value;
            const cursor = dom.pageContentInput.selectionStart;
            
            const beforeCursor = val.substring(0, cursor);
            const match = beforeCursor.match(/([a-zA-Z]+)$/);

            if (match) {
                state.currentEnglishWord = match[1];
                state.currentWordStartIdx = cursor - state.currentEnglishWord.length;

                state.suggestionsList = generatePhoneticSuggestions(state.currentEnglishWord);
                state.activeSuggestionIndex = 0;

                renderPhoneticSuggestionsTooltip(state.suggestionsList);

                // Position tooltip near caret
                const caretCoords = getCaretCoordinates(dom.pageContentInput, state.currentWordStartIdx);
                if (dom.phoneticSuggestionsTooltip) {
                    dom.phoneticSuggestionsTooltip.style.top = `${caretCoords.top + 20}px`;
                    dom.phoneticSuggestionsTooltip.style.left = `${caretCoords.left}px`;
                }
            } else {
                hidePhoneticSuggestionsTooltip();
            }
        });

        dom.pageContentInput.addEventListener('blur', () => {
            setTimeout(hidePhoneticSuggestionsTooltip, 200);
        });
    }

    // Draggable accordion header sections order loading
    const restoreAccordionOrder = () => {
        const container = document.getElementById('settings-accordion-container');
        if (!container) return;
        const savedOrderStr = localStorage.getItem('samyak-design-accordion-order');
        if (savedOrderStr) {
            try {
                const savedOrder = JSON.parse(savedOrderStr);
                if (Array.isArray(savedOrder)) {
                    savedOrder.forEach(id => {
                        const el = document.getElementById(id);
                        if (el && el.parentNode === container) {
                            container.appendChild(el);
                        }
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }
    };
    restoreAccordionOrder();

    // Startup workspace loading
    loadWorkspaceFromLocalStorage().then(loaded => {
        if (!loaded) clearWorkspaceContent();
        updateZoom();
    }).catch(err => {
        console.error("Startup error:", err);
        clearWorkspaceContent();
        updateZoom();
    });

    const triggerInitialRender = () => {
        state.cachedMaxContentHeight = null;
        renderPreview();
    };

    if (document.readyState === 'complete') {
        triggerInitialRender();
    } else {
        window.addEventListener('load', triggerInitialRender);
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => triggerInitialRender());
    }
});
