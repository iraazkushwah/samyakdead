/* ==========================================================================
   SAMYAK - A4 VISUAL PAGE GRID MANAGER
   ========================================================================== */

import { state, dom } from './state.js';

let gridCallbacks = {};

export function duplicatePageAt(idx) {
    if (idx === 0) return; // Cannot duplicate Cover
    gridCallbacks.saveCurrentInputState();
    const pageToClone = state.pagesData[idx];
    const clonedPage = {
        type: 'content',
        text: pageToClone.text || '',
        layout: pageToClone.layout || 'two-column'
    };
    state.pagesData.splice(idx + 1, 0, clonedPage);
    gridCallbacks.renderPreview();
    gridCallbacks.switchActivePage(idx + 1);
    gridCallbacks.saveWorkspaceToLocalStorage();
    renderGridPages();
}

export function deletePageAt(idx) {
    if (idx === 0) {
        alert('The Cover Page cannot be deleted!');
        return;
    }
    if (state.pagesData.length <= 2) {
        alert('At least one Content Page is required!');
        return;
    }
    if (confirm(`Are you sure you want to delete Page ${idx}?`)) {
        state.pagesData.splice(idx, 1);
        const newIndex = Math.min(state.activePageIndex, state.pagesData.length - 1);
        gridCallbacks.renderPreview();
        gridCallbacks.switchActivePage(newIndex);
        gridCallbacks.saveWorkspaceToLocalStorage();
        renderGridPages();
    }
}

export function renderGridPages() {
    if (!dom.pageGridItemsContainer) return;
    dom.pageGridItemsContainer.innerHTML = '';

    const totalContentCount = state.pagesData.length - 1;
    if (dom.gridTotalPagesLabel) {
        dom.gridTotalPagesLabel.textContent = `Total Content Pages: ${totalContentCount}`;
    }

    const showCover = (state.pagesData[0] && state.pagesData[0].showCoverPage !== false);

    if (showCover) {
        const coverCard = createGridCardDOM(0, 'cover');
        dom.pageGridItemsContainer.appendChild(coverCard);
    }

    for (let idx = 1; idx < state.pagesData.length; idx++) {
        const contentCard = createGridCardDOM(idx, 'content');
        dom.pageGridItemsContainer.appendChild(contentCard);
    }

    const addCardPlaceholder = document.createElement('div');
    addCardPlaceholder.className = 'page-grid-add-placeholder';
    addCardPlaceholder.title = 'Add a new page';
    addCardPlaceholder.innerHTML = `
        <div class="add-placeholder-icon">➕</div>
        <div class="add-placeholder-text">Add Page</div>
    `;
    addCardPlaceholder.addEventListener('click', () => {
        gridCallbacks.addPage();
        renderGridPages();
    });
    dom.pageGridItemsContainer.appendChild(addCardPlaceholder);

    setupGridDragAndDrop();
}

