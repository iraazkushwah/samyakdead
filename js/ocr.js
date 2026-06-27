/* ==========================================================================
   SAMYAK - DOCUMENT OCR DASHBOARD & SCAN CONTROLLER
   ========================================================================== */

import { state, dom } from './state.js';

const OCR_BACKEND_URL = "https://untitled-1038614782118.asia-southeast1.run.app/api/ocr";

export function resetOcrDashProject(forceClear = false) {
    if (forceClear) {
        state.ocrDashUploadedFile = null;
        if (dom.ocrDashFileInput) dom.ocrDashFileInput.value = '';
        if (dom.ocrDashPreviewImg) dom.ocrDashPreviewImg.src = '';
        
        if (dom.ocrDashPreviewArea) dom.ocrDashPreviewArea.style.display = 'none';
        if (dom.ocrDashDragZone) dom.ocrDashDragZone.style.display = 'flex';
        
        if (dom.ocrDashRawTextarea) dom.ocrDashRawTextarea.value = '';
        if (dom.ocrDashRenderedHtml) dom.ocrDashRenderedHtml.innerHTML = '';
        if (dom.ocrDashAlertsList) dom.ocrDashAlertsList.innerHTML = '';
        
        if (dom.ocrDashStatsBar) dom.ocrDashStatsBar.style.display = 'none';
        if (dom.ocrDashActionsBar) dom.ocrDashActionsBar.style.display = 'none';
        if (dom.ocrDashTabPreview) dom.ocrDashTabPreview.style.display = 'none';
        if (dom.ocrDashTabEditor) dom.ocrDashTabEditor.style.display = 'none';
        if (dom.ocrDashTabAlerts) dom.ocrDashTabAlerts.style.display = 'none';
        if (dom.ocrDashIdleState) dom.ocrDashIdleState.style.display = 'flex';
        if (dom.ocrDashViewStructured) dom.ocrDashViewStructured.style.display = 'none';
        if (dom.ocrDashViewEditor) dom.ocrDashViewEditor.style.display = 'none';
        if (dom.ocrDashViewAlerts) dom.ocrDashViewAlerts.style.display = 'none';
        
        if (dom.ocrDashProcessBtn) dom.ocrDashProcessBtn.style.display = 'none';
        if (dom.ocrDashProcessingIndicator) dom.ocrDashProcessingIndicator.style.display = 'none';
    } else {
        if (!state.ocrDashUploadedFile) {
            resetOcrDashProject(true);
        }
    }
}

