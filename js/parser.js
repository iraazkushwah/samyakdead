/* ==========================================================================
   SAMYAK - MARKDOWN PARSER, HTML RENDERER & PAGINATOR
   ========================================================================== */

import { state, dom, sectionIcons } from './state.js';

let parserCallbacks = {};

export function initParser(callbacks) {
    parserCallbacks = callbacks;
}

export function clearHeightEstimationCache() {
    if (typeof heightEstimationCache !== 'undefined' && heightEstimationCache.clear) {
        heightEstimationCache.clear();
    }
}

    // 5. PARSER & HTML BUILDER
    function preProcessText(text) {
        if (!text) return '';
        
        // Normalize newlines by removing carriage returns, and strip invisible characters/BOMs
        let formatted = text.replace(/\r/g, '').replace(/[\u200B\uFEFF\u200C\u200D\u200E\u200F]/g, '');
        
        // 1. Insert newlines before any diamond emojis unless preceded by '#' (markdown headings)
        formatted = formatted.replace(/([^\n#\s])\s*(🔶|🔷|🔸|🔹|♦️|💎)/g, '$1\n$2');
        
        // 2. Insert newlines before bullet points if not already preceded by one
        formatted = formatted.replace(/([^\n])\s*(•|●|■|▪|▫|[\u2022\u25CF\u25AA\u25AB])/g, '$1\n$2');
        
        // 3. Insert newlines before known sections if they are embedded in text
        // (Excluding short/common nouns like 'पुरस्कार', 'खेल', 'विविध', 'चर्चित व्यक्तित्व', 'प्रमुख अभियान' to avoid mid-sentence split glitches)
        const autoSplitSections = [
            "योजनाएँ एवं नीतियाँ", "योजनाएँ एवं नीतियां", "योजनाएं एवं नीतियां", 
            "महोत्सव/मेले/कार्यक्रम", "महोत्सव, मेले व कार्यक्रम", "महोत्सव, मेले और कार्यक्रम",
            "आर्थिक विकास व समझौते", "आर्थिक विकास", "आर्थिक विकास और समझौते"
        ];
        autoSplitSections.forEach(sec => {
            const escapedSec = sec.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`([^\\n#\\s])\\s*(${escapedSec})`, 'g');
            formatted = formatted.replace(regex, '$1\n$2');
        });

        return formatted;
    }

    function formatMarkdownText(text) {
        if (!text) return '';
        const colorMap = {
            'y': 'yellow', 'yellow': 'yellow',
            'g': 'green', 'green': 'green',
            'p': 'pink', 'pink': 'pink',
            'b': 'blue', 'blue': 'blue',
            'o': 'orange', 'orange': 'orange',
            'r': 'red', 'red': 'red'
        };
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/==(?:(yellow|green|pink|blue|orange|red|y|g|p|b|o|r)\|)?(.*?)==/gi, (match, color, content) => {
                const colorKey = (color || 'yellow').toLowerCase();
                const normalizedColor = colorMap[colorKey] || 'yellow';
                return `<mark class="text-highlight highlight-${normalizedColor}">${content}</mark>`;
            });

        // 1. Math Unicode Shorthand Replacements (e.g. \pi -> π, \alpha -> α)
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
            formatted = formatted.replace(new RegExp(key, 'g'), unicode);
        }

        // 2. Exponent / Superscript parsing: base^(exponent) or base^exponent (e.g. x^2 -> x<sup>2</sup>)
        formatted = formatted.replace(/([a-zA-Z0-9\u0900-\u097F\)\}\]]+)\s*\^\s*\((.*?)\)/g, '$1<sup>$2</sup>');
        formatted = formatted.replace(/([a-zA-Z0-9\u0900-\u097F\)\}\]]+)\s*\^\s*([0-9a-zA-Z\u0900-\u097F+\-/*=]+)/g, '$1<sup>$2</sup>');

        // 3. Subscript parsing: base_(subscript) or base_subscript (e.g. H_2O -> H<sub>2</sub>O)
        formatted = formatted.replace(/([a-zA-Z0-9\u0900-\u097F\)\}\]]+)\s*_\s*\((.*?)\)/g, '$1<sub>$2</sub>');
        formatted = formatted.replace(/([a-zA-Z0-9\u0900-\u097F\)\}\]]+)\s*_\s*([0-9a-zA-Z\u0900-\u097F+\-/*=]+)/g, '$1<sub>$2</sub>');

        return formatted;
    }

    export function getBlockMarkdown(block) {
        if (!block) return '';
        if (block.type === 'box-container') {
            const tag = block.boxType || 'box';
            return `[${tag}]\n${block.markdown || ''}\n[/box]`;
        }
        if (block.type === 'explanation') {
            const qPart = block.qNum ? ` q="${block.qNum}"` : '';
            return `[explanation${qPart}]\n${block.markdown || ''}\n[/explanation]`;
        }
        if (block.type === 'table' && block.config) {
            return `${block.config}\n${block.markdown}`;
        }
        return block.markdown !== undefined ? block.markdown : '';
    }

    export function parseTextToBlocks(text) {
        // Preserving trailing spaces and newlines to prevent cursor jumping
        text = text || '';
        text = preProcessText(text);
        const lines = text.split('\n');
        const blocks = [];
        
        function cleanRepeatedTableHeaders(tableLines) {
            if (!tableLines || tableLines.length < 3) return tableLines;
            
            const isSeparator = (str) => /^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(str);
            const cleanLines = [tableLines[0], tableLines[1]];
            const headerTrimmed = tableLines[0].trim().replace(/\s+/g, ' ');
            
            for (let k = 2; k < tableLines.length; k++) {
                const currentLine = tableLines[k];
                const currentTrimmed = currentLine.trim().replace(/\s+/g, ' ');
                
                if (k + 1 < tableLines.length && 
                    currentTrimmed === headerTrimmed && 
                    isSeparator(tableLines[k + 1])) {
                    k++; 
                    continue;
                }
                cleanLines.push(currentLine);
            }
            return cleanLines;
        }
        
        const knownSections = [
            "योजनाएँ एवं नीतियाँ", "योजनाएँ एवं नीतियां", "योजनाएं एवं नीतियां", 
            "महोत्सव/मेले/कार्यक्रम", "महोत्सव, मेले व कार्यक्रम", "महोत्सव, मेले और कार्यक्रम",
            "आर्थिक विकास व समझौते", "आर्थिक विकास", "आर्थिक विकास और समझौते",
            "चर्चित व्यक्तित्व", "पुरस्कार", "खेल", "खेल समाचार", "विविध", 
            "विविध घटनाक्रम", "प्रमुख अभियान"
        ];

        for (let i = 0; i < lines.length; i++) {
            const start = i;
            const line = lines[i];
            const trimmed = line.trim();
            if (!trimmed) {
                blocks.push({
                    type: 'empty',
                    markdown: '',
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            // 0.2 BOX CONTAINER BLOCK DETECTOR
            const bulletRegex = /^\s*(?:[•\-\*\u2022\u25CF]|\(\d+\)|\d+\.)\s*/;
            const cleanBoxLine = trimmed.replace(bulletRegex, '').trim();

            if (cleanBoxLine.startsWith('[box') && cleanBoxLine.endsWith(']')) {
                const boxType = cleanBoxLine.substring(1, cleanBoxLine.length - 1); // e.g. "box", "box-double", "box-dashed", "box-bg", "box-royal"
                let boxLines = [];
                i++; // consume opening tag line
                while (i < lines.length) {
                    const nextLine = lines[i];
                    const nextTrimmed = nextLine.trim();
                    const nextCleanBoxLine = nextTrimmed.replace(bulletRegex, '').trim();
                    if (nextCleanBoxLine === '[/box]') {
                        break;
                    }
                    boxLines.push(nextLine);
                    i++;
                }
                blocks.push({
                    type: 'box-container',
                    boxType: boxType,
                    markdown: boxLines.join('\n'),
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            // 0.22 BILINGUAL MCQ BLOCK DETECTOR
            const bilingualMCQStartMatch = cleanBoxLine.match(/^\[bilingual-mcq(?:\s+q=["']?(\d+)["']?)?\]$/i);
            if (bilingualMCQStartMatch) {
                const qNum = bilingualMCQStartMatch[1] || null;
                let mcqLines = [];
                i++;
                while (i < lines.length) {
                    const nextLine = lines[i];
                    const nextTrimmed = nextLine.trim();
                    const nextCleanBoxLine = nextTrimmed.replace(bulletRegex, '').trim();
                    if (nextCleanBoxLine === '[/bilingual-mcq]') {
                        break;
                    }
                    mcqLines.push(nextLine);
                    i++;
                }
                const fullInner = mcqLines.join('\n');
                let hiMarkdown = "";
                let enMarkdown = "";
                const hiIndex = fullInner.indexOf('{hi}');
                const enIndex = fullInner.indexOf('{en}');
                if (hiIndex !== -1 && enIndex !== -1) {
                    if (hiIndex < enIndex) {
                        hiMarkdown = fullInner.substring(hiIndex + 4, enIndex).trim();
                        enMarkdown = fullInner.substring(enIndex + 4).trim();
                    } else {
                        enMarkdown = fullInner.substring(enIndex + 4, hiIndex).trim();
                        hiMarkdown = fullInner.substring(hiIndex + 4).trim();
                    }
                } else if (hiIndex !== -1) {
                    hiMarkdown = fullInner.substring(hiIndex + 4).trim();
                } else if (enIndex !== -1) {
                    enMarkdown = fullInner.substring(enIndex + 4).trim();
                } else {
                    hiMarkdown = fullInner.trim();
                }
                blocks.push({
                    type: 'bilingual-mcq',
                    qNum: qNum,
                    hiMarkdown: hiMarkdown,
                    enMarkdown: enMarkdown,
                    markdown: line + '\n' + mcqLines.join('\n') + '\n' + (lines[i] || ''),
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            // 0.24 EXPLANATION BLOCK DETECTOR
            const explanationStartMatch = cleanBoxLine.match(/^\[explanation(?:\s+q=["']?(\d+)["']?)?\]$/i);
            if (explanationStartMatch) {
                const qNum = explanationStartMatch[1] || null;
                let expLines = [];
                i++;
                while (i < lines.length) {
                    const nextLine = lines[i];
                    const nextTrimmed = nextLine.trim();
                    const nextCleanBoxLine = nextTrimmed.replace(bulletRegex, '').trim();
                    if (nextCleanBoxLine === '[/explanation]') {
                        break;
                    }
                    expLines.push(nextLine);
                    i++;
                }
                blocks.push({
                    type: 'explanation',
                    qNum: qNum,
                    markdown: expLines.join('\n'),
                    startLine: start,
                    endLine: i
                });
                continue;
            }


            // Match '[chapter <attrs>] <title> | <subtitle>' where attrs can have chapter number and size=XX
            const chapterMatch = trimmed.match(/^\[chapter\s*([^\]]*?)\]\s*([^|]*?)(?:\s*\|\s*(.*))?$/i);
            if (chapterMatch) {
                let attrs = chapterMatch[1];
                let fontSize = null;
                const sizeMatch = attrs.match(/size=(\d+)/i);
                if (sizeMatch) {
                    fontSize = parseInt(sizeMatch[1], 10);
                    attrs = attrs.replace(/size=\d+/i, '').trim();
                }
                const numMatch = attrs.match(/(?:\b|^)(\d+)(?:\b|$)/);
                const chapterNum = numMatch ? numMatch[1] : null;

                blocks.push({
                    type: 'chapter-header',
                    chapterNum: chapterNum,
                    fontSize: fontSize,
                    mainTitle: chapterMatch[2].trim(),
                    subTitle: chapterMatch[3] ? chapterMatch[3].trim() : null,
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            // Match 'space [1-50]' (optional brackets, count defaults to 1, capped at 50)
            const spaceMatch = trimmed.match(/^\[?(space|spce)(?:\s+(\d+))?\]?$/i);
            if (spaceMatch) {
                const count = Math.min(50, spaceMatch[2] ? parseInt(spaceMatch[2], 10) : 1);
                blocks.push({
                    type: 'spacer',
                    count: count,
                    markdown: trimmed,
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            // Custom Parsed Template Comment Blocks
            if (trimmed.startsWith('<!-- personality|') && trimmed.endsWith('-->')) {
                blocks.push({
                    type: 'personality',
                    markdown: trimmed,
                    startLine: start,
                    endLine: i
                });
                continue;
            }
            if (trimmed.startsWith('<!-- stats|') && trimmed.endsWith('-->')) {
                blocks.push({
                    type: 'stats',
                    markdown: trimmed,
                    startLine: start,
                    endLine: i
                });
                continue;
            }
            if (trimmed.startsWith('<!-- facts-grid|') && trimmed.endsWith('-->')) {
                blocks.push({
                    type: 'facts-grid',
                    markdown: trimmed,
                    startLine: start,
                    endLine: i
                });
                continue;
            }
            if (trimmed.startsWith('<!-- announcement|') && trimmed.endsWith('-->')) {
                blocks.push({
                    type: 'announcement',
                    markdown: trimmed,
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            // 0. TABLE DETECTOR WITH CONFIG SUPPORT
            let tableConfig = null;
            let tableConfigFormat = null;
            if (trimmed.startsWith('<!-- table|') && trimmed.endsWith('-->')) {
                tableConfig = trimmed;
                tableConfigFormat = 'comment';
                if (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
                    i++; // consume comment, move to first table row
                    let tableLines = [lines[i]];
                    while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
                        i++;
                        tableLines.push(lines[i]);
                    }
                    tableLines = cleanRepeatedTableHeaders(tableLines);
                    blocks.push({
                        type: 'table',
                        config: tableConfig,
                        configFormat: tableConfigFormat,
                        markdown: tableLines.join('\n'),
                        startLine: start,
                        endLine: i
                    });
                    continue;
                }
            } else if (trimmed.startsWith('[table') && trimmed.endsWith(']')) {
                tableConfig = trimmed;
                tableConfigFormat = 'square';
                if (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
                    i++; // consume tag, move to first table row
                    let tableLines = [lines[i]];
                    while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
                        i++;
                        tableLines.push(lines[i]);
                    }
                    tableLines = cleanRepeatedTableHeaders(tableLines);
                    blocks.push({
                        type: 'table',
                        config: tableConfig,
                        configFormat: tableConfigFormat,
                        markdown: tableLines.join('\n'),
                        startLine: start,
                        endLine: i
                    });
                    continue;
                }
            } else if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
                let tableLines = [line];
                while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
                    i++;
                    tableLines.push(lines[i]);
                }
                tableLines = cleanRepeatedTableHeaders(tableLines);
                blocks.push({
                    type: 'table',
                    config: null,
                    markdown: tableLines.join('\n'),
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            // 0.5 PAGEBREAK DETECTOR
            if (trimmed === '[pagebreak]' || trimmed === '---') {
                blocks.push({
                    type: 'pagebreak',
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            // 0.55 COLUMN BREAK DETECTOR
            if (trimmed === '[columnbreak]' || trimmed === '[colbreak]') {
                blocks.push({
                    type: 'columnbreak',
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
                continue;
            }


            // 0.6 THANK YOU BOX DETECTOR / STAR DIVIDER
            if (trimmed === '[thankyou]' || trimmed === '***' || trimmed === '* * *' || trimmed === '✦ ✦ ✦') {
                blocks.push({
                    type: 'thankyou',
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
                continue;
            }

            const cleanLine = trimmed.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '').trim();

            // 1. SECTION BAR DETECTOR
            if (trimmed.startsWith('# ') || (trimmed.startsWith('#') && !trimmed.startsWith('##'))) {
                let fontSize = null;
                const sizeMatch = trimmed.match(/\[size=(\d+)\]/i);
                if (sizeMatch) {
                    fontSize = parseInt(sizeMatch[1], 10);
                }
                blocks.push({
                    type: 'section',
                    fontSize: fontSize,
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
            } else if (
                !trimmed.startsWith('##') &&
                !/^[🔶🔷🔸🔹♦️💎]/u.test(trimmed) &&
                knownSections.some(sec => {
                    const cleanSec = sec.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '').trim();
                    return cleanLine === cleanSec || trimmed === sec;
                })
            ) {
                let fontSize = null;
                const sizeMatch = trimmed.match(/\[size=(\d+)\]/i);
                if (sizeMatch) {
                    fontSize = parseInt(sizeMatch[1], 10);
                }
                blocks.push({
                    type: 'section',
                    fontSize: fontSize,
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
            } 
            
            // 2. TOPIC HEADING DETECTOR
            else if (
                trimmed.startsWith('## ') || 
                trimmed.startsWith('##') || 
                /^[🔶🔷🔸🔹♦️💎]/u.test(trimmed) ||
                /^##\s*[🔶🔷🔸🔹♦️💎]/u.test(trimmed)
            ) {
                let fontSize = null;
                const sizeMatch = trimmed.match(/\[size=(\d+)\]/i);
                if (sizeMatch) {
                    fontSize = parseInt(sizeMatch[1], 10);
                }
                blocks.push({
                    type: 'topic',
                    fontSize: fontSize,
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
            } 
            
            // 3. BULLET ITEM DETECTOR
            else if (/^\s*(?:[•\u2022\u25CF\u25AA\u25AB➜⭐★]\s*|[-\*]\s+|🔶|🔷|🔸|🔹|♦️|💎|\d+[\.\)]|\(\d+\)|[a-zA-Z][\.\)]|\([a-zA-Z]\)|[ivxIVX]+[\.\)]|\([ivxIVX]+\))/i.test(trimmed)) {
                const leadingSpaces = line.match(/^(\s+)/);
                const isNested = leadingSpaces && leadingSpaces[1].length >= 2;
                blocks.push({
                    type: 'bullet',
                    markdown: line,
                    startLine: start,
                    endLine: i,
                    isNested: isNested,
                    indentLevel: isNested ? Math.floor(leadingSpaces[1].length / 2) : 0
                });
            } 
            
            // 4. HIGHLIGHT BOX / QUOTE DETECTOR
            else if (trimmed.startsWith('> ')) {
                blocks.push({
                    type: 'box',
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
            } 

            // 4.5 IMAGE DETECTOR
            else if (trimmed.startsWith('![') && trimmed.endsWith(')')) {
                blocks.push({
                    type: 'image',
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
            }
            
            // 5. REGULAR BODY PARAGRAPH
            else {
                blocks.push({
                    type: 'paragraph',
                    markdown: line,
                    startLine: start,
                    endLine: i
                });
            }
        }

        return blocks;
    }

    function parseCommentAttributes(str) {
        const attrs = {};
        const content = str.replace('<!--', '').replace('-->', '').trim();
        const pipeIdx = content.indexOf('|');
        if (pipeIdx === -1) return attrs;
        
        const partsStr = content.substring(pipeIdx + 1);
        const parts = partsStr.split('|');
        parts.forEach(part => {
            const eqIdx = part.indexOf('=');
            if (eqIdx !== -1) {
                const key = part.substring(0, eqIdx).trim();
                const val = part.substring(eqIdx + 1).trim();
                attrs[key] = val;
            }
        });
        return attrs;
    }


    // Helper to build the premium magazine end star divider (***)
    function createEndDividerElement() {
        const dividerContainer = document.createElement('div');
        dividerContainer.className = 'end-page-divider';
        
        const sym = state.customDesignSettings.endStarSymbol || '✦';
        
        const star1 = document.createElement('span');
        star1.className = 'star-symbol';
        star1.textContent = sym;
        
        const star2 = document.createElement('span');
        star2.className = 'star-symbol';
        star2.textContent = sym;
        
        const star3 = document.createElement('span');
        star3.className = 'star-symbol';
        star3.textContent = sym;
        
        dividerContainer.appendChild(star1);
        dividerContainer.appendChild(star2);
        dividerContainer.appendChild(star3);
        
        return dividerContainer;
    }

    function renderBlockToNode(block) {
        const line = block.markdown.trim();
        
        if (block.type === 'chapter-header') {
            const chapterHeader = document.createElement('div');
            chapterHeader.className = 'chapter-header';
            
            const titleGroup = document.createElement('div');
            titleGroup.className = 'chapter-title-group';
            
            if (block.chapterNum) {
                const numberWrapper = document.createElement('div');
                numberWrapper.className = 'chapter-number-wrapper';
                
                const accentBg = document.createElement('div');
                accentBg.className = 'chapter-num-accent-bg';
                
                const mainBg = document.createElement('div');
                mainBg.className = 'chapter-num-main-bg';
                
                const numSpan = document.createElement('span');
                numSpan.className = 'chapter-num-text';
                numSpan.textContent = block.chapterNum;
                
                numberWrapper.appendChild(accentBg);
                numberWrapper.appendChild(mainBg);
                numberWrapper.appendChild(numSpan);
                
                chapterHeader.appendChild(numberWrapper);
                titleGroup.style.paddingRight = '70px'; // Offset for center alignment
            } else {
                titleGroup.style.paddingRight = '0px';
            }
            
            const mainTitle = document.createElement('h2');
            mainTitle.className = 'chapter-main-title';
            if (block.fontSize) {
                mainTitle.style.fontSize = `${block.fontSize}px`;
            }
            mainTitle.innerHTML = parseInlineHighlightsToHtml(block.mainTitle);
            titleGroup.appendChild(mainTitle);
            
            if (block.subTitle) {
                const subTitle = document.createElement('h3');
                subTitle.className = 'chapter-sub-title';
                subTitle.innerHTML = parseInlineHighlightsToHtml(block.subTitle);
                titleGroup.appendChild(subTitle);
            }
            
            chapterHeader.appendChild(titleGroup);
            return chapterHeader;
        }

        if (block.type === 'box-container') {
            const containerEl = document.createElement('div');
            containerEl.className = `premium-box ${block.boxType || 'box'}`;
            
            // Parse the internal markdown into blocks recursively
            const innerBlocks = parseTextToBlocks(block.markdown);
            
            // Render and append each block
            innerBlocks.forEach(innerBlock => {
                const node = renderBlockToNode(innerBlock);
                if (node) {
                    containerEl.appendChild(node);
                }
            });
            
            return containerEl;
        }

        if (block.type === 'bilingual-mcq') {
            const container = document.createElement('div');
            container.className = 'bilingual-mcq-container';
            
            const hiCol = document.createElement('div');
            hiCol.className = 'bilingual-mcq-col bilingual-mcq-hi';
            const hiBlocks = parseTextToBlocks(block.hiMarkdown);
            hiBlocks.forEach(b => {
                const node = renderBlockToNode(b);
                if (node) hiCol.appendChild(node);
            });
            
            const enCol = document.createElement('div');
            enCol.className = 'bilingual-mcq-col bilingual-mcq-en';
            const enBlocks = parseTextToBlocks(block.enMarkdown);
            enBlocks.forEach(b => {
                const node = renderBlockToNode(b);
                if (node) enCol.appendChild(node);
            });
            
            container.appendChild(hiCol);
            container.appendChild(enCol);
            return container;
        }

        if (block.type === 'explanation') {
            const wrapper = document.createElement('div');
            wrapper.className = 'explanation-wrapper';
            
            const expStyle = state.customDesignSettings.explanationStyle || 'modern-accent';
            wrapper.classList.add(`style-${expStyle}`);
            
            // Floating style toggle action button on the preview card
            const toggleStyleBtn = document.createElement('button');
            toggleStyleBtn.className = 'explanation-style-toggle';
            toggleStyleBtn.title = 'Change Explanation Style (व्याख्या कार्ड स्टाइल बदलें)';
            toggleStyleBtn.innerHTML = '🔄';
            toggleStyleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const styleArray = ['classic-header', 'modern-accent', 'editorial-ribbon', 'glass-floating', 'two-tone-split'];
                const currentStyle = state.customDesignSettings.explanationStyle || 'modern-accent';
                let nextIdx = (styleArray.indexOf(currentStyle) + 1) % styleArray.length;
                const nextStyle = styleArray[nextIdx];
                
                state.customDesignSettings.explanationStyle = nextStyle;
                
                const designExplanationStyle = document.getElementById('design-explanation-style');
                if (designExplanationStyle) {
                    designExplanationStyle.value = nextStyle;
                }
                
                renderPreview();
                parserCallbacks.saveWorkspaceToLocalStorage();
            });
            wrapper.appendChild(toggleStyleBtn);
            
            if (block.qNum) {
                const qNumEl = document.createElement('div');
                qNumEl.className = 'explanation-qnum';
                qNumEl.textContent = `${block.qNum}.`;
                wrapper.appendChild(qNumEl);
            }
            
            const card = document.createElement('div');
            card.className = 'explanation-card';
            
            const header = document.createElement('div');
            header.className = 'explanation-header';
            header.textContent = 'Explanation';
            card.appendChild(header);
            
            const content = document.createElement('div');
            content.className = 'explanation-content';
            const innerBlocks = parseTextToBlocks(block.markdown);
            innerBlocks.forEach(b => {
                const node = renderBlockToNode(b);
                if (node) content.appendChild(node);
            });
            
            card.appendChild(content);
            wrapper.appendChild(card);
            return wrapper;
        }
        
        if (block.type === 'personality') {
            const attrs = parseCommentAttributes(line);
            const card = document.createElement('div');
            card.className = 'personality-feature-card';
            
            const avatar = document.createElement('div');
            avatar.className = 'personality-avatar-wrapper';
            avatar.textContent = attrs.avatar || '👤';
            
            const info = document.createElement('div');
            info.className = 'personality-info';
            
            const name = document.createElement('div');
            name.className = 'personality-name';
            name.textContent = attrs.name || 'ऋषभ पारेख';
            
            const title = document.createElement('div');
            title.className = 'personality-title';
            title.textContent = attrs.title || 'संस्कृत व्याकरण विशेषज्ञ';
            
            const desc = document.createElement('div');
            desc.className = 'personality-description';
            desc.textContent = attrs.desc || 'विवरण उपलब्ध नहीं है।';
            
            info.appendChild(name);
            info.appendChild(title);
            info.appendChild(desc);
            card.appendChild(avatar);
            card.appendChild(info);
            return card;
        }
        if (block.type === 'stats') {
            const attrs = parseCommentAttributes(line);
            const grid = document.createElement('div');
            grid.className = 'stats-callout-grid';
            
            if (attrs.num1 || attrs.lbl1) {
                const c1 = document.createElement('div');
                c1.className = 'stat-card';
                c1.innerHTML = `
                    <div class="stat-number">${attrs.num1 || '0'}</div>
                    <div class="stat-label">${attrs.lbl1 || 'Label'}</div>
                    <div class="stat-desc">${attrs.desc1 || ''}</div>
                `;
                grid.appendChild(c1);
            }
            if (attrs.num2 || attrs.lbl2) {
                const c2 = document.createElement('div');
                c2.className = 'stat-card';
                c2.innerHTML = `
                    <div class="stat-number">${attrs.num2 || '0'}</div>
                    <div class="stat-label">${attrs.lbl2 || 'Label'}</div>
                    <div class="stat-desc">${attrs.desc2 || ''}</div>
                `;
                grid.appendChild(c2);
            }
            if (attrs.num3 || attrs.lbl3) {
                const c3 = document.createElement('div');
                c3.className = 'stat-card';
                c3.innerHTML = `
                    <div class="stat-number">${attrs.num3 || '0'}</div>
                    <div class="stat-label">${attrs.lbl3 || 'Label'}</div>
                    <div class="stat-desc">${attrs.desc3 || ''}</div>
                `;
                grid.appendChild(c3);
            }
            return grid;
        }
        if (block.type === 'facts-grid') {
            const attrs = parseCommentAttributes(line);
            const grid = document.createElement('div');
            grid.className = 'quick-facts-grid';
            
            for (let k = 1; k <= 4; k++) {
                if (attrs[`t${k}`] || attrs[`d${k}`]) {
                    const card = document.createElement('div');
                    card.className = 'fact-card';
                    card.innerHTML = `
                        <div class="fact-title">📌 ${attrs[`t${k}`] || 'Fact Title'}</div>
                        <div class="fact-desc">${attrs[`d${k}`] || 'Fact detail description goes here.'}</div>
                    `;
                    grid.appendChild(card);
                }
            }
            return grid;
        }
        if (block.type === 'announcement') {
            const attrs = parseCommentAttributes(line);
            const box = document.createElement('div');
            box.className = 'announcement-alert-box';
            
            const title = document.createElement('div');
            title.className = 'announcement-title';
            title.innerHTML = `📢 <span>${attrs.title || 'विशेष सूचना'}</span>`;
            
            const content = document.createElement('div');
            content.className = 'announcement-content';
            content.textContent = attrs.content || 'महत्वपूर्ण सूचना यहाँ प्रदर्शित होगी।';
            
            box.appendChild(title);
            box.appendChild(content);
            return box;
        }

        // 1. SECTION BAR RENDER
        if (block.type === 'section') {
            let sectionTitle = line.replace(/^#+\s*/, '').replace(/^[?？\s]+/, '').trim();
            sectionTitle = sectionTitle.replace(/\[size=\d+\]/gi, '').trim();
            const sectionEl = document.createElement('h1');
            sectionEl.className = 'section-heading-bar';
            sectionEl.setAttribute('data-shape', state.customDesignSettings.sectionShape || 'rectangle');
            if (block.fontSize) {
                sectionEl.style.fontSize = `${block.fontSize}px`;
            }
            sectionEl.textContent = sectionTitle;
            return sectionEl;
        } 
        
        // 2. TOPIC HEADING RENDER
        else if (block.type === 'topic') {
            let topicTitle = line;
            if (topicTitle.startsWith('##')) {
                topicTitle = topicTitle.replace(/^##+\s*/, '');
            }
            topicTitle = topicTitle.replace(/\[size=\d+\]/gi, '').trim();
            
            let icon = '🔶'; // Default icon
            const emojiMatch = topicTitle.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji}|\S)\s*/u);
            if (emojiMatch) {
                const matchedIcon = emojiMatch[1];
                if (!/^[a-zA-Z0-9\u0900-\u097F]/.test(matchedIcon)) {
                    icon = matchedIcon;
                    topicTitle = topicTitle.substring(emojiMatch[0].length).trim();
                }
            }

            topicTitle = topicTitle.replace(/^[🔶🔷🔸🔹♦️💎]\s*/, '').trim();

            // Apply global topic icon style if it's the default orange diamond
            if (icon === '🔶') {
                const globalIconStyle = state.customDesignSettings.topicIcon || 'orange-diamond';
                if (globalIconStyle === 'blue-diamond') icon = '🔷';
                else if (globalIconStyle === 'star') icon = '⭐';
                else if (globalIconStyle === 'pushpin') icon = '📌';
                else if (globalIconStyle === 'rocket') icon = '🚀';
                else if (globalIconStyle === 'nib') icon = '✒️';
                else if (globalIconStyle === 'pencil') icon = '📝';
                // Premium Magazine Icons
                else if (globalIconStyle === 'crown') icon = '👑';
                else if (globalIconStyle === 'fleur-de-lis') icon = '⚜️';
                else if (globalIconStyle === 'sparkles') icon = '✨';
                else if (globalIconStyle === 'book') icon = '📖';
                else if (globalIconStyle === 'jewel') icon = '💎';
                else if (globalIconStyle === 'quill') icon = '🪶';
                else if (globalIconStyle === 'trophy') icon = '🏆';
                // Hand Icons
                else if (globalIconStyle === 'hand-right') icon = '👉';
                else if (globalIconStyle === 'hand-writing') icon = '✍️';
                else if (globalIconStyle === 'hand-thumb') icon = '👍';
                else if (globalIconStyle === 'hand-up') icon = '👆';
                else if (globalIconStyle === 'none') icon = '';
            }

            const topicContainer = document.createElement('div');
            topicContainer.className = 'topic-container';
            
            const titleEl = document.createElement('h3');
            titleEl.className = 'topic-title';
            if (block.fontSize) {
                titleEl.style.fontSize = `${block.fontSize}px`;
            }
            titleEl.innerHTML = `<span class="diamond">${icon}</span> ${topicTitle}`;

            const divider = document.createElement('div');
            divider.className = 'topic-divider';

            topicContainer.appendChild(titleEl);
            topicContainer.appendChild(divider);
            return topicContainer;
        } 
        
        // 3. BULLET ITEM RENDER
        else if (block.type === 'bullet') {
            // Fix Double Bullet Bug: strip any standard/custom bullet character
            let bulletText = line.replace(/^\s*[•\-\*\u2022\u25CF\u25AA\u25AB➜⭐★]\s*/, '').trim();
            const item = document.createElement('div');
            item.className = 'bullet-item';
            
            // Add nested list and indentation classes if applicable
            if (block.isNested) {
                item.classList.add('bullet-item-nested');
                if (block.indentLevel) {
                    item.classList.add(`bullet-indent-${block.indentLevel}`);
                }
            }

            // Check if list item already has numbering format to hide the bullet icon
            const hasNumbering = /^\s*(\([0-9a-zA-Z\u0966-\u096f]+\)|[0-9a-zA-Z\u0966-\u096f]+[\.\)])/.test(bulletText);
            if (hasNumbering) {
                item.classList.add('no-bullet-icon');
            }
            
            let formattedText = formatMarkdownText(bulletText);
            item.innerHTML = formattedText;
            return item;
        } 
        
        // 4. HIGHLIGHT BOX / QUOTE RENDER
        else if (block.type === 'box') {
            const highlightText = line.substring(2).trim();
            const box = document.createElement('div');
            box.className = 'highlight-box';
            box.textContent = highlightText;
            return box;
        } 

        // 4.5 IMAGE RENDER
        else if (block.type === 'image') {
            const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (match) {
                const altText = match[1];
                const src = match[2];
                
                const parts = altText.split('|');
                const captionText = parts[0] || 'Photo';
                const widthVal = parts[1] || '90%';
                const alignVal = parts[2] || 'center';

                const imgContainer = document.createElement('div');
                imgContainer.className = 'inserted-image-container';
                
                if (alignVal === 'left') {
                    imgContainer.style.alignItems = 'flex-start';
                } else if (alignVal === 'right') {
                    imgContainer.style.alignItems = 'flex-end';
                } else {
                    imgContainer.style.alignItems = 'center';
                }

                const img = document.createElement('img');
                img.className = 'inserted-image';
                img.alt = captionText;
                img.style.width = widthVal;
                
                if (state.uploadedImages && state.uploadedImages[src]) {
                    img.src = state.uploadedImages[src];
                } else {
                    img.src = src;
                }
                
                imgContainer.appendChild(img);

                if (captionText && captionText !== 'none') {
                    const caption = document.createElement('div');
                    caption.className = 'inserted-image-caption';
                    caption.textContent = captionText;
                    imgContainer.appendChild(caption);
                }
                return imgContainer;
            }
            // Fallback if regex failed
            const emptyDiv = document.createElement('div');
            return emptyDiv;
        }

        // 4.75 TABLE RENDER
        else if (block.type === 'table') {
            const table = document.createElement('table');
            table.className = 'markdown-table';
            if (block.isContinuation) {
                table.classList.add('table-continuation');
            }
            table.setAttribute('data-block-id', block.id);
            let columnWidths = null;

            // Apply configuration if present
            if (block.config) {
                if (block.configFormat === 'square' || (block.config.startsWith('[table') && block.config.endsWith(']'))) {
                    const configText = block.config.slice(6, -1).trim(); // remove "[table" and "]"
                    const regex = /(\w+)=([^\s]+)/g;
                    let match;
                    while ((match = regex.exec(configText)) !== null) {
                        const key = match[1].toLowerCase();
                        const val = match[2].replace(/['"]/g, '');
                        if (key === 'width') {
                            table.style.width = val;
                        } else if (key === 'align') {
                            if (val === 'center') {
                                table.style.marginLeft = 'auto';
                                table.style.marginRight = 'auto';
                            } else if (val === 'right') {
                                table.style.marginLeft = 'auto';
                                table.style.marginRight = '0';
                            } else {
                                table.style.marginLeft = '0';
                                table.style.marginRight = 'auto';
                            }
                        } else if (key === 'cols' || key === 'col-widths') {
                            columnWidths = val.split(',').map(w => w.trim());
                        }
                    }
                } else {
                    const parts = block.config.replace('<!--', '').replace('-->', '').split('|');
                    parts.forEach(part => {
                        const kv = part.trim().split('=');
                        if (kv.length === 2) {
                            const key = kv[0].trim().toLowerCase();
                            const val = kv[1].trim();
                            if (key === 'width') {
                                table.style.width = val;
                            } else if (key === 'align') {
                                if (val === 'center') {
                                    table.style.marginLeft = 'auto';
                                    table.style.marginRight = 'auto';
                                } else if (val === 'right') {
                                    table.style.marginLeft = 'auto';
                                    table.style.marginRight = '0';
                                } else {
                                    table.style.marginLeft = '0';
                                    table.style.marginRight = 'auto';
                                }
                            } else if (key === 'cols' || key === 'col-widths') {
                                columnWidths = val.split(',').map(w => w.trim());
                            }
                        }
                    });
                }
            }
            
            // Fallback to global setting if no specific table columns width config is provided
            if (!columnWidths && state.customDesignSettings && state.customDesignSettings.tableColWidths) {
                columnWidths = state.customDesignSettings.tableColWidths.split(',').map(w => w.trim());
            }

            if (columnWidths) {
                table.setAttribute('data-widths', columnWidths.join(', '));
                table.style.tableLayout = 'fixed';
            }
            
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            const lines = block.markdown.split('\n');
            
            let isFirstRow = true;
            let firstColIsNo = false;
            
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j].trim();
                if (!line) continue;
                
                // Skip separator row
                if (j === 1 && line.replace(/[^|:\-]/g, '').trim() === line) {
                    continue;
                }
                
                const cells = line.split('|')
                    .map(c => c.trim())
                    .slice(1, -1);
                
                if (isFirstRow && cells.length > 0) {
                    const firstHeader = (cells[0] || '').replace(/\*/g, '').replace(/\s+/g, '').replace(/\./g, '').toLowerCase().trim();
                    if (firstHeader === 'no' || firstHeader === 'sno' || firstHeader === 'sr' || firstHeader === 'srno' || firstHeader === '#') {
                        firstColIsNo = true;
                    }
                }
                
                const tr = document.createElement('tr');
                const isHeader = isFirstRow;
                
                let cellIdx = 0;
                cells.forEach(cellText => {
                    const cell = document.createElement(isHeader ? 'th' : 'td');
                    let formattedText = formatMarkdownText(cellText);
                    cell.innerHTML = formattedText;
                    
                    if (cellIdx === 0 && firstColIsNo) {
                        cell.classList.add('table-col-no');
                    }
                    
                    if (isHeader && columnWidths && columnWidths[cellIdx]) {
                        cell.style.width = columnWidths[cellIdx];
                    }
                    
                    if (isHeader) {
                        cell.style.position = 'relative';
                        // Add drag handle for resizing columns (except for the last one)
                        if (cellIdx < cells.length - 1) {
                            const handle = document.createElement('div');
                            handle.className = 'table-resize-handle';
                            
                            handle.addEventListener('mousedown', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const tableEl = cell.closest('table');
                                tableEl.style.tableLayout = 'fixed';
                                const pageEl = tableEl.closest('.a4-page');
                                if (!pageEl) return;
                                const pageNum = parseInt(pageEl.getAttribute('data-page'), 10);
                                if (isNaN(pageNum)) return;

                                // Switch to this page in the editor
                                const showCover = (state.pagesData[0] && state.pagesData[0].showCoverPage !== false);
                                parserCallbacks.switchActivePage(showCover ? pageNum - 1 : pageNum);
                                
                                const ths = Array.from(tableEl.querySelectorAll('thead th'));
                                const startWidths = ths.map(th => th.getBoundingClientRect().width);
                                const startX = e.clientX;
                                const cellIndex = ths.indexOf(cell);
                                
                                handle.classList.add('active');

                                const onMouseMove = (moveEvent) => {
                                    const dx = moveEvent.clientX - startX;
                                    const nextCellIndex = cellIndex + 1;
                                    
                                    const w1 = startWidths[cellIndex] + dx;
                                    const w2 = startWidths[nextCellIndex] - dx;
                                    
                                    if (w1 > 30 && w2 > 30) {
                                        ths[cellIndex].style.width = w1 + 'px';
                                        ths[nextCellIndex].style.width = w2 + 'px';
                                    }
                                };
                                
                                const onMouseUp = () => {
                                    document.removeEventListener('mousemove', onMouseMove);
                                    document.removeEventListener('mouseup', onMouseUp);
                                    
                                    handle.classList.remove('active');
                                    
                                    // Calculate new percentages
                                    const finalWidths = ths.map(th => th.getBoundingClientRect().width);
                                    const totalWidth = finalWidths.reduce((a, b) => a + b, 0);
                                    const percentageWidths = finalWidths.map(w => Math.round((w / totalWidth) * 100) + '%');
                                    
                                    // Update markdown using exact block ID and ths fallback
                                    const blockId = parseInt(tableEl.getAttribute('data-block-id'), 10);
                                    updateTableConfigInMarkdown(pageNum - 1, blockId, percentageWidths.join(', '), ths);
                                };
                                
                                document.addEventListener('mousemove', onMouseMove);
                                document.addEventListener('mouseup', onMouseUp);
                            });
                            
                            cell.appendChild(handle);
                        }
                    }
                    
                    tr.appendChild(cell);
                    cellIdx++;
                });
                
                if (isHeader) {
                    thead.appendChild(tr);
                } else {
                    tbody.appendChild(tr);
                }
                
                isFirstRow = false;
            }
            
            table.appendChild(thead);
            table.appendChild(tbody);
            return table;
        }
        
        // 4.9 EMPTY SPACER RENDER
        else if (block.type === 'empty') {
            const p = document.createElement('p');
            p.className = 'body-text empty-line';
            p.innerHTML = '&nbsp;';
            return p;
        }
        
        // 4.95 SPACER BLOCK RENDER (DYNAMIC GAP)
        else if (block.type === 'spacer') {
            const div = document.createElement('div');
            div.className = 'vertical-spacer';
            div.style.display = 'block';
            div.style.width = '100%';
            const count = block.count || 1;
            div.style.height = `calc(var(--content-font-size) * var(--content-line-height, 1.45) * ${count})`;
            return div;
        }
        
        
        // 4.96 END DIVIDER (***) RENDER
        else if (block.type === 'thankyou') {
            return createEndDividerElement();
        }
        
        // 4.97 COLUMN BREAK RENDER
        else if (block.type === 'columnbreak') {
            const div = document.createElement('div');
            div.className = 'column-break';
            return div;
        }
        
        // 5. REGULAR BODY PARAGRAPH RENDER
        else {
            const p = document.createElement('p');
            p.className = 'body-text';
            let formattedText = formatMarkdownText(line);
            p.innerHTML = formattedText;
            return p;
        }
    }

    function updateNodeContent(node, type, markdown) {
        let line = markdown.trim();
        if (type === 'bullet') {
            let bulletText = line.replace(/^\s*[•\-\*\u2022\u25CF\u25AA\u25AB➜⭐★]\s*/, '').trim();
            // Check if list item already has numbering format to hide the bullet icon
            const hasNumbering = /^\s*(\([0-9a-zA-Z\u0966-\u096f]+\)|[0-9a-zA-Z\u0966-\u096f]+[\.\)])/.test(bulletText);
            if (hasNumbering) {
                node.classList.add('no-bullet-icon');
            } else {
                node.classList.remove('no-bullet-icon');
            }
            let formattedText = formatMarkdownText(bulletText);
            node.innerHTML = formattedText;
        } else if (type === 'box') {
            let highlightText = line.replace(/^\s*>\s*/, '').trim();
            node.textContent = highlightText;
        } else if (type === 'table') {
            const tbody = document.createElement('tbody');
            const lines = markdown.split('\n');
            let isFirstRow = true;
            let firstColIsNo = false;
            
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j].trim();
                if (!line) continue;
                
                if (j === 1 && line.replace(/[^|:\-]/g, '').trim() === line) {
                    continue;
                }
                
                const cells = line.split('|')
                    .map(c => c.trim())
                    .slice(1, -1);
                
                if (isFirstRow && cells.length > 0) {
                    const firstHeader = (cells[0] || '').replace(/\*/g, '').replace(/\s+/g, '').replace(/\./g, '').toLowerCase().trim();
                    if (firstHeader === 'no' || firstHeader === 'sno' || firstHeader === 'sr' || firstHeader === 'srno' || firstHeader === '#') {
                        firstColIsNo = true;
                    }
                }
                
                const tr = document.createElement('tr');
                const isHeader = isFirstRow;
                isFirstRow = false;
                
                const dataWidths = node.getAttribute('data-widths');
                let columnWidths = null;
                if (dataWidths) {
                    columnWidths = dataWidths.split(',').map(w => w.trim());
                }

                let cellIdx = 0;
                cells.forEach(cellText => {
                    const cell = document.createElement(isHeader ? 'th' : 'td');
                    let formattedText = formatMarkdownText(cellText);
                    cell.innerHTML = formattedText;
                    
                    if (cellIdx === 0 && firstColIsNo) {
                        cell.classList.add('table-col-no');
                    }
                    
                    if (isHeader && columnWidths && columnWidths[cellIdx]) {
                        cell.style.width = columnWidths[cellIdx];
                    }
                    
                    tr.appendChild(cell);
                    cellIdx++;
                });
                
                tbody.appendChild(tr);
            }
            node.innerHTML = '';
            node.appendChild(tbody);
        } else if (type === 'bilingual-mcq') {
            const lines = markdown.split('\n');
            let contentLines = [];
            for (let idx = 0; idx < lines.length; idx++) {
                const trm = lines[idx].trim();
                if (trm.startsWith('[bilingual-mcq') || trm === '[/bilingual-mcq]') {
                    continue;
                }
                contentLines.push(lines[idx]);
            }
            const fullInner = contentLines.join('\n');
            let hiMarkdown = "";
            let enMarkdown = "";
            const hiIndex = fullInner.indexOf('{hi}');
            const enIndex = fullInner.indexOf('{en}');
            if (hiIndex !== -1 && enIndex !== -1) {
                if (hiIndex < enIndex) {
                    hiMarkdown = fullInner.substring(hiIndex + 4, enIndex).trim();
                    enMarkdown = fullInner.substring(enIndex + 4).trim();
                } else {
                    enMarkdown = fullInner.substring(enIndex + 4, hiIndex).trim();
                    hiMarkdown = fullInner.substring(hiIndex + 4).trim();
                }
            } else if (hiIndex !== -1) {
                hiMarkdown = fullInner.substring(hiIndex + 4).trim();
            } else if (enIndex !== -1) {
                enMarkdown = fullInner.substring(enIndex + 4).trim();
            } else {
                hiMarkdown = fullInner.trim();
            }
            
            node.innerHTML = '';
            const hiCol = document.createElement('div');
            hiCol.className = 'bilingual-mcq-col bilingual-mcq-hi';
            const hiBlocks = parseTextToBlocks(hiMarkdown);
            hiBlocks.forEach(b => {
                const n = renderBlockToNode(b);
                if (n) hiCol.appendChild(n);
            });
            
            const enCol = document.createElement('div');
            enCol.className = 'bilingual-mcq-col bilingual-mcq-en';
            const enBlocks = parseTextToBlocks(enMarkdown);
            enBlocks.forEach(b => {
                const n = renderBlockToNode(b);
                if (n) enCol.appendChild(n);
            });
            
            node.appendChild(hiCol);
            node.appendChild(enCol);
        } else if (type === 'explanation') {
            const explanationStartMatch = markdown.trim().match(/^\[explanation(?:\s+q=["']?(\d+)["']?)?\]$/i);
            const qNum = explanationStartMatch ? explanationStartMatch[1] : null;
            const lines = markdown.split('\n');
            let contentLines = [];
            for (let idx = 0; idx < lines.length; idx++) {
                const trm = lines[idx].trim();
                if (trm.startsWith('[explanation') || trm === '[/explanation]') {
                    continue;
                }
                contentLines.push(lines[idx]);
            }
            node.innerHTML = '';
            if (qNum) {
                const qNumEl = document.createElement('div');
                qNumEl.className = 'explanation-qnum';
                qNumEl.textContent = `${qNum}.`;
                node.appendChild(qNumEl);
            }
            const card = document.createElement('div');
            card.className = 'explanation-card';
            const header = document.createElement('div');
            header.className = 'explanation-header';
            header.textContent = 'Explanation';
            card.appendChild(header);
            
            const content = document.createElement('div');
            content.className = 'explanation-content';
            const innerBlocks = parseTextToBlocks(contentLines.join('\n'));
            innerBlocks.forEach(b => {
                const n = renderBlockToNode(b);
                if (n) content.appendChild(n);
            });
            card.appendChild(content);
            node.appendChild(card);
        } else if (type === 'empty') {
            node.innerHTML = '&nbsp;';
        } else if (type === 'spacer') {
            const spaceMatch = markdown.trim().match(/^\[?(space|spce)(?:\s+(\d+))?\]?$/i);
            const count = Math.min(50, (spaceMatch && spaceMatch[2]) ? parseInt(spaceMatch[2], 10) : 1);
            node.style.height = `calc(var(--content-font-size) * var(--content-line-height, 1.45) * ${count})`;
        } else if (type === 'thankyou') {
            if (node.querySelector('h1')) node.querySelector('h1').textContent = lastPageData.title;
            if (node.querySelector('h2')) node.querySelector('h2').textContent = lastPageData.subtitle;
            if (node.querySelector('p')) node.querySelector('p').textContent = lastPageData.tagline;
        } else {
            let formattedText = formatMarkdownText(line);
            node.innerHTML = formattedText;
        }
    }

    // Dynamic page watermark injector
    function injectWatermark(pageElement) {
        if (state.watermarkSettings.type === 'none') return;

        const wrapper = pageElement.querySelector('.inner-border-wrapper');
        if (!wrapper) return;

        const watermarkDiv = document.createElement('div');
        watermarkDiv.className = 'page-watermark';

        // Apply Position Styling (center, top-left, top-right, bottom-left, bottom-right)
        if (state.watermarkSettings.position === 'center') {
            watermarkDiv.style.alignItems = 'center';
            watermarkDiv.style.justifyContent = 'center';
        } else if (state.watermarkSettings.position === 'top-left') {
            watermarkDiv.style.alignItems = 'flex-start';
            watermarkDiv.style.justifyContent = 'flex-start';
            watermarkDiv.style.padding = '20px';
        } else if (state.watermarkSettings.position === 'top-right') {
            watermarkDiv.style.alignItems = 'flex-start';
            watermarkDiv.style.justifyContent = 'flex-end';
            watermarkDiv.style.padding = '20px';
        } else if (state.watermarkSettings.position === 'bottom-left') {
            watermarkDiv.style.alignItems = 'flex-end';
            watermarkDiv.style.justifyContent = 'flex-start';
            watermarkDiv.style.padding = '20px';
        } else if (state.watermarkSettings.position === 'bottom-right') {
            watermarkDiv.style.alignItems = 'flex-end';
            watermarkDiv.style.justifyContent = 'flex-end';
            watermarkDiv.style.padding = '20px';
        }

        // Apply Rotation and Opacity
        const transformStr = `rotate(${state.watermarkSettings.rotation}deg)`;
        
        if (state.watermarkSettings.type === 'text') {
            const textSpan = document.createElement('span');
            textSpan.className = 'watermark-text-el';
            textSpan.textContent = state.watermarkSettings.text;
            textSpan.style.fontSize = `${state.watermarkSettings.size}px`;
            textSpan.style.color = state.watermarkSettings.color;
            textSpan.style.opacity = state.watermarkSettings.opacity;
            textSpan.style.transform = transformStr;
            textSpan.style.display = 'inline-block';
            watermarkDiv.appendChild(textSpan);
        } else if (state.watermarkSettings.type === 'image' && state.watermarkSettings.imageSrc) {
            const img = document.createElement('img');
            img.src = state.watermarkSettings.imageSrc;
            img.style.width = `${state.watermarkSettings.size}%`;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.opacity = state.watermarkSettings.opacity;
            img.style.transform = transformStr;
            img.style.display = 'inline-block';
            watermarkDiv.appendChild(img);
        }

        // Insert watermark at the beginning of the wrapper so it stands behind other elements
        wrapper.insertBefore(watermarkDiv, wrapper.firstChild);
    }

    // Dynamic page numbering and header styling helper
    function applyPaginationStyling(pageNumText, pageNum) {
        pageNumText.textContent = pageNum;
        pageNumText.style.fontSize = 'var(--custom-header-font-size, 15px)';
        pageNumText.style.color = state.customDesignSettings.pageNumColor || '#000000';
    }

    // High-performance memoization cache to keep height estimations lightning fast
    const heightEstimationCache = new Map();

    // Helper to estimate height of a parsed block of content to reduce layout thrashing
    export function estimateBlockHeight(block, fontSize, lineSpacing, isTwoCol = false) {
        const cacheKey = `${block.type}_${fontSize}_${lineSpacing}_${isTwoCol}_${block.markdown}`;
        if (heightEstimationCache.has(cacheKey)) {
            return heightEstimationCache.get(cacheKey);
        }

        const result = calculateBlockHeightRaw(block, fontSize, lineSpacing, isTwoCol);
        heightEstimationCache.set(cacheKey, result);
        return result;
    }

    function calculateBlockHeightRaw(block, fontSize, lineSpacing, isTwoCol = false) {
        const lineHeight = fontSize * lineSpacing;
        const text = block.markdown || '';
        const trimmed = text.trim();
        if (!trimmed) return lineHeight;

        switch (block.type) {
            case 'box-container':
                {
                    const innerBlocks = parseTextToBlocks(block.markdown);
                    let innerHeight = 0;
                    innerBlocks.forEach(inner => {
                        innerHeight += estimateBlockHeight(inner, fontSize, lineSpacing, isTwoCol);
                    });
                    return innerHeight + 24; // Inner blocks height + 24px box padding
                }
            case 'bilingual-mcq':
                {
                    const hiHeight = calculateBlockHeightRaw({ type: 'paragraph', markdown: block.hiMarkdown }, fontSize, lineSpacing, true);
                    const enHeight = calculateBlockHeightRaw({ type: 'paragraph', markdown: block.enMarkdown }, fontSize, lineSpacing, true);
                    return Math.max(hiHeight, enHeight) + 16;
                }
            case 'explanation':
                {
                    const innerBlocks = parseTextToBlocks(block.markdown);
                    let innerHeight = 0;
                    innerBlocks.forEach(inner => {
                        innerHeight += estimateBlockHeight(inner, fontSize, lineSpacing, isTwoCol);
                    });
                    const expStyle = state.customDesignSettings.explanationStyle || 'modern-accent';
                    let extraHeight = 16; // base padding/margins
                    if (expStyle === 'classic-header') {
                        extraHeight += (block.qNum ? 20 : 0) + 28;
                    } else if (expStyle === 'modern-accent' || expStyle === 'glass-floating') {
                        extraHeight += (block.qNum ? 20 : 0);
                    } else if (expStyle === 'editorial-ribbon') {
                        extraHeight += 25; // padding for ribbon
                    } else if (expStyle === 'two-tone-split') {
                        extraHeight += 0; // split column places question number to the side
                    }
                    return innerHeight + extraHeight;
                }
            case 'section':
                return 55 * ((block.fontSize || 18) / 18); // 18px font size + padding/margin
            case 'chapter-header':
                return 85 * ((block.fontSize || 22) / 22); // adjusted for custom font size if specified
            case 'topic':
                return 45 * ((block.fontSize || 15) / 15); // 15px font size + padding/margin
            case 'empty':
                return lineHeight;
            case 'spacer':
                {
                    const spaceMatch = trimmed.match(/^\[?(space|spce)(?:\s+(\d+))?\]?$/i);
                    const count = Math.min(50, (spaceMatch && spaceMatch[2]) ? parseInt(spaceMatch[2], 10) : 1);
                    return lineHeight * count;
                }
            case 'thankyou':
                return 60;
            case 'columnbreak':
                return 0;
            case 'image':
                return 220; // conservative estimate for image height
            case 'table':
                {
                    const linesOfTable = text.split('\n').filter(l => l.trim());
                    let totalTableHeight = 20; // base padding/margin
                    
                    const tblFontSize = parseFloat(state.customDesignSettings.tableBodyFontSize) || (isTwoCol ? (fontSize - 1.5) : (fontSize - 1));
                    const tblLineSpacing = isTwoCol ? 1.25 : lineSpacing;
                    const tblLineHeight = tblFontSize * tblLineSpacing;
                    const tblCellPadding = isTwoCol ? 8 : 12;

                    linesOfTable.forEach((line, idx) => {
                        if (idx === 1 && line.replace(/[^|:\-]/g, '').trim() === line) {
                            return; // skip separator row
                        }
                        
                        const cells = line.split('|').map(c => c.trim()).slice(1, -1);
                        let maxCellLines = 1;
                        
                        cells.forEach(cellText => {
                            // In 2-Column layouts, cells are very narrow
                            const cellWidth = isTwoCol ? 110 : 220;
                            const charsPerLine = Math.max(10, Math.floor(cellWidth / (0.55 * tblFontSize)));
                            const cellLines = Math.ceil(cellText.length / charsPerLine) || 1;
                            if (cellLines > maxCellLines) {
                                maxCellLines = cellLines;
                            }
                        });
                        
                        totalTableHeight += (maxCellLines * tblLineHeight) + tblCellPadding; // cell height + padding
                    });
                    
                    return totalTableHeight;
                }
            case 'box':
                {
                    const baseWidth = isTwoCol ? 270 : 600;
                    const charsPerLine = Math.max(20, Math.floor(baseWidth / (0.6 * fontSize)));
                    const lines = Math.ceil(trimmed.length / charsPerLine) || 1;
                    return (lines * lineHeight) + 30; // box has border/padding
                }
            case 'bullet':
            case 'paragraph':
            default:
                {
                    const baseWidth = isTwoCol ? 290 : 640;
                    const charsPerLine = Math.max(20, Math.floor(baseWidth / (0.55 * fontSize)));
                    const lines = Math.ceil(trimmed.length / charsPerLine) || 1;
                    return (lines * lineHeight) + 8; // small margin/gap
                }
        }
    }

    // Helper to detect overflow in single and two-column layouts
    function checkPageOverflow(contentEl, isTwoCol, maxHeight, ignoreHorizontal = false) {
        const contentRect = contentEl.getBoundingClientRect();
        // Fallback if the element is not in DOM or hidden (rect is 0)
        if (contentRect.width === 0 || contentRect.height === 0) {
            // Use estimated height check as fallback
            if (!isTwoCol) {
                const children = contentEl.children;
                if (children.length > 0) {
                    const lastChild = children[children.length - 1];
                    const contentHeight = lastChild.offsetTop + lastChild.offsetHeight;
                    return contentHeight > maxHeight;
                }
            }
            return false;
        }

        const descendants = Array.from(contentEl.querySelectorAll('*'));
        const directChildren = Array.from(contentEl.children);
        const allElements = [...directChildren, ...descendants];

        // Use the safety boundary top + maxHeight for vertical overflow check
        const maxAllowedBottom = contentRect.top + maxHeight;

        if (isTwoCol) {
            // In 2-column mode, check if any element overflows the content area's right or bottom safety boundaries
            return allElements.some(child => {
                const childRect = child.getBoundingClientRect();
                const style = window.getComputedStyle(child);
                const isColumnSpanAll = style.columnSpan === 'all' || 
                                        style.webkitColumnSpan === 'all' || 
                                        child.classList.contains('chapter-header') || 
                                        child.closest('.chapter-header') !== null;
                
                let horizontalOverflow = false;
                if (!isColumnSpanAll && !ignoreHorizontal) {
                    horizontalOverflow = childRect.right > (contentRect.right + 30);
                }
                
                // Check vertical overflow if the element is in Column 2 or has column-span: all
                let verticalOverflow = false;
                
                // Only check vertical overflow if the element's left edge is in Column 2
                const isInColumn2 = childRect.left > (contentRect.left + (contentRect.width / 2));
                
                if (isInColumn2 || isColumnSpanAll) {
                    verticalOverflow = childRect.bottom > (maxAllowedBottom + 3);
                }
                return horizontalOverflow || verticalOverflow;
            });
        } else {
            // In single column mode, check if any element overflows the content area's bottom boundary safety threshold
            return allElements.some(child => {
                const childRect = child.getBoundingClientRect();
                return childRect.bottom > (maxAllowedBottom + 3);
            });
        }
    }


    // Render right-side actual A4 pages sequentially
    export function renderPreview(forceStrictSplit = false) {
        // Save current scroll positions of the preview canvas scroll wrapper to prevent jumping
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        const savedScrollTop = canvasWrapper ? canvasWrapper.scrollTop : 0;
        const savedScrollLeft = canvasWrapper ? canvasWrapper.scrollLeft : 0;

        // Cancel any pending debounced render since we are executing a render now
        if (typeof renderTimeout !== 'undefined' && renderTimeout !== null) {
            clearTimeout(renderTimeout);
        }
        // Measure dynamic available height of page content container
        if (state.cachedMaxContentHeight === null || state.cachedMaxContentHeight < 500) {
            const tempPageStruct = createContentPageDOM(999, 999);
            tempPageStruct.pageElement.style.position = 'absolute';
            tempPageStruct.pageElement.style.visibility = 'hidden';
            tempPageStruct.pageElement.style.top = '-9999px';
            document.body.appendChild(tempPageStruct.pageElement);
            const measuredHeight = tempPageStruct.contentElement.clientHeight;
            document.body.removeChild(tempPageStruct.pageElement);
            // Sanity check: only cache if height is realistic (e.g., above 500px)
            // to prevent caching buggy heights measured before styles.css fully loads
            if (measuredHeight > 500) {
                state.cachedMaxContentHeight = measuredHeight;
            }
        }
        // Apply a tight 20px safety buffer (breathing room) in preview to fill columns completely and eliminate blank spaces
        state.MAX_CONTENT_HEIGHT = (state.cachedMaxContentHeight ? (state.cachedMaxContentHeight - 20) : 875);

        // Clear canvas
        dom.pagesContainer.innerHTML = '';

        // 1. Render Cover Page (Page 1)
        const showCover = (state.pagesData[0] && state.pagesData[0].showCoverPage !== false);
        if (state.activePageIndex === 0 && !showCover) {
            state.activePageIndex = 1;
        }
        if (state.activePageIndex >= state.pagesData.length) {
            state.activePageIndex = state.pagesData.length - 1;
        }

        if (showCover) {
            const coverPageElement = createCoverPageDOM();
            // Prevent watermark on cover page as per user request
            dom.pagesContainer.appendChild(coverPageElement);
        }

        // 1.5 Track cursor position in content pages
        const isEditorActive = (state.activePageIndex > 0 && state.activePageIndex < state.pagesData.length) && 
                               (document.activeElement === dom.pageContentInput || window.forceFocusEditor);
        let cursorStart = 0;
        let cursorEnd = 0;
        let globalCursorPos = 0;

        if (state.activePageIndex > 0 && state.activePageIndex < state.pagesData.length) {
            if (isEditorActive) {
                cursorStart = dom.pageContentInput.selectionStart;
                cursorEnd = dom.pageContentInput.selectionEnd;
            }
            // Calculate global cursor position in unified content text
            let accumulatedLength = 0;
            for (let idx = 1; idx < state.pagesData.length; idx++) {
                if (idx === state.activePageIndex) {
                    globalCursorPos = accumulatedLength + cursorStart;
                    break;
                }
                accumulatedLength += state.pagesData[idx].text.length + 1; // +1 for newline separator
            }
        }

        // 2. Distribute blocks across Content Pages dynamically
        const fullContentMarkdown = state.pagesData.slice(1).map(p => p.text).join('\n');
        const blocks = parseTextToBlocks(fullContentMarkdown);
        state.currentRenderedBlocks = blocks; // Save globally for scroll sync
        

        // Assign original unique IDs to blocks for drag-and-drop tracking (all blocks, including thankyou!)
        blocks.forEach((block, idx) => {
            block.id = idx;
        });

        let currentVisualPageNum = 1;
        let currentPageStruct = createContentPageDOM(showCover ? 2 : 1, 1);
        injectWatermark(currentPageStruct.pageElement);
        dom.pagesContainer.appendChild(currentPageStruct.pageElement);

        let activeBulletListElement = null;
        let pageContentMarkdownArray = [];
        let currentPageMarkdownLines = [];
        let sectionInfoList = [];

        // Track estimated height of content on the current page to reduce DOM layout reads
        let currentPageHeight = 0;
        const checkThreshold = state.MAX_CONTENT_HEIGHT - 35; // Dynamically check scrollHeight only near the very limit (1-2 lines away) to prevent massive layout thrashing

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (block.type === 'pagebreak') {
                currentPageMarkdownLines.push(getBlockMarkdown(block));
                pageContentMarkdownArray.push(currentPageMarkdownLines.join('\n'));
                currentPageMarkdownLines = [];
                
                currentVisualPageNum++;
                currentPageStruct = createContentPageDOM(currentVisualPageNum + (showCover ? 1 : 0), currentVisualPageNum);
                injectWatermark(currentPageStruct.pageElement);
                dom.pagesContainer.appendChild(currentPageStruct.pageElement);
                activeBulletListElement = null;
                currentPageHeight = 0; // Reset height estimate for new page
                continue;
            }

            const node = renderBlockToNode(block);
            if (node && typeof node.setAttribute === 'function') {
                node.setAttribute('data-block-id', block.id);
                node.setAttribute('draggable', 'true');
            }

            if (block.type === 'bullet') {
                if (!activeBulletListElement) {
                    activeBulletListElement = document.createElement('div');
                    activeBulletListElement.className = 'bullet-list';
                    activeBulletListElement.setAttribute('data-bullet-style', state.customDesignSettings.bulletStyle || 'classic');
                    currentPageStruct.contentElement.appendChild(activeBulletListElement);
                }
                activeBulletListElement.appendChild(node);
            } else {
                currentPageStruct.contentElement.appendChild(node);
                activeBulletListElement = null;
            }

            if (block.type === 'section') {
                sectionInfoList.push({
                    name: node.textContent,
                    startPage: currentVisualPageNum
                });
            }

            // Check if page layout is two column
            const isTwoCol = currentPageStruct.contentElement.classList.contains('layout-two-column');

            // Estimate the height of the current block
            const estHeight = estimateBlockHeight(block, state.contentFontSize, parseFloat(globalLineSpacingSelect.value || 1.45), isTwoCol);
            currentPageHeight += estHeight;

            // Check if page overflows
            const contentEl = currentPageStruct.contentElement;
            let isOverflow = checkPageOverflow(contentEl, isTwoCol, state.MAX_CONTENT_HEIGHT);
            if (!isTwoCol) {
                const children = contentEl.children;
                let contentHeight = 0;
                if (children.length > 0) {
                    const lastChild = children[children.length - 1];
                    contentHeight = lastChild.offsetTop + lastChild.offsetHeight;
                }
                currentPageHeight = contentHeight;
            }

            if (isOverflow) {
                // We have an overflow. Let's see if we can split this block.
                let canSplit = (block.type === 'paragraph' || block.type === 'bullet' || block.type === 'box' || block.type === 'table');
                let splitSuccess = false;

                if (canSplit) {
                    // Extract prefix for formatting preservation
                    let prefix = "";
                    if (block.type === 'bullet') {
                        const match = block.markdown.match(/^\s*(•|●|■|▪|▫|[\u2022\u25CF\u25AA\u25AB]|\-|\*|\(\d+\)|\d+\.)\s*/);
                        if (match) prefix = match[0];
                    } else if (block.type === 'box') {
                        const match = block.markdown.match(/^\s*>\s*/);
                        if (match) prefix = match[0];
                    }

                    // Split markdown: by lines for tables, by words for others
                    let words = [];
                    if (block.type === 'table') {
                        words = block.markdown.split('\n');
                    } else {
                        words = block.markdown.split(/(\s+)/);
                    }

                    // Helper to temporarily update node text/rows and check if it fits
                    const testFit = (wordCount) => {
                        let separator = (block.type === 'table') ? '\n' : '';
                        let testMarkdown = words.slice(0, wordCount).join(separator);
                        updateNodeContent(node, block.type, testMarkdown);
                        return !checkPageOverflow(currentPageStruct.contentElement, isTwoCol, state.MAX_CONTENT_HEIGHT, true);
                    };

                    let low = 1;
                    if (block.type === 'table') {
                        low = 2; // Table needs at least header (0) and separator (1) to split
                    }
                    let high = words.length;
                    let splitIndex = 0;

                    // Only search if the minimum fit fits
                    if (testFit(low)) {
                        while (low <= high) {
                            let mid = Math.floor((low + high) / 2);
                            if (testFit(mid)) {
                                splitIndex = mid;
                                low = mid + 1;
                            } else {
                                high = mid - 1;
                            }
                        }
                    }

                    if (splitIndex > 0 && splitIndex < words.length) {
                        // Check if splitting here breaks highlights (==) or bold (**) formatting tags
                        if (block.type !== 'table') {
                            const checkUnbalanced = (arr) => {
                                const text = arr.join('');
                                const equalCount = (text.match(/==/g) || []).length;
                                const starCount = (text.match(/\*\*/g) || []).length;
                                return (equalCount % 2 !== 0) || (starCount % 2 !== 0);
                            };
                            if (checkUnbalanced(words.slice(0, splitIndex))) {
                                let tempIndex = splitIndex;
                                while (tempIndex > 0 && checkUnbalanced(words.slice(0, tempIndex))) {
                                    tempIndex--;
                                }
                                if (tempIndex > 0) {
                                    splitIndex = tempIndex;
                                } else {
                                    // Fallback to not splitting this block at all, moving it to next page
                                    splitIndex = 0;
                                }
                            }
                        }

                        // We found a valid split point!
                        let fitSeparator = (block.type === 'table') ? '\n' : '';
                        let fitMarkdown = words.slice(0, splitIndex).join(fitSeparator);
                        let remainingMarkdown = words.slice(splitIndex).join(fitSeparator);

                        let canSplitTable = (block.type === 'table' && splitIndex >= 2);
                        let canSplitText = false;
                        
                        if (block.type !== 'table') {
                            // Count actual words in fit content to avoid tiny hanging splits
                            let fitWordsCount = words.slice(0, splitIndex).filter(w => w.trim().length > 0).length;
                            if (block.type === 'bullet') {
                                fitWordsCount = words.slice(0, splitIndex).filter(w => w.trim().length > 0 && !/^[•\-\*\u2022\u25CF\u25AA\u25AB]/.test(w)).length;
                            }
                            canSplitText = (fitWordsCount >= 2);
                        }

                        // We split if requirements are met
                        if ((canSplitTable || canSplitText) && remainingMarkdown.trim().length > 0) {
                            // Update current node with the fit content
                            updateNodeContent(node, block.type, fitMarkdown);
                            block.markdown = fitMarkdown;

                            // Prepend prefix to remaining markdown if needed
                            if (block.type === 'table') {
                                // For tables, prepend header (0) and separator (1) rows to the remaining table
                                let headerRow = words[0];
                                let separatorRow = words[1];
                                const isSeparator = (str) => str && /^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(str);
                                if (!isSeparator(separatorRow)) {
                                    // If the table lacks a proper markdown separator row, generate a valid one dynamically
                                    const colCount = Math.max(1, headerRow.split('|').length - 2);
                                    separatorRow = '|' + '---|'.repeat(colCount);
                                }
                                remainingMarkdown = headerRow + '\n' + separatorRow + '\n' + remainingMarkdown;
                            } else if (prefix) {
                                // If remaining markdown doesn't start with prefix, add it
                                if (!remainingMarkdown.trim().startsWith(prefix.trim())) {
                                    remainingMarkdown = prefix + remainingMarkdown.trimStart();
                                }
                            }

                            // Save current page
                            currentPageMarkdownLines.push(getBlockMarkdown(block));
                            pageContentMarkdownArray.push(currentPageMarkdownLines.join('\n'));
                            currentPageMarkdownLines = [];

                            // Start new page
                            currentVisualPageNum++;
                            currentPageStruct = createContentPageDOM(currentVisualPageNum + (showCover ? 1 : 0), currentVisualPageNum);
                            injectWatermark(currentPageStruct.pageElement);
                            dom.pagesContainer.appendChild(currentPageStruct.pageElement);
                            activeBulletListElement = null;
                            currentPageHeight = 0; // Reset height estimate for new page

                            // Insert remaining block into blocks array to be processed next
                            blocks.splice(i + 1, 0, {
                                type: block.type,
                                markdown: remainingMarkdown,
                                id: block.id,
                                config: block.config,
                                configFormat: block.configFormat,
                                isContinuation: true
                            });

                            splitSuccess = true;
                        }
                    }
                }

                if (!splitSuccess) {
                    // Restore the node's original full content since the split failed or was too small
                    if (canSplit) {
                        updateNodeContent(node, block.type, block.markdown);
                    }

                    // Fall back to moving the entire block to the next page.
                    let isOnlyItem = false;
                    if (block.type === 'bullet') {
                        isOnlyItem = (currentPageStruct.contentElement.children.length === 1 && activeBulletListElement.children.length === 1);
                    } else {
                        isOnlyItem = (currentPageStruct.contentElement.children.length === 1);
                    }

                    if (!isOnlyItem) {
                        // Move it to next page
                        if (block.type === 'bullet') {
                            if (activeBulletListElement) {
                                activeBulletListElement.removeChild(node);
                                if (activeBulletListElement.children.length === 0) {
                                    currentPageStruct.contentElement.removeChild(activeBulletListElement);
                                }
                            }
                        } else {
                            currentPageStruct.contentElement.removeChild(node);
                        }

                        // Save current page markdown
                        pageContentMarkdownArray.push(currentPageMarkdownLines.join('\n'));
                        currentPageMarkdownLines = [];

                        // Start new page
                        currentVisualPageNum++;
                        currentPageStruct = createContentPageDOM(currentVisualPageNum + (showCover ? 1 : 0), currentVisualPageNum);
                        injectWatermark(currentPageStruct.pageElement);
                        dom.pagesContainer.appendChild(currentPageStruct.pageElement);
                        activeBulletListElement = null;

                        // Append node to the new page
                        if (block.type === 'bullet') {
                            activeBulletListElement = document.createElement('div');
                            activeBulletListElement.className = 'bullet-list';
                            activeBulletListElement.setAttribute('data-bullet-style', state.customDesignSettings.bulletStyle || 'classic');
                            currentPageStruct.contentElement.appendChild(activeBulletListElement);
                            activeBulletListElement.appendChild(node);
                        } else {
                            currentPageStruct.contentElement.appendChild(node);
                        }

                        // Sync estimate height for new page and add the moved block's height estimate
                        currentPageHeight = estHeight;

                        // If section, correct its start page
                        if (block.type === 'section') {
                            const lastSec = sectionInfoList[sectionInfoList.length - 1];
                            if (lastSec) lastSec.startPage = currentVisualPageNum;
                        }
                    }
                }
            }

            // Only push to currentPageMarkdownLines if we didn't already push and clear it in splitSuccess
            if (currentPageStruct.contentElement.contains(node) || (activeBulletListElement && activeBulletListElement.contains(node))) {
                currentPageMarkdownLines.push(getBlockMarkdown(block));
            }
        }

        // Save last content page
        pageContentMarkdownArray.push(currentPageMarkdownLines.join('\n'));

        // Update state.pagesData array with paginated content
        const coverPage = state.pagesData[0];
        const newContentPages = pageContentMarkdownArray.map((txt, index) => {
            const oldPage = state.pagesData[index + 1];
            let oldLayout = 'two-column';
            if (oldPage) {
                oldLayout = oldPage.layout || 'two-column';
            } else {
                // If it is a dynamically generated new page, inherit the layout from the closest preceding page
                for (let k = index; k >= 1; k--) {
                    if (state.pagesData[k] && state.pagesData[k].layout) {
                        oldLayout = state.pagesData[k].layout;
                        break;
                    }
                }
            }
            return {
                type: 'content',
                text: txt,
                layout: oldLayout
            };
        });
        state.pagesData = [coverPage, ...newContentPages];

        // Recalculate state.activePageIndex and relative cursor position in the new state.pagesData!
        // Only recalculate state.activePageIndex if currently editing a content page (not Cover or End Page)
        if (state.activePageIndex > 0 && state.activePageIndex < state.pagesData.length && state.pagesData.length > 1) {
            let accumulatedLength = 0;
            let found = false;
            for (let idx = 1; idx < state.pagesData.length; idx++) {
                const pageLen = state.pagesData[idx].text.length;
                if (globalCursorPos >= accumulatedLength && globalCursorPos <= accumulatedLength + pageLen + 1) {
                    state.activePageIndex = idx;
                    cursorStart = Math.max(0, Math.min(globalCursorPos - accumulatedLength, pageLen));
                    cursorEnd = cursorStart;
                    found = true;
                    break;
                }
                accumulatedLength += pageLen + 1;
            }
            if (!found) {
                state.activePageIndex = Math.max(1, Math.min(state.activePageIndex, state.pagesData.length - 1));
                cursorStart = state.pagesData[state.activePageIndex] ? state.pagesData[state.activePageIndex].text.length : 0;
                cursorEnd = cursorStart;
            }
        }

        // 3. Render final Thank You page (Removed: now rendered inline in last content page)

        // 4. Generate dynamic Table of Contents inside Cover Page
        populateCoverPageTOC(sectionInfoList);

        // 5. Restore spotlight outline around active edited page
        let pageSelectorIndex = state.activePageIndex === 0 ? 1 : state.activePageIndex + (showCover ? 1 : 0);
        const activeA4Page = document.querySelector(`.a4-page[data-page="${pageSelectorIndex}"]`);
        if (activeA4Page) {
            document.querySelectorAll('.a4-page').forEach(page => {
                page.classList.remove('active-page-spotlight');
            });
            activeA4Page.classList.add('active-page-spotlight');
        }

        // 5.5 Detect and mark overflow states on pages in real-time
        const renderedPages = dom.pagesContainer.querySelectorAll('.a4-page:not(.cover-page)');
        renderedPages.forEach(page => {
            const pageNum = page.getAttribute('data-page');
            const contentEl = page.querySelector('.page-content');
            if (!contentEl) return;
            
            const isTwoCol = contentEl.classList.contains('layout-two-column');
            let isOverflow = checkPageOverflow(contentEl, isTwoCol, state.MAX_CONTENT_HEIGHT);
            
            // Remove old badge if any
            const oldBadge = page.querySelector('.overflow-badge');
            if (oldBadge) oldBadge.remove();
            
            if (isOverflow) {
                page.classList.add('overflow-detected');
                
                // Create a beautiful, blinking overflow warning badge inside the page container
                const badge = document.createElement('div');
                badge.className = 'overflow-badge';
                badge.innerHTML = `⚠️ ओवरफ़्लो (Overflow)`;
                page.appendChild(badge);
            } else {
                page.classList.remove('overflow-detected');
            }
        });

        // 6. Sync warning states on left page-tabs sidebar
        renderTabsList();

        // Restore scroll positions of the preview canvas scroll wrapper to prevent jumping
        if (canvasWrapper) {
            canvasWrapper.scrollTop = savedScrollTop;
            canvasWrapper.scrollLeft = savedScrollLeft;
        }

        // 7. Sync the textarea value only if changed, and restore cursor if editor was active
        if (state.activePageIndex > 0 && state.activePageIndex < state.pagesData.length) {
            if (dom.pageContentInput.value !== state.pagesData[state.activePageIndex].text) {
                dom.pageContentInput.value = state.pagesData[state.activePageIndex].text;
            }
            if (isEditorActive) {
                dom.pageContentInput.focus();
                dom.pageContentInput.setSelectionRange(cursorStart, cursorEnd);
                // Force trigger scroll sync immediately to highlight the active block in the preview panel without jumping
                syncPreviewScroll(false);
            }
            dom.activePageLabel.textContent = state.activePageIndex;
        }
        updateIndividualTablesListUI();
    }

    // Helper to append gold ornate corners to a page
    function appendCornerDecorators(pageElement) {
        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        corners.forEach(cornerClass => {
            const decor = document.createElement('div');
            decor.className = `corner-decor ${cornerClass}`;
            pageElement.appendChild(decor);
        });
    }

    // Cover Page DOM builder
    function createCoverPageDOM() {
        const coverData = state.pagesData[0];

        const page = document.createElement('div');
        page.className = 'a4-page cover-page';
        if (coverData.coverTheme && coverData.coverTheme !== 'default') {
            page.classList.add(`cover-theme-${coverData.coverTheme}`);
        }
        page.setAttribute('data-page', 1);

        // Append corner decorators
        appendCornerDecorators(page);

        const innerBorder = document.createElement('div');
        innerBorder.className = 'inner-border-wrapper';
        innerBorder.classList.add(`cover-border-${coverData.coverBorderPattern || 'solid'}`);

        const coverContent = document.createElement('div');
        coverContent.className = 'cover-page-content';
        const hasTagline = coverData.tagline && coverData.tagline.trim() !== '';
        if (!hasTagline) {
            coverContent.classList.add('tagline-empty');
        }

        // Emblem (Feature 2)
        let emblemEl = null;
        if (coverData.coverEmblem && coverData.coverEmblem !== 'none') {
            emblemEl = document.createElement('div');
            emblemEl.className = `cover-emblem cover-emblem-${coverData.coverEmblem}`;
            if (coverData.coverEmblem === 'royal-seal') {
                emblemEl.innerHTML = '<div class="seal-inner"><span class="seal-icon">⚜️</span><span class="seal-text">सम्यक विशेष</span></div>';
            } else if (coverData.coverEmblem === 'verified-badge') {
                emblemEl.innerHTML = '<div class="badge-inner"><span class="badge-icon">✓</span><span class="badge-text">प्रमाणित नोट्स</span></div>';
            } else if (coverData.coverEmblem === 'exclusive-star') {
                emblemEl.innerHTML = '<div class="star-inner"><span class="star-icon">★</span><span class="star-text">EXCLUSIVE</span></div>';
            } else if (coverData.coverEmblem === 'vintage-emblem') {
                emblemEl.innerHTML = '<div class="vintage-inner"><span class="vintage-icon">🖨️</span><span class="vintage-text">ESTD 2026</span></div>';
            }
        }

        // Magazine Classification
        const classificationEl = document.createElement('div');
        classificationEl.className = 'cover-classification';
        classificationEl.textContent = coverData.classification || '';
        classificationEl.style.setProperty('font-size', (coverData.classificationSize || 24) + 'px', 'important');
        if (!coverData.classification) {
            classificationEl.style.minHeight = '30px';
        }

        // Title
        const titleEl = document.createElement('h1');
        titleEl.className = 'cover-title';
        titleEl.textContent = coverData.title;
        titleEl.style.setProperty('font-size', (coverData.titleSize || 52) + 'px', 'important');

        // Tagline Box
        const taglineBox = document.createElement('div');
        taglineBox.className = 'cover-tagline-box';
        const taglineH3 = document.createElement('h3');
        taglineH3.textContent = coverData.tagline;
        taglineH3.style.setProperty('font-size', (coverData.taglineSize || 20) + 'px', 'important');
        taglineBox.appendChild(taglineH3);
        if (!hasTagline) {
            taglineBox.style.display = 'none';
        }

        // Subtitle
        const subtitleEl = document.createElement('h2');
        subtitleEl.className = 'cover-subtitle';
        subtitleEl.textContent = coverData.subtitle;
        subtitleEl.style.setProperty('font-size', (coverData.subtitleSize || 21) + 'px', 'important');

        // Table of Contents Placeholder
        const tocPlaceholder = document.createElement('div');
        tocPlaceholder.id = 'toc-placeholder';
        tocPlaceholder.className = 'toc-container';
        if (coverData.showTOC === false) {
            tocPlaceholder.style.display = 'none';
        }

        if (emblemEl) {
            coverContent.appendChild(emblemEl);
        }
        coverContent.appendChild(classificationEl);
        coverContent.appendChild(titleEl);
        coverContent.appendChild(taglineBox);
        coverContent.appendChild(subtitleEl);
        coverContent.appendChild(tocPlaceholder);

        innerBorder.appendChild(coverContent);
        page.appendChild(innerBorder);

        return page;
    }

    function getTelegramLink(input) {
        if (!input) return '#';
        const trimmed = input.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }
        const handle = trimmed.startsWith('@') ? trimmed.substring(1) : trimmed;
        return `https://t.me/${handle}`;
    }

    function getYouTubeLink(input) {
        if (!input) return '#';
        const trimmed = input.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }
        if (trimmed.startsWith('@')) {
            return `https://youtube.com/${trimmed}`;
        }
        return `https://youtube.com/results?search_query=${encodeURIComponent(trimmed)}`;
    }

    // Content Page DOM builder
    function createContentPageDOM(pageNum, visualPageNum) {
        const coverData = state.pagesData[0];

        const page = document.createElement('div');
        page.className = 'a4-page';
        page.setAttribute('data-page', pageNum);

        // Append corner decorators
        appendCornerDecorators(page);

        const innerBorder = document.createElement('div');
        innerBorder.className = 'inner-border-wrapper';

        // Header
        const header = document.createElement('div');
        header.className = 'page-header';
        
        const headerLeft = document.createElement('div');
        headerLeft.className = 'header-left';

        if (state.customDesignSettings.headerLogoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = state.customDesignSettings.headerLogoSrc;
            logoImg.className = 'header-logo-img';
            headerLeft.appendChild(logoImg);
        }

        const titleSpan = document.createElement('span');
        titleSpan.textContent = coverData.title;
        headerLeft.appendChild(titleSpan);

        const headerCenter = document.createElement('div');
        headerCenter.className = 'header-center';
        const centerSpan = document.createElement('span');
        centerSpan.textContent = coverData.subtitle; // Month / Subtitle of magazine
        
        // Dynamically shrink font size if header center text is long
        const subtitleText = coverData.subtitle || '';
        if (subtitleText.length > 20) {
            // Default font size is 15px. Gradually shrink it down to a minimum of 9px.
            const calculatedSize = Math.max(9, 15 - Math.floor((subtitleText.length - 20) / 6));
            centerSpan.style.fontSize = `${calculatedSize}px`;
        }
        
        headerCenter.appendChild(centerSpan);

        const headerRight = document.createElement('div');
        headerRight.className = 'header-right page-number-text';
        applyPaginationStyling(headerRight, visualPageNum);

        header.appendChild(headerLeft);
        header.appendChild(headerCenter);
        header.appendChild(headerRight);

        const headerLine = document.createElement('div');
        headerLine.className = 'header-line';

        // Content Wrapper
        const content = document.createElement('div');
        content.className = 'page-content';
        if (visualPageNum !== 999) {
            let layout = 'two-column';
            if (state.pagesData[visualPageNum] && state.pagesData[visualPageNum].layout) {
                layout = state.pagesData[visualPageNum].layout;
            } else {
                // Inherit layout from the closest previous page if this page is newly/dynamically generated
                for (let idx = visualPageNum - 1; idx >= 1; idx--) {
                    if (state.pagesData[idx] && state.pagesData[idx].layout) {
                        layout = state.pagesData[idx].layout;
                        break;
                    }
                }
            }
            if (layout === 'two-column') {
                content.classList.add('layout-two-column');
            }
        }

        // Footer
        const footer = document.createElement('div');
        footer.className = 'page-footer placement-' + (state.socialSettings.placement || 'split');

        if (state.socialSettings && (state.socialSettings.telegramText || state.socialSettings.youtubeText)) {
            const fsVal = state.socialSettings.fontSize || 11;
            const svgSize = Math.max(10, fsVal + 2);
            // Left: Telegram Link
            if (state.socialSettings.telegramText) {
                const tgLink = document.createElement('a');
                tgLink.className = 'footer-social-link';
                tgLink.href = getTelegramLink(state.socialSettings.telegramText);
                tgLink.target = '_blank';
                tgLink.rel = 'noopener noreferrer';
                tgLink.style.fontSize = `${fsVal}px`;
                tgLink.innerHTML = `<svg class="social-svg-icon" viewBox="0 0 24 24" width="${svgSize}" height="${svgSize}"><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.24-.213-.054-.33-.373-.12l-6.87 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.46c.536-.2 1.006.12.836.953z"/></svg> ${state.socialSettings.telegramText}`;
                footer.appendChild(tgLink);
            }
            // Right: YouTube Link
            if (state.socialSettings.youtubeText) {
                const ytLink = document.createElement('a');
                ytLink.className = 'footer-social-link';
                ytLink.href = getYouTubeLink(state.socialSettings.youtubeText);
                ytLink.target = '_blank';
                ytLink.rel = 'noopener noreferrer';
                ytLink.style.fontSize = `${fsVal}px`;
                ytLink.innerHTML = `<svg class="social-svg-icon" viewBox="0 0 24 24" width="${svgSize}" height="${svgSize}"><path fill="currentColor" d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> ${state.socialSettings.youtubeText}`;
                ytLink.style.fontSize = `${fsVal}px`;
                footer.appendChild(ytLink);
            }
        }

        innerBorder.appendChild(header);
        innerBorder.appendChild(headerLine);
        innerBorder.appendChild(content);
        innerBorder.appendChild(footer);
        page.appendChild(innerBorder);

        return { pageElement: page, contentElement: content };
    }


    // Dynamic cover page TOC renderer with drag-and-drop section reordering support
    function populateCoverPageTOC(sections) {
        const tocPlaceholder = document.getElementById('toc-placeholder');
        if (!tocPlaceholder) return;

        tocPlaceholder.innerHTML = '';

        // Add class to cover content if there are many sections to make layout compact
        const coverContent = document.querySelector('.cover-page-content');
        if (coverContent) {
            if (sections.length > 8) {
                coverContent.classList.add('has-many-sections');
            } else {
                coverContent.classList.remove('has-many-sections');
            }
        }

        const tocTitle = document.createElement('div');
        tocTitle.className = 'toc-title';
        tocTitle.textContent = 'विषयवस्तु';
        tocPlaceholder.appendChild(tocTitle);

        const tocDivider = document.createElement('div');
        tocDivider.className = 'toc-title-divider';
        tocPlaceholder.appendChild(tocDivider);

        const tocHeader = document.createElement('div');
        tocHeader.className = 'toc-header';
        tocHeader.innerHTML = '<span>विषयसूची</span><span>पेज नं.</span>';
        tocPlaceholder.appendChild(tocHeader);

        const tocRows = document.createElement('div');
        tocRows.className = 'toc-rows';
        if (sections.length > 8) {
            tocRows.classList.add('two-columns');
        }

        for (let i = 0; i < sections.length; i++) {
            const currentSection = sections[i];
            const start = currentSection.startPage; // Already visual page number!
            
            let end = state.pagesData.length - 1; // Default to last visual page
            if (i < sections.length - 1) {
                end = sections[i + 1].startPage - 1;
            }

            let pageRangeString = `${start}`;
            if (end > start) {
                pageRangeString = `${start} - ${end}`;
            }

            // Map icon based on name
            let icon = '📂';
            for (const key in sectionIcons) {
                if (currentSection.name.includes(key)) {
                    icon = sectionIcons[key];
                    break;
                }
            }

            const row = document.createElement('div');
            row.className = 'toc-row';
            row.setAttribute('draggable', 'true');
            row.setAttribute('data-section-name', currentSection.name);
            row.innerHTML = `
                <div class="toc-row-left">
                    <span>${icon}</span>
                    <span>${currentSection.name}</span>
                </div>
                <div class="toc-row-page">${pageRangeString}</div>
            `;

            // Bind Drag and Drop event listeners on the TOC row
            row.addEventListener('dragstart', (e) => {
                state.draggedTOCSectionName = currentSection.name;
                row.classList.add('dragging-toc-row');
                e.dataTransfer.setData('text/plain', currentSection.name);
                e.dataTransfer.effectAllowed = 'move';
            });

            row.addEventListener('dragend', () => {
                row.classList.remove('dragging-toc-row');
                document.querySelectorAll('.toc-row').forEach(r => {
                    r.classList.remove('drag-hover-before', 'drag-hover-after');
                });
                state.draggedTOCSectionName = null;
            });

            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!state.draggedTOCSectionName || state.draggedTOCSectionName === currentSection.name) return;

                const rect = row.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                e.dataTransfer.dropEffect = 'move';

                if (e.clientY < midpoint) {
                    row.classList.add('drag-hover-before');
                    row.classList.remove('drag-hover-after');
                } else {
                    row.classList.add('drag-hover-after');
                    row.classList.remove('drag-hover-before');
                }
            });

            row.addEventListener('dragleave', () => {
                row.classList.remove('drag-hover-before', 'drag-hover-after');
            });

            row.addEventListener('drop', (e) => {
                e.preventDefault();
                if (!state.draggedTOCSectionName || state.draggedTOCSectionName === currentSection.name) return;

                const isBefore = row.classList.contains('drag-hover-before');
                row.classList.remove('drag-hover-before', 'drag-hover-after');

                reorderDocumentSectionsByTOC(state.draggedTOCSectionName, currentSection.name, isBefore);
            });

            tocRows.appendChild(row);
        }

        tocPlaceholder.appendChild(tocRows);
    }

    // Helper to merge and reorder entire sections by dragging them in the cover page TOC
    export function reorderDocumentSectionsByTOC(draggedName, targetName, isBefore) {
        parserCallbacks.saveCurrentInputState(); // Capture latest text state of all inputs

        function normalizeSecName(name) {
            if (!name) return '';
            return name.replace(/^#+\s*/, '')
                       .replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '')
                       .trim()
                       .toLowerCase();
        }

        const draggedNorm = normalizeSecName(draggedName);
        const targetNorm = normalizeSecName(targetName);
        if (draggedNorm === targetNorm) return;

        // 1. Get unified content markdown
        const fullContent = state.pagesData.slice(1).map(p => p.text).join('\n');
        const blocks = parseTextToBlocks(fullContent);

        // 2. Segment blocks into section arrays
        let sections = [];
        let currentSec = { nameNorm: '__intro__', nameOrig: '', blocks: [] };
        sections.push(currentSec);

        blocks.forEach(block => {
            if (block.type === 'section') {
                const origName = block.markdown.trim();
                const normName = normalizeSecName(origName);
                currentSec = { nameNorm: normName, nameOrig: origName, blocks: [] };
                sections.push(currentSec);
            } else {
                currentSec.blocks.push(block);
            }
        });

        // 3. Find target and source index, then splice and insert
        const draggedIndex = sections.findIndex(s => s.nameNorm === draggedNorm);
        const targetIndex = sections.findIndex(s => s.nameNorm === targetNorm);
        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedSec] = sections.splice(draggedIndex, 1);
        const newTargetIndex = sections.findIndex(s => s.nameNorm === targetNorm);
        const insertIndex = isBefore ? newTargetIndex : newTargetIndex + 1;
        sections.splice(insertIndex, 0, draggedSec);

        // 4. Stitch back to unified markdown
        let mergedMarkdownParts = [];
        sections.forEach(sec => {
            if (sec.nameNorm !== '__intro__' && sec.nameOrig) {
                mergedMarkdownParts.push(sec.nameOrig);
            }
            sec.blocks.forEach(b => {
                mergedMarkdownParts.push(getBlockMarkdown(b));
            });
            // Spacer between sections
            if (sec.blocks.length > 0 || (sec.nameNorm !== '__intro__' && sec.nameOrig)) {
                mergedMarkdownParts.push('');
            }
        });

        const unifiedMarkdown = mergedMarkdownParts.join('\n');

        // 5. Update content pages (keeping layout configs intact)
        const cover = state.pagesData[0];
        const layouts = state.pagesData.slice(1).map(p => p.layout || 'two-column');
        if (layouts.length === 0) layouts.push('two-column');
        const newPages = layouts.map((lay, idx) => ({
            type: 'content',
            text: (idx === 0) ? unifiedMarkdown : '',
            layout: lay
        }));
        state.pagesData = [cover, ...newPages];

        // 6. Invalidate height cache, re-render preview, and save
        state.cachedMaxContentHeight = null;
        renderPreview();
        parserCallbacks.saveWorkspaceToLocalStorage();
        
        // Auto-switch back to cover page (index 0) so the user sees the reordered TOC
        parserCallbacks.switchActivePage(0);
    }

