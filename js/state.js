/* ==========================================================================
   SAMYAK - CENTRAL STATE & DOM REFERENCE REGISTRY
   ========================================================================== */

// 1. Core Application State
export const state = {
    pagesData: [],               // Array of page objects
    currentRenderedBlocks: [],   // Currently rendered blocks for preview scroll sync
    activePageIndex: 0,          // Current page index being edited
    zoomLevel: 100,              // Current preview zoom percentage
    contentFontSize: 16.1,       // Baseline A4 content text size
    MAX_CONTENT_HEIGHT: 910,     // Max vertical pixels allowed per page
    cachedMaxContentHeight: null,// Cache to prevent layout thrashing
    draggedTOCSectionName: null, // Store dragged section name for TOC reordering
    isTightCompaction: false,    // Tight compaction mode class active
    lastPageData: {
        title: 'THANK YOU',
        subtitle: 'Samyak',
        tagline: 'कोचिंग नहीं क्रांति'
    },
    uploadedImages: {},          // Map of image IDs to base64 strings
    imageCounter: 1,             // Counter for uploaded image IDs
    watermarkSettings: {
        type: 'none',            // 'none' | 'text' | 'image'
        text: 'Samyak',
        imageSrc: '',
        position: 'center',
        rotation: '-45',
        opacity: 0.15,
        size: 60,
        color: '#000000'
    },
    customDesignSettings: {
        compactMode: false,
        chapterNumSize: '20',
        chapterTitleSize: '22',
        chapterSubtitleSize: '14',
        topicMarginTop: '12px',
        topicMarginBottom: '4px',
        topicAlignment: 'flex-start',
        sectionAlignment: 'left',
        pageNumPlacement: 'bottom-center',
        pageNumPrefix: 'पेज - ',
        pageNumSize: '15',
        pageNumColor: '',
        headerLogoSrc: '',
        borderThick: '2',
        cornerSize: '32',
        innerBorderColor: '#c5a353',
        cornerColor: '#c5a353',
        dividerColor: '',
        dividerStyle: 'dashed',
        dividerThickness: '1.5',
        endStarSymbol: '✦',
        endStarColor: '',
        endStarSize: '18',
        endStarPulse: true,
        sectionShape: 'rectangle',
        topicIcon: 'orange-diamond',
        bulletStyle: 'classic',
        explanationStyle: 'modern-accent',
        tableHeaderFontSize: '12.5',
        tableBodyFontSize: '11.5',
        tableColWidths: '',
        pageMarginX: '8',
        pageMarginY: '6',
        pagePaddingX: '6',
        pagePaddingY: '4'
    },
    socialSettings: {
        telegramText: '',
        youtubeText: '',
        fontSize: 11,
        placement: 'split'
    },
    currentToolbarLayout: {
        main: ['btn-section', 'btn-chapter', 'btn-topic', 'btn-bullet', 'btn-note'],
        tray: ['btn-pagebreak', 'insert-table-btn', 'btn-search-toggle', 'btn-remove-gaps', 'btn-help-shortcuts']
    },
    // OCR & AI State variables
    ocrDashUploadedFile: null,
    ocrDashActiveTab: 'preview',
    ocrDashLayoutAnalysis: true,
    ocrDashAutoStructuring: true,
    ocrFileChangeCount: 0,
    // Google input phonetic state variables
    suggestionsList: [],
    activeSuggestionIndex: 0,
    suggestionsActive: false,
    currentEnglishWord: '',
    currentWordStartIdx: -1
};

// Section Icon Mapping for Table of Contents
export const sectionIcons = {
    "योजनाएँ एवं नीतियाँ": "📚",
    "योजनाएँ एवं नीतियां": "📚",
    "महोत्सव/मेले/कार्यक्रम": "🎪",
    "महोत्सव, मेले व कार्यक्रम": "🎪",
    "आर्थिक विकास व समझौते": "💼",
    "आर्थिक विकास": "💼",
    "चर्चित व्यक्तित्व": "👤",
    "पुरस्कार": "🏆",
    "प्रमुख अभियान": "🚀",
    "खेल": "⚽",
    "खेल समाचार": "⚽",
    "विविध": "✨",
    "विविध घटनाक्रम": "✨"
};

// 2. DOM Elements Cache (Lazily populated to ensure elements exist)
export const dom = {};