export function handleOcrDashFileSelection(file) {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
        alert('File size limit is 15MB. Please choose a smaller document.');
        return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
        alert('Only images (PNG, JPG, JPEG) and PDF files are supported.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64String = event.target.result;
        const cleanBase64 = base64String.split(',')[1];

        state.ocrDashUploadedFile = {
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            type: file.type || (isPdf ? 'application/pdf' : 'image/png'),
            base64: cleanBase64,
            previewUrl: isImage ? base64String : null
        };

        if (dom.ocrDashFileName) dom.ocrDashFileName.textContent = state.ocrDashUploadedFile.name;
        if (dom.ocrDashFileSize) dom.ocrDashFileSize.textContent = state.ocrDashUploadedFile.size;
        if (dom.ocrDashFileBadge) dom.ocrDashFileBadge.textContent = isPdf ? 'PDF' : 'IMG';

        if (isImage) {
            if (dom.ocrDashPreviewImg) {
                dom.ocrDashPreviewImg.src = state.ocrDashUploadedFile.previewUrl;
                dom.ocrDashPreviewImg.style.display = 'block';
            }
        } else {
            if (dom.ocrDashPreviewImg) {
                dom.ocrDashPreviewImg.src = '';
                dom.ocrDashPreviewImg.style.display = 'none';
            }
        }

        if (dom.ocrDashDragZone) dom.ocrDashDragZone.style.display = 'none';
        if (dom.ocrDashPreviewArea) dom.ocrDashPreviewArea.style.display = 'flex';
        if (dom.ocrDashProcessBtn) dom.ocrDashProcessBtn.style.display = 'block';
        if (dom.ocrDashProcessingIndicator) dom.ocrDashProcessingIndicator.style.display = 'none';

        if (dom.ocrDashIdleState) dom.ocrDashIdleState.style.display = 'flex';
        if (dom.ocrDashStatsBar) dom.ocrDashStatsBar.style.display = 'none';
        if (dom.ocrDashActionsBar) dom.ocrDashActionsBar.style.display = 'none';
        if (dom.ocrDashTabPreview) dom.ocrDashTabPreview.style.display = 'none';
        if (dom.ocrDashTabEditor) dom.ocrDashTabEditor.style.display = 'none';
        if (dom.ocrDashTabAlerts) dom.ocrDashTabAlerts.style.display = 'none';
        if (dom.ocrDashViewStructured) dom.ocrDashViewStructured.style.display = 'none';
        if (dom.ocrDashViewEditor) dom.ocrDashViewEditor.style.display = 'none';
        if (dom.ocrDashViewAlerts) dom.ocrDashViewAlerts.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

export function populateOcrDashAlerts(alerts) {
    if (!dom.ocrDashAlertsList) return;

    if (alerts.length === 0) {
        dom.ocrDashAlertsList.innerHTML = `<div style="padding: 30px; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; color: #94a3b8;">
            <span style="font-size: 24px; display: block; margin-bottom: 8px;">✨</span>
            <strong>All text is fully legible!</strong> No handwriting alerts raised.
        </div>`;
        return;
    }

    let alertCardsHtml = '';
    alerts.forEach((alertItem, idx) => {
        alertCardsHtml += `
            <div class="ocr-dash-alert-card">
                <div class="ocr-dash-card-header">
                    <span class="ocr-dash-card-badge">⚠️ HIGH ALERT #${idx + 1}</span>
                    <span class="ocr-dash-card-reason">Reason: ${alertItem.reason || 'Blurry fragment'}</span>
                </div>
                <div>
                    <div class="ocr-dash-field-title">Fuzzy Fragment</div>
                    <p class="ocr-dash-field-val">${alertItem.fragment}</p>
                </div>
                <div>
                    <div class="ocr-dash-field-title">Sentence Context</div>
                    <p class="ocr-dash-field-val context">"...${alertItem.context}..."</p>
                </div>
            </div>
        `;
    });
    dom.ocrDashAlertsList.innerHTML = alertCardsHtml;
}

export function parseInlineHighlightsToHtml(text) {
    if (!text) return "";
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    escaped = escaped.replace(/==⚠️ High Alert: \[(.*?)\]==/g, (match, captured) => {
        return `<span class="high-alert-highlight" title="This handwriting segment is fuzzy or illegible. Please match with the original view.">⚠️ Fuzzy: ${captured}</span>`;
    });

    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/`(.*?)`/g, '<code style="font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 3px; color: #818cf8;">$1</code>');

    const mathSymbols = {
        '\\\\alpha': 'α',
        '\\\\beta': 'β',
        '\\\\gamma': 'γ',
        '\\\\delta': 'δ',
        '\\\\Delta': 'Δ',
        '\\\\theta': 'θ',
        '\\\\lambda': 'λ',
        '\\\\mu': 'μ',
        '\\\\pi': 'π',
        '\\\\sigma': 'σ',
        '\\\\omega': 'ω',
        '\\\\phi': 'φ',
        '\\\\infty': '∞',
        '\\\\times': '×',
        '\\\\div': '÷',
        '\\\\pm': '±',
        '\\\\leq': '≤',
        '\\\\geq': '≥',
        '\\\\neq': '≠',
        '\\\\approx': '≈',
        '\\\\sqrt': '√',
        '\\\\degree': '°'
    };
    for (const [key, unicode] of Object.entries(mathSymbols)) {
        escaped = escaped.replace(new RegExp(key, 'g'), unicode);
    }

    escaped = escaped.replace(/([a-zA-Z0-9\u0900-\u097F\)\}\]]+)\s*\^\s*\((.*?)\)/g, '$1<sup>$2</sup>');
    escaped = escaped.replace(/([a-zA-Z0-9\u0900-\u097F\)\}\]]+)\s*\^\s*([0-9a-zA-Z\u0900-\u097F+\-/*=]+)/g, '$1<sup>$2</sup>');
    escaped = escaped.replace(/([a-zA-Z0-9\u0900-\u097F\)\}\]]+)\s*_\s*\((.*?)\)/g, '$1<sub>$2</sub>');
    escaped = escaped.replace(/([a-zA-Z0-9\u0900-\u097F\)\}\]]+)\s*_\s*([0-9a-zA-Z\u0900-\u097F+\-/*=]+)/g, '$1<sub>$2</sub>');

    return escaped;
}

export function renderOcrDashMarkdownToHtml(text) {
    if (!text) return '';
    const lines = text.split('\n');
    let htmlOutput = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const indentMatch = line.match(/^(\s+)/);
        const indentPadding = indentMatch ? indentMatch[1].length * 8 : 0;
        const cleanLine = line.trim();

        if (!cleanLine) {
            htmlOutput += `<p style="min-height: 1.5rem;"></p>`;
            continue;
        }

        if (cleanLine.startsWith('<div style=') && cleanLine.endsWith('</div>')) {
            htmlOutput += cleanLine;
            continue;
        }

        if (cleanLine.startsWith('# ')) {
            htmlOutput += `<h1 style="padding-left: ${indentPadding}px">${parseInlineHighlightsToHtml(cleanLine.substring(2))}</h1>`;
            continue;
        }
        if (cleanLine.startsWith('## ')) {
            htmlOutput += `<h2 style="padding-left: ${indentPadding}px">${parseInlineHighlightsToHtml(cleanLine.substring(3))}</h2>`;
            continue;
        }
        if (cleanLine.startsWith('### ')) {
            htmlOutput += `<h3 style="padding-left: ${indentPadding}px">${parseInlineHighlightsToHtml(cleanLine.substring(4))}</h3>`;
            continue;
        }
        if (cleanLine.startsWith('- ') || cleanLine.startsWith('• ')) {
            htmlOutput += `<div style="padding-left: ${indentPadding + 16}px; display: flex; items-start: gap-2.5; margin: 6px 0;">
                <span style="color: #818cf8; font-weight: bold; margin-right: 8px;">•</span>
                <div style="flex: 1;">${parseInlineHighlightsToHtml(cleanLine.substring(2))}</div>
            </div>`;
            continue;
        }

        htmlOutput += `<p style="padding-left: ${indentPadding}px">${parseInlineHighlightsToHtml(cleanLine)}</p>`;
    }
    return htmlOutput;
}

export function triggerOcrDashBoundingBoxScan() {
    if (!dom.ocrDashPreviewImg) return;
    const previewContainer = dom.ocrDashPreviewImg.parentElement;
    if (!previewContainer) return;

    const oldBoxes = previewContainer.querySelectorAll('.ocr-word-highlight-box');
    oldBoxes.forEach(box => box.remove());

    const wordRows = 7;
    const wordsPerRow = 5;
    const totalScanTime = 1800;

    for (let r = 0; r < wordRows; r++) {
        const topVal = 14 + (r * 11) + (Math.random() * 2 - 1);
        for (let c = 0; c < wordsPerRow; c++) {
            const leftVal = 12 + (c * 15) + (Math.random() * 4 - 2);
            const widthVal = 8 + (Math.random() * 6);
            const heightVal = 4.5 + (Math.random() * 1.5);

            const box = document.createElement('div');
            box.className = 'ocr-word-highlight-box';
            box.style.top = topVal + '%';
            box.style.left = leftVal + '%';
            box.style.width = widthVal + '%';
            box.style.height = heightVal + '%';

            previewContainer.appendChild(box);

            const laserReachTime = (topVal / 100) * totalScanTime;

            setTimeout(() => {
                box.classList.add('active');
            }, laserReachTime);

            setTimeout(() => {
                box.classList.remove('active');
                box.classList.add('scanned-done');
            }, laserReachTime + 280);

            setTimeout(() => {
                box.style.opacity = '0';
                setTimeout(() => box.remove(), 400);
            }, totalScanTime + 1800);
        }
    }
}

export function formatOcrToSamyakMarkdown(text) {
    if (!text) return '';
    let lines = text.split('\n');
    let formattedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) {
            formattedLines.push('');
            continue;
        }
        
        if (i === 0 && (line.includes('समसामयिकी') || line.includes('मैगजीन') || line.includes('राजस्थान'))) {
            formattedLines.push('---');
            formattedLines.push('title: लोकबंधु');
            formattedLines.push('tagline: कोचिंग नहीं क्रांति');
            formattedLines.push(`subtitle: ${line}`);
            formattedLines.push('---');
            formattedLines.push('');
            continue;
        }
        
        const isSection = line.includes('योजनाएँ') || line.includes('योजनाएं') || line.includes('महोत्सव') || line.includes('मेले') || line.includes('कार्यक्रम') || line.includes('विविध') || line.includes('पुरस्कार') || line.includes('खेल');
        if (isSection && !line.startsWith('#')) {
            formattedLines.push(`# ${line}`);
            continue;
        }
        
        const isTopic = line.includes('योजना UPDATE') || line.includes('मिशन') || line.includes('सम्मेलन') || line.includes('समारोह') || line.includes('रिपोर्ट');
        if (isTopic && !line.startsWith('##')) {
            formattedLines.push(`## 🔶 ${line}`);
            continue;
        }
        
        if (line.includes(':-') || line.includes('के तहत') || line.includes('का विषय') || line.includes('आयोजन')) {
            if (!line.startsWith('•')) {
                let parts = line.split(/(:-\s*)/);
                if (parts.length >= 3) {
                    let label = parts[0].trim();
                    let rest = parts.slice(2).join('').trim();
                    formattedLines.push(`• **${label}** :- ${rest}`);
                } else {
                    formattedLines.push(`• ${line}`);
                }
            } else {
                formattedLines.push(line);
            }
            continue;
        }
        
        if (!line.startsWith('•') && !line.startsWith('#') && !line.startsWith('>')) {
            formattedLines.push(`• ${line}`);
        } else {
            formattedLines.push(line);
        }
    }
    
    return formattedLines.join('\n');
}

export function initOcr(callbacks) {
    const ocrTabs = [
        { btn: dom.ocrDashTabPreview, panel: dom.ocrDashViewStructured, name: 'preview' },
        { btn: dom.ocrDashTabEditor, panel: dom.ocrDashViewEditor, name: 'editor' },
        { btn: dom.ocrDashTabAlerts, panel: dom.ocrDashViewAlerts, name: 'alerts' }
    ];

    ocrTabs.forEach(tab => {
        if (tab.btn) {
            tab.btn.addEventListener('click', () => {
                ocrTabs.forEach(t => {
                    if (t.btn) t.btn.classList.remove('active');
                    if (t.panel) t.panel.style.display = 'none';
                });
                tab.btn.classList.add('active');
                if (tab.panel) tab.panel.style.display = 'block';
                state.ocrDashActiveTab = tab.name;
            });
        }
    });

    if (dom.ocrDashRawTextarea && dom.ocrDashRenderedHtml) {
        dom.ocrDashRawTextarea.addEventListener('input', () => {
            const rawText = dom.ocrDashRawTextarea.value;
            dom.ocrDashRenderedHtml.innerHTML = renderOcrDashMarkdownToHtml(rawText);
        });
    }

    if (dom.ocrDashLayoutToggle) {
        dom.ocrDashLayoutToggle.classList.toggle('active', state.ocrDashLayoutAnalysis);
        dom.ocrDashLayoutToggle.addEventListener('click', () => {
            state.ocrDashLayoutAnalysis = !state.ocrDashLayoutAnalysis;
            dom.ocrDashLayoutToggle.classList.toggle('active', state.ocrDashLayoutAnalysis);
            localStorage.setItem('samyak_ocr_layout_analysis', state.ocrDashLayoutAnalysis);
        });
    }

    if (dom.ocrDashStructToggle) {
        dom.ocrDashStructToggle.classList.toggle('active', state.ocrDashAutoStructuring);
        dom.ocrDashStructToggle.addEventListener('click', () => {
            state.ocrDashAutoStructuring = !state.ocrDashAutoStructuring;
            dom.ocrDashStructToggle.classList.toggle('active', state.ocrDashAutoStructuring);
            localStorage.setItem('samyak_ocr_auto_structuring', state.ocrDashAutoStructuring);
        });
    }

    if (dom.ocrDashDragZone && dom.ocrDashFileInput) {
        dom.ocrDashDragZone.addEventListener('click', () => dom.ocrDashFileInput.click());

        dom.ocrDashFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleOcrDashFileSelection(file);
        });

        dom.ocrDashDragZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dom.ocrDashDragZone.style.borderColor = 'var(--ui-accent, #c5a059)';
            dom.ocrDashDragZone.style.background = 'rgba(197, 160, 89, 0.05)';
        });

        dom.ocrDashDragZone.addEventListener('dragleave', () => {
            dom.ocrDashDragZone.style.borderColor = 'rgba(197, 160, 89, 0.25)';
            dom.ocrDashDragZone.style.background = 'rgba(197, 160, 89, 0.02)';
        });

        dom.ocrDashDragZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dom.ocrDashDragZone.style.borderColor = 'rgba(197, 160, 89, 0.25)';
            dom.ocrDashDragZone.style.background = 'rgba(197, 160, 89, 0.02)';
            const file = e.dataTransfer.files[0];
            handleOcrDashFileSelection(file);
        });
    }

    if (dom.ocrDashRemoveFileBtn) {
        dom.ocrDashRemoveFileBtn.addEventListener('click', () => {
            resetOcrDashProject(true);
        });
    }

    if (dom.ocrDashProcessBtn) {
        dom.ocrDashProcessBtn.addEventListener('click', async () => {
            if (!state.ocrDashUploadedFile) return;

            dom.ocrDashProcessBtn.style.display = 'none';
            if (dom.ocrDashProcessingIndicator) dom.ocrDashProcessingIndicator.style.display = 'flex';
            if (dom.ocrDashScanOverlay) dom.ocrDashScanOverlay.style.display = 'block';
            
            triggerOcrDashBoundingBoxScan();

            try {
                const selectedEngine = dom.ocrDashEngineSelect ? dom.ocrDashEngineSelect.value : "Google Vision API (High Precision)";
                const backendUrl = OCR_BACKEND_URL;
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileBase64: state.ocrDashUploadedFile.base64,
                        mimeType: state.ocrDashUploadedFile.type,
                        fileName: state.ocrDashUploadedFile.name,
                        engine: selectedEngine,
                        enableLayoutAnalysis: state.ocrDashLayoutAnalysis,
                        enableStructuring: state.ocrDashAutoStructuring
                    })
                });

                if (!response.ok) {
                    const errorText = await response.json();
                    throw new Error(errorText.error || `Server error: ${response.status}`);
                }

                const result = await response.json();

                dom.ocrDashRawTextarea.value = result.markdown;
                dom.ocrDashRenderedHtml.innerHTML = renderOcrDashMarkdownToHtml(result.markdown);
                
                populateOcrDashAlerts(result.alerts || []);
                if (dom.ocrDashAlertBadgeCount) dom.ocrDashAlertBadgeCount.textContent = result.alerts ? result.alerts.length : 0;

                if (dom.ocrDashConfidenceVal) dom.ocrDashConfidenceVal.textContent = (result.confidenceEstimate || 98.4) + '%';
                if (dom.ocrDashWordcountVal) dom.ocrDashWordcountVal.textContent = result.wordCount || result.markdown.split(/\s+/).filter(Boolean).length;
                if (dom.ocrDashAlertsCountVal) dom.ocrDashAlertsCountVal.textContent = result.alerts ? result.alerts.length : 0;

                if (dom.ocrDashIdleState) dom.ocrDashIdleState.style.display = 'none';
                if (dom.ocrDashStatsBar) dom.ocrDashStatsBar.style.display = 'grid';
                if (dom.ocrDashActionsBar) dom.ocrDashActionsBar.style.display = 'flex';
                
                if (dom.ocrDashTabPreview) dom.ocrDashTabPreview.style.display = 'block';
                if (dom.ocrDashTabEditor) dom.ocrDashTabEditor.style.display = 'block';
                if (dom.ocrDashTabAlerts) dom.ocrDashTabAlerts.style.display = 'block';

                ocrTabs.forEach(t => {
                    if (t.btn) t.btn.classList.remove('active');
                    if (t.panel) t.panel.style.display = 'none';
                });
                if (dom.ocrDashTabPreview) dom.ocrDashTabPreview.classList.add('active');
                if (dom.ocrDashViewStructured) dom.ocrDashViewStructured.style.display = 'block';
                state.ocrDashActiveTab = 'preview';

                if (result.alerts && result.alerts.length > 0) {
                    alert(`⚡ Scanning complete! Detected ${result.alerts.length} handwriting segments containing blurry or fuzzy content. Review them in the 'Legibility Alerts' tab.`);
                }

            } catch (err) {
                console.error('OCR Processing error:', err);
                alert(`❌ OCR Processing Error: ${err.message || 'Could not connect to the Gemini backend.'}`);
            } finally {
                if (dom.ocrDashScanOverlay) dom.ocrDashScanOverlay.style.display = 'none';
                if (dom.ocrDashProcessingIndicator) dom.ocrDashProcessingIndicator.style.display = 'none';
                dom.ocrDashProcessBtn.style.display = 'block';
                dom.ocrDashProcessBtn.textContent = 'Process Again';
            }
        });
    }

    if (dom.ocrDashCopyBtn) {
        dom.ocrDashCopyBtn.addEventListener('click', () => {
            const text = dom.ocrDashRawTextarea.value;
            if (!text) return;
            navigator.clipboard.writeText(text);
            dom.ocrDashCopyBtn.textContent = 'Copied! ✓';
            setTimeout(() => {
                dom.ocrDashCopyBtn.textContent = 'Copy to Clipboard';
            }, 2500);
        });
    }

    if (dom.ocrDashDownloadBtn) {
        dom.ocrDashDownloadBtn.addEventListener('click', () => {
            const text = dom.ocrDashRawTextarea.value;
            if (!text) return;
            const element = document.createElement("a");
            const file = new Blob([text], { type: "text/plain;charset=utf-8" });
            element.href = URL.createObjectURL(file);
            element.download = `${state.ocrDashUploadedFile?.name.split(".")[0] || "samyak-ocr-output"}.md`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        });
    }

    if (dom.ocrDashInsertBtn) {
        dom.ocrDashInsertBtn.addEventListener('click', () => {
            const textToInsert = dom.ocrDashRawTextarea.value;
            if (!textToInsert) {
                alert("इन्सर्ट करने के लिए कोई टेक्स्ट नहीं मिला! पहले OCR स्कैन करें।\nNo digitized text found to insert! Please scan a document first.");
                return;
            }

            if (dom.ocrDestinationPageSelect) {
                let optionsHtml = '';
                for (let i = 1; i < state.pagesData.length; i++) {
                    if (!state.pagesData[i]) continue;
                    const pageTextSnippet = state.pagesData[i].text ? state.pagesData[i].text.trim().substring(0, 30).replace(/[#*`>🔶•-]/g, '').trim() : '';
                    const displayTitle = pageTextSnippet ? ` - ${pageTextSnippet}...` : '';
                    optionsHtml += `<option value="${i}">Page ${i + 1}${displayTitle}</option>`;
                }
                optionsHtml += `<option value="create_new">➕ Create a New Page & Insert</option>`;
                dom.ocrDestinationPageSelect.innerHTML = optionsHtml;
            }

            if (dom.ocrPageSelectorModal) {
                dom.ocrPageSelectorModal.classList.add('active');
            }
        });
    }

    if (dom.ocrPageSelectorClose) {
        dom.ocrPageSelectorClose.addEventListener('click', () => {
            dom.ocrPageSelectorModal.classList.remove('active');
        });
    }
    if (dom.ocrPageSelectorCancel) {
        dom.ocrPageSelectorCancel.addEventListener('click', () => {
            dom.ocrPageSelectorModal.classList.remove('active');
        });
    }
    if (dom.ocrPageSelectorModal) {
        dom.ocrPageSelectorModal.addEventListener('click', (e) => {
            if (e.target === dom.ocrPageSelectorModal) {
                dom.ocrPageSelectorModal.classList.remove('active');
            }
        });
    }

    if (dom.ocrPageSelectorConfirm) {
        dom.ocrPageSelectorConfirm.addEventListener('click', () => {
            try {
                const selectedVal = dom.ocrDestinationPageSelect ? dom.ocrDestinationPageSelect.value : 'create_new';
                const textToInsert = dom.ocrDashRawTextarea.value;
                if (!textToInsert) {
                    alert("No text to insert!");
                    return;
                }

                let targetIndex;
                if (selectedVal === 'create_new') {
                    callbacks.addPage();
                    targetIndex = state.pagesData.length - 1;
                } else {
                    targetIndex = parseInt(selectedVal);
                }

                if (isNaN(targetIndex) || targetIndex < 0 || !state.pagesData[targetIndex]) {
                    alert("Invalid target page index selected.");
                    return;
                }

                callbacks.switchActivePage(targetIndex, true);

                const currentText = dom.pageContentInput.value || '';
                const selStart = dom.pageContentInput.selectionStart || 0;
                const selEnd = dom.pageContentInput.selectionEnd || 0;
                
                const newText = currentText.substring(0, selStart) + '\n' + textToInsert + '\n' + currentText.substring(selEnd);
                dom.pageContentInput.value = newText;
                state.pagesData[targetIndex].text = newText;

                callbacks.renderPreview();
                callbacks.saveWorkspaceToLocalStorage();
                callbacks.updateStats();

                callbacks.switchSidebarTab('panel-editor');

                dom.ocrPageSelectorModal.classList.remove('active');

                setTimeout(() => {
                    if (dom.pageContentInput) dom.pageContentInput.focus();
                }, 100);

                alert('OCR text successfully inserted into the page editor!');
            } catch (err) {
                console.error("Error confirming page insertion:", err);
                alert("Error inserting text into page: " + err.message);
            }
        });
    }
}