export function createGridCardDOM(idx, type) {
    const card = document.createElement('div');
    card.className = 'page-grid-card';
    if (idx === state.activePageIndex) {
        card.classList.add('active-card');
    }

    if (type === 'content') {
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-index', idx);
    }

    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'page-thumbnail-wrapper';

    const miniContent = document.createElement('div');
    miniContent.className = `mini-page-content mini-${type}`;

    if (type === 'cover') {
        const border = document.createElement('div');
        border.className = 'mini-cover-border';
        const innerBorder = document.createElement('div');
        innerBorder.className = 'mini-cover-inner-border';
        
        const emblem = document.createElement('div');
        emblem.className = 'mini-cover-emblem';
        emblem.textContent = '⚜️';

        const title = document.createElement('div');
        title.className = 'mini-cover-title';
        title.textContent = (state.pagesData[0] && state.pagesData[0].title) ? state.pagesData[0].title : 'सम्यक्';

        const tagline = document.createElement('div');
        tagline.className = 'mini-cover-tagline';
        tagline.textContent = (state.pagesData[0] && state.pagesData[0].tagline) ? state.pagesData[0].tagline : 'कोचिंग नहीं क्रांति';

        const subtitle = document.createElement('div');
        subtitle.className = 'mini-cover-subtitle';
        subtitle.textContent = (state.pagesData[0] && state.pagesData[0].subtitle) ? state.pagesData[0].subtitle : 'राजस्थान समसामयिकी';

        const tocBox = document.createElement('div');
        tocBox.className = 'mini-cover-toc-box';
        for (let i = 0; i < 4; i++) {
            const line = document.createElement('div');
            line.className = 'mini-toc-line';
            tocBox.appendChild(line);
        }

        miniContent.appendChild(border);
        miniContent.appendChild(innerBorder);
        miniContent.appendChild(emblem);
        miniContent.appendChild(title);
        miniContent.appendChild(tagline);
        miniContent.appendChild(subtitle);
        miniContent.appendChild(tocBox);

    } else if (type === 'end') {
        const endCardBox = document.createElement('div');
        endCardBox.className = 'mini-end-card';

        const endTitle = document.createElement('div');
        endTitle.className = 'mini-end-title';
        endTitle.textContent = (state.lastPageData && state.lastPageData.title) ? state.lastPageData.title : 'THANK YOU';

        const endBrand = document.createElement('div');
        endBrand.className = 'mini-end-brand';
        endBrand.textContent = (state.lastPageData && state.lastPageData.subtitle) ? state.lastPageData.subtitle : 'Samyak';

        const endFooter = document.createElement('div');
        endFooter.className = 'mini-page-footer';
        endFooter.textContent = 'पेज - End';

        endCardBox.appendChild(endTitle);
        endCardBox.appendChild(endBrand);
        miniContent.appendChild(endCardBox);
        miniContent.appendChild(endFooter);

    } else {
        const pageData = state.pagesData[idx];
        const isTwoColumn = pageData.layout === 'two-column';

        const header = document.createElement('div');
        header.className = 'mini-page-header';
        header.innerHTML = `
            <div class="mini-header-text">लोकबंधु | राजस्थान समसामयिकी</div>
            <div class="mini-header-text" style="font-size:3px;">क्रांति</div>
        `;

        const bodyContent = document.createElement('div');
        bodyContent.className = 'mini-body-content';

        const pageText = pageData.text || '';
        const lines = pageText.split('\n');
        let hasSection = false;
        let hasTopic = false;

        lines.forEach(l => {
            const tr = l.trim();
            if (tr.startsWith('# ')) hasSection = true;
            if (tr.startsWith('##') || tr.includes('🔶')) hasTopic = true;
        });

        const drawContentInsideColumn = (container) => {
            if (hasSection) {
                const sec = document.createElement('div');
                sec.className = 'mini-title-bar';
                container.appendChild(sec);
            }
            if (hasTopic) {
                const top = document.createElement('div');
                top.className = 'mini-topic-header';
                container.appendChild(top);
            }
            for (let k = 0; k < 3; k++) {
                const line = document.createElement('div');
                line.className = 'mini-text-line';
                if (k === 2) line.classList.add('short');
                container.appendChild(line);
            }
            const bullet = document.createElement('div');
            bullet.className = 'mini-bullet-line';
            bullet.innerHTML = `<div class="mini-bullet-dot"></div><div class="mini-bullet-text"></div>`;
            container.appendChild(bullet);
        };

        if (isTwoColumn) {
            const cols = document.createElement('div');
            cols.className = 'mini-body-columns';

            const leftCol = document.createElement('div');
            leftCol.className = 'mini-column-flow';
            drawContentInsideColumn(leftCol);

            const divider = document.createElement('div');
            divider.className = 'mini-col-divider';

            const rightCol = document.createElement('div');
            rightCol.className = 'mini-column-flow';
            for (let k = 0; k < 4; k++) {
                const line = document.createElement('div');
                line.className = 'mini-text-line';
                if (k === 3) line.classList.add('short');
                rightCol.appendChild(line);
            }

            cols.appendChild(leftCol);
            cols.appendChild(divider);
            cols.appendChild(rightCol);
            bodyContent.appendChild(cols);
        } else {
            drawContentInsideColumn(bodyContent);
        }

        const footer = document.createElement('div');
        footer.className = 'mini-page-footer';
        footer.textContent = `पेज - ${idx + 1}`;

        miniContent.appendChild(header);
        miniContent.appendChild(bodyContent);
        miniContent.appendChild(footer);
    }

    thumbWrapper.appendChild(miniContent);

    if (type === 'content') {
        const actionsOverlay = document.createElement('div');
        actionsOverlay.className = 'thumbnail-action-overlay';

        const cloneBtn = document.createElement('button');
        cloneBtn.className = 'thumb-action-btn btn-clone';
        cloneBtn.title = 'Duplicate Page';
        cloneBtn.innerHTML = '👥';
        cloneBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            duplicatePageAt(idx);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'thumb-action-btn btn-delete-card';
        deleteBtn.title = 'Delete Page';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePageAt(idx);
        });

        actionsOverlay.appendChild(cloneBtn);
        actionsOverlay.appendChild(deleteBtn);
        thumbWrapper.appendChild(actionsOverlay);
    }

    card.appendChild(thumbWrapper);

    const labelRow = document.createElement('div');
    labelRow.className = 'page-label-row';

    const labelNum = document.createElement('span');
    labelNum.className = 'page-label-num';
    if (type === 'cover') {
        labelNum.textContent = 'Cover Page';
    } else {
        labelNum.textContent = `Page ${idx}`;
    }

    const labelType = document.createElement('span');
    labelType.className = 'page-label-type';
    if (type === 'cover') {
        labelType.textContent = 'Cover';
    } else {
        labelType.textContent = state.pagesData[idx].layout === 'two-column' ? '2 Cols' : '1 Col';
    }

    labelRow.appendChild(labelNum);
    labelRow.appendChild(labelType);
    card.appendChild(labelRow);

    card.addEventListener('click', () => {
        gridCallbacks.switchActivePage(idx);
        if (dom.pageGridModal) {
            dom.pageGridModal.classList.remove('active');
            setTimeout(() => {
                dom.pageGridModal.style.display = 'none';
            }, 300);
        }
    });

    return card;
}