export function initDOM() {
    dom.pageTabsList = document.getElementById('page-tabs-list');
    dom.addPageBtn = document.getElementById('quick-add-page-btn') || document.getElementById('add-page-btn');
    dom.deletePageBtn = document.getElementById('quick-delete-page-btn') || document.getElementById('delete-page-btn');
    
    // Page Grid
    dom.gridViewBtn = document.getElementById('quick-grid-view-btn') || document.getElementById('grid-view-btn');
    dom.pageGridModal = document.getElementById('page-grid-modal');
    dom.closeGridModalBtn = document.getElementById('close-grid-modal-btn');
    dom.pageGridItemsContainer = document.getElementById('page-grid-items-container');
    dom.gridTotalPagesLabel = document.getElementById('grid-total-pages-label');
    dom.gridAddPageBtn = document.getElementById('grid-add-page-btn');
    
    // Header & Actions
    dom.themeToggleBtn = document.getElementById('theme-toggle-btn');
    dom.toggleToolbarBtn = document.getElementById('toggle-toolbar-btn');
    dom.importProjectBtn = document.getElementById('import-project-btn');
    dom.exportProjectBtn = document.getElementById('export-project-btn');
    dom.importProjectFile = document.getElementById('import-project-file');
    dom.pageLayoutSelect = document.getElementById('page-layout-select');
    dom.applyLayoutAllBtn = document.getElementById('apply-layout-all-btn');
    dom.compactSpacingToggle = document.getElementById('compact-spacing-toggle');
    dom.tightCompactionToggle = document.getElementById('tight-compaction-toggle');
    dom.showCoverPageToggle = document.getElementById('show-cover-page-toggle');
    dom.pageTemplateSelect = document.getElementById('page-template-select');
    dom.btnSearchToggle = document.getElementById('btn-search-toggle');
    dom.searchReplacePanel = document.getElementById('search-replace-panel');
    dom.findInput = document.getElementById('find-input');
    dom.replaceInput = document.getElementById('replace-input');
    dom.findBtn = document.getElementById('find-btn');
    dom.replaceBtn = document.getElementById('replace-btn');
    dom.replaceAllBtn = document.getElementById('replace-all-btn');
    dom.searchStatus = document.getElementById('search-status');
    
    // Compiler
    dom.compilerModal = document.getElementById('compiler-modal');
    dom.closeCompilerModalBtn = document.getElementById('close-compiler-modal-btn');
    dom.cancelCompilerBtn = document.getElementById('cancel-compiler-btn');
    dom.compileConfirmBtn = document.getElementById('compile-confirm-btn');
    dom.compilerFile1 = document.getElementById('compiler-file-1');
    dom.compilerFile2 = document.getElementById('compiler-file-2');
    dom.compilerFile3 = document.getElementById('compiler-file-3');
    dom.compiledTitleInput = document.getElementById('compiled-title');
    dom.compiledTaglineInput = document.getElementById('compiled-tagline');
    dom.compiledSubtitleInput = document.getElementById('compiled-subtitle');
    
    // Help
    dom.helpModal = document.getElementById('help-modal');
    dom.btnHelpShortcuts = document.getElementById('btn-help-shortcuts');
    dom.closeHelpModalBtn = document.getElementById('close-help-modal-btn');
    dom.closeHelpBtn = document.getElementById('close-help-btn');
    
    // Editor zones
    dom.coverEditorZone = document.getElementById('cover-editor-zone');
    dom.contentEditorZone = document.getElementById('content-editor-zone');
    dom.pageContentInput = document.getElementById('page-content-input');
    
    // Cover fields
    dom.docTitleInput = document.getElementById('doc-title');
    dom.docTaglineInput = document.getElementById('doc-tagline');
    dom.docSubtitleInput = document.getElementById('doc-subtitle');
    dom.docThemeInput = document.getElementById('doc-theme');
    dom.coverThemeSelect = document.getElementById('cover-theme-select');
    dom.coverBorderPatternSelect = document.getElementById('cover-border-pattern-select');
    dom.coverEmblemSelect = document.getElementById('cover-emblem-select');
    dom.docClassificationInput = document.getElementById('doc-classification');
    dom.coverTitleSizeSlider = document.getElementById('cover-title-size');
    dom.coverTitleSizeVal = document.getElementById('cover-title-size-val');
    dom.coverClassificationSizeSlider = document.getElementById('cover-classification-size');
    dom.coverClassificationSizeVal = document.getElementById('cover-classification-size-val');
    dom.coverTaglineSizeSlider = document.getElementById('cover-tagline-size');
    dom.coverTaglineSizeVal = document.getElementById('cover-tagline-size-val');
    dom.coverSubtitleSizeSlider = document.getElementById('cover-subtitle-size');
    dom.coverSubtitleSizeVal = document.getElementById('cover-subtitle-size-val');
    dom.showTocToggle = document.getElementById('show-toc-toggle');
    
    // Last page
    dom.lastEditorZone = document.getElementById('last-editor-zone');
    dom.lastTitleInput = document.getElementById('last-title');
    dom.lastSubtitleInput = document.getElementById('last-subtitle');
    dom.lastTaglineInput = document.getElementById('last-tagline');
    
    // General
    dom.pagesContainer = document.getElementById('pages-container');
    dom.wordCountSpan = document.getElementById('word-count');
    dom.activePageLabel = document.getElementById('active-page-label');
    dom.clearAllBtn = document.getElementById('clear-all-btn');
    dom.printPdfBtn = document.getElementById('print-pdf-btn');
    dom.smartShrinkBtn = document.getElementById('smart-shrink-btn');
    dom.removeGapsBtn = document.getElementById('remove-gaps-btn');
    dom.btnRemoveGaps = document.getElementById('btn-remove-gaps');
    dom.loadingOverlay = document.getElementById('loading-overlay');
    dom.zoomInBtn = document.getElementById('zoom-in');
    dom.zoomOutBtn = document.getElementById('zoom-out');
    dom.zoomLevelSpan = document.getElementById('zoom-level');
    
    // Mobile Preview
    dom.mobilePreviewToggleBtn = document.getElementById('mobile-preview-toggle-btn');
    dom.mobilePreviewCloseBtn = document.getElementById('mobile-preview-close-btn');
    dom.previewPanel = document.querySelector('.preview-panel');
    
    // Sidebar layout details
    dom.fontDecreaseBtn = document.getElementById('font-decrease');
    dom.fontIncreaseBtn = document.getElementById('font-increase');
    dom.fontSizeValSpan = document.getElementById('font-size-val');
    dom.globalFontStyleSelect = document.getElementById('global-font-style');
    dom.globalFontWeightSelect = document.getElementById('global-font-weight');
    dom.globalLineSpacingSelect = document.getElementById('global-line-spacing');
    dom.globalLetterSpacingSelect = document.getElementById('global-letter-spacing');
    
    dom.toolbarButtons = document.querySelectorAll('.tool-btn');
    dom.toolbarTrayTrigger = document.getElementById('toolbar-tray-trigger');
    dom.toolbarTrayDrawer = document.getElementById('toolbar-tray-drawer');
    dom.toolbarCustomizeTrigger = document.getElementById('toolbar-customize-trigger');
    
    // Phonetic & OCR
    dom.phoneticTypingToggle = document.getElementById('phonetic-typing-toggle');
    dom.ocrDragDropZone = document.getElementById('ocr-drag-drop-zone');
    dom.ocrFileInput = document.getElementById('ocr-file-input');
    
    dom.openOcrDashBtn = document.getElementById('tab-ocr-btn');
    dom.ocrIntegratedWorkspace = document.getElementById('ocr-integrated-workspace');
    dom.ocrDashDragZone = document.getElementById('ocr-dash-drag-zone');
    dom.ocrDashFileInput = document.getElementById('ocr-dash-file-input');
    dom.ocrDashPreviewArea = document.getElementById('ocr-dash-preview-area');
    dom.ocrDashFileBadge = document.getElementById('ocr-dash-file-badge');
    dom.ocrDashFileName = document.getElementById('ocr-dash-file-name');
    dom.ocrDashFileSize = document.getElementById('ocr-dash-file-size');
    dom.ocrDashRemoveFileBtn = document.getElementById('ocr-dash-remove-file-btn');
    dom.ocrDashScanOverlay = document.getElementById('ocr-dash-scan-overlay');
    dom.ocrDashPreviewImg = document.getElementById('ocr-dash-preview-img');
    dom.ocrDashEngineSelect = document.getElementById('ocr-dash-engine-select');
    dom.ocrDashLayoutToggle = document.getElementById('ocr-dash-layout-toggle');
    dom.ocrDashStructToggle = document.getElementById('ocr-dash-struct-toggle');
    dom.ocrDashProcessBtn = document.getElementById('ocr-dash-process-btn');
    dom.ocrDashProcessingIndicator = document.getElementById('ocr-dash-processing-indicator');
    
    dom.ocrDashTabPreview = document.getElementById('ocr-dash-tab-preview');
    dom.ocrDashTabEditor = document.getElementById('ocr-dash-tab-editor');
    dom.ocrDashTabAlerts = document.getElementById('ocr-dash-tab-alerts');
    dom.ocrDashAlertBadgeCount = document.getElementById('ocr-dash-alert-badge-count');
    dom.ocrDashStatsBar = document.getElementById('ocr-dash-stats-bar');
    dom.ocrDashConfidenceVal = document.getElementById('ocr-dash-confidence-val');
    dom.ocrDashWordcountVal = document.getElementById('ocr-dash-wordcount-val');
    dom.ocrDashAlertsCountVal = document.getElementById('ocr-dash-alerts-count-val');
    
    dom.ocrDashIdleState = document.getElementById('ocr-dash-idle-state');
    dom.ocrDashViewStructured = document.getElementById('ocr-dash-view-structured');
    dom.ocrDashRenderedHtml = document.getElementById('ocr-dash-rendered-html');
    dom.ocrDashViewEditor = document.getElementById('ocr-dash-view-editor');
    dom.ocrDashRawTextarea = document.getElementById('ocr-dash-raw-textarea');
    dom.ocrDashViewAlerts = document.getElementById('ocr-dash-view-alerts');
    dom.ocrDashAlertsList = document.getElementById('ocr-dash-alerts-list');
    
    dom.ocrDashActionsBar = document.getElementById('ocr-dash-actions-bar');
    dom.ocrDashCopyBtn = document.getElementById('ocr-dash-copy-btn');
    dom.ocrDashDownloadBtn = document.getElementById('ocr-dash-download-btn');
    dom.ocrDashInsertBtn = document.getElementById('ocr-dash-insert-btn');
    
    // Page selector modal
    dom.ocrPageSelectorModal = document.getElementById('ocr-page-selector-modal');
    dom.ocrPageSelectorClose = document.getElementById('ocr-page-selector-close');
    dom.ocrDestinationPageSelect = document.getElementById('ocr-destination-page-select');
    dom.ocrPageSelectorCancel = document.getElementById('ocr-page-selector-cancel');
    dom.ocrPageSelectorConfirm = document.getElementById('ocr-page-selector-confirm');
    dom.phoneticSuggestionsTooltip = document.getElementById('phonetic-suggestions-tooltip');
    
    // Watermark sub elements
    dom.watermarkTypeSelect = document.getElementById('watermark-type');
    dom.watermarkTextGroup = document.getElementById('watermark-text-group');
    dom.watermarkTextInput = document.getElementById('watermark-text');
    dom.watermarkImageGroup = document.getElementById('watermark-image-group');
    dom.watermarkImageFileInput = document.getElementById('watermark-image-file');
    dom.watermarkPositionSelect = document.getElementById('watermark-position');
    dom.watermarkRotationSelect = document.getElementById('watermark-rotation');
    dom.watermarkOpacitySlider = document.getElementById('watermark-opacity');
    dom.watermarkOpacityVal = document.getElementById('watermark-opacity-val');
    dom.watermarkSizeSlider = document.getElementById('watermark-size');
    dom.watermarkSizeVal = document.getElementById('watermark-size-val');
    dom.watermarkColorGroup = document.getElementById('watermark-color-group');
    dom.watermarkColorInput = document.getElementById('watermark-color');
    
    // Custom Design inputs
    dom.designSectionBg = document.getElementById('design-section-bg');
    dom.designSectionAccent = document.getElementById('design-section-accent');
    dom.designSectionText = document.getElementById('design-section-text');
    dom.designSectionSize = document.getElementById('design-section-size');
    dom.designSectionSizeVal = document.getElementById('design-section-size-val');
    dom.designSectionAlign = document.getElementById('design-section-align');
    dom.designChapterNumSize = document.getElementById('design-chapter-num-size');
    dom.designChapterNumSizeVal = document.getElementById('design-chapter-num-size-val');
    dom.designChapterTitleSize = document.getElementById('design-chapter-title-size');
    dom.designChapterTitleSizeVal = document.getElementById('design-chapter-title-size-val');
    dom.designChapterSubtitleSize = document.getElementById('design-chapter-subtitle-size');
    dom.designChapterSubtitleSizeVal = document.getElementById('design-chapter-subtitle-size-val');
    dom.designTopicText = document.getElementById('design-topic-text');
    dom.designTopicBorder = document.getElementById('design-topic-border');
    dom.designTopicBorderStyle = document.getElementById('design-topic-border-style');
    dom.designTopicMargin = document.getElementById('design-topic-margin');
    dom.designTopicSize = document.getElementById('design-topic-size');
    dom.designTopicSizeVal = document.getElementById('design-topic-size-val');
    dom.designTopicThick = document.getElementById('design-topic-thick');
    dom.designTopicThickVal = document.getElementById('design-topic-thick-val');
    dom.designTopicAlign = document.getElementById('design-topic-align');
    dom.designSectionShape = document.getElementById('design-section-shape');
    dom.designTopicIcon = document.getElementById('design-topic-icon');
    dom.designBulletStyle = document.getElementById('design-bullet-style');
    dom.designExplanationStyle = document.getElementById('design-explanation-style');
    dom.designTableHeaderSize = document.getElementById('design-table-header-size');
    dom.designTableHeaderSizeVal = document.getElementById('design-table-header-size-val');
    dom.designTableBodySize = document.getElementById('design-table-body-size');
    dom.designTableBodySizeVal = document.getElementById('design-table-body-size-val');
    dom.designTableColWidths = document.getElementById('design-table-col-widths');
    dom.designInnerBorder = document.getElementById('design-inner-border');
    dom.designCornerColor = document.getElementById('design-corner-color');
    dom.designBorderThick = document.getElementById('design-border-thick');
    dom.designBorderThickVal = document.getElementById('design-border-thick-val');
    dom.designCornerSize = document.getElementById('design-corner-size');
    dom.designCornerSizeVal = document.getElementById('design-corner-size-val');
    dom.designDividerColor = document.getElementById('design-divider-color');
    dom.designDividerStyle = document.getElementById('design-divider-style');
    dom.designDividerThick = document.getElementById('design-divider-thick');
    dom.designDividerThickVal = document.getElementById('design-divider-thick-val');
    dom.designEndStarSymbol = document.getElementById('design-end-star-symbol');
    dom.designEndStarColor = document.getElementById('design-end-star-color');
    dom.designEndStarSize = document.getElementById('design-end-star-size');
    dom.designEndStarSizeVal = document.getElementById('design-end-star-size-val');
    dom.designEndStarPulse = document.getElementById('design-end-star-pulse');
    dom.designPageNumColor = document.getElementById('design-page-num-color');
    dom.designPageNumPlace = document.getElementById('design-page-num-place');
    dom.designPageNumPrefix = document.getElementById('design-page-num-prefix');
    dom.designPageNumSize = document.getElementById('design-page-num-size');
    dom.designPageNumSizeVal = document.getElementById('design-page-num-size-val');
    
    // Margins
    dom.pageMarginXInput = document.getElementById('page-margin-x');
    dom.marginXValSpan = document.getElementById('margin-x-val');
    dom.pageMarginYInput = document.getElementById('page-margin-y');
    dom.marginYValSpan = document.getElementById('margin-y-val');
    dom.pagePaddingXInput = document.getElementById('page-padding-x');
    dom.paddingXValSpan = document.getElementById('padding-x-val');
    dom.pagePaddingYInput = document.getElementById('page-padding-y');
    dom.paddingYValSpan = document.getElementById('padding-y-val');
    
    // Logo
    dom.headerLogoFileInput = document.getElementById('header-logo-file');
    dom.headerLogoPreviewGroup = document.getElementById('header-logo-preview-group');
    dom.headerLogoPreview = document.getElementById('header-logo-preview');
    dom.removeHeaderLogoBtn = document.getElementById('remove-header-logo-btn');
    
    // Social
    dom.footerTelegramInput = document.getElementById('footer-telegram');
    dom.footerYoutubeInput = document.getElementById('footer-youtube');
    dom.footerSocialSizeInput = document.getElementById('footer-social-size');
    dom.footerSocialSizeVal = document.getElementById('footer-social-size-val');
    dom.footerSocialPlacementSelect = document.getElementById('footer-social-placement');
}