export function setupGridDragAndDrop() {
    const cards = dom.pageGridItemsContainer.querySelectorAll('.page-grid-card[draggable="true"]');
    let draggedIndex = null;

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedIndex = parseInt(card.getAttribute('data-index'), 10);
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedIndex);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            cards.forEach(c => c.style.border = '');
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        card.addEventListener('dragenter', (e) => {
            e.preventDefault();
            const targetIndex = parseInt(card.getAttribute('data-index'), 10);
            if (targetIndex !== draggedIndex) {
                card.style.border = '2px dashed var(--ui-accent, #c5a059)';
            }
        });

        card.addEventListener('dragleave', () => {
            card.style.border = '';
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.style.border = '';
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const toIndex = parseInt(card.getAttribute('data-index'), 10);

            if (isNaN(fromIndex) || isNaN(toIndex) || fromIndex === toIndex) return;
            if (fromIndex === 0 || toIndex === 0) return;

            gridCallbacks.saveCurrentInputState();

            const draggedPage = state.pagesData[fromIndex];
            state.pagesData.splice(fromIndex, 1);
            state.pagesData.splice(toIndex, 0, draggedPage);

            if (state.activePageIndex === fromIndex) {
                state.activePageIndex = toIndex;
            } else if (state.activePageIndex > fromIndex && state.activePageIndex <= toIndex) {
                state.activePageIndex--;
            } else if (state.activePageIndex < fromIndex && state.activePageIndex >= toIndex) {
                state.activePageIndex++;
            }

            gridCallbacks.renderPreview();
            gridCallbacks.switchActivePage(state.activePageIndex);
            gridCallbacks.saveWorkspaceToLocalStorage();
            renderGridPages();
        });
    });
}

export function initPageGrid(callbacks) {
    gridCallbacks = callbacks;

    if (dom.gridViewBtn) {
        dom.gridViewBtn.addEventListener('click', () => {
            gridCallbacks.saveCurrentInputState();
            dom.pageGridModal.classList.add('active');
            dom.pageGridModal.style.display = 'flex';
            renderGridPages();
        });
    }
    if (dom.closeGridModalBtn) {
        dom.closeGridModalBtn.addEventListener('click', () => {
            dom.pageGridModal.classList.remove('active');
            setTimeout(() => {
                dom.pageGridModal.style.display = 'none';
            }, 300);
        });
    }
    if (dom.pageGridModal) {
        dom.pageGridModal.addEventListener('click', (e) => {
            if (e.target === dom.pageGridModal) {
                dom.pageGridModal.classList.remove('active');
                setTimeout(() => {
                    dom.pageGridModal.style.display = 'none';
                }, 300);
            }
        });
    }
}
