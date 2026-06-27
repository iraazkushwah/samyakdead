/* ==========================================================================
   SAMYAK - GOOGLE INPUT TOOLS TRANSLITERATION EMULATOR
   ========================================================================== */

import { state, dom } from './state.js';

export const hindiDictionary = {
    "hai": "है",
    "hain": "हैं",
    "ko": "को",
    "ki": "की",
    "kee": "की",
    "ka": "का",
    "ke": "के",
    "se": "से",
    "ne": "ने",
    "bhi": "भी",
    "bhee": "भी",
    "me": "में",
    "mein": "में",
    "par": "पर",
    "ek": "एक",
    "aur": "और",
    "ye": "ये",
    "yeh": "यह",
    "wo": "वो",
    "woh": "वह",
    "jo": "जो",
    "kar": "कर",
    "karta": "करता",
    "karte": "करते",
    "karti": "करती",
    "karna": "करना",
    "kya": "क्या",
    "kyun": "क्यों",
    "kab": "कब",
    "kahan": "कहाँ",
    "kaise": "कैसे",
    "kitna": "कितना",
    "aaj": "आज",
    "kal": "कल",
    "parso": "परसों",
    "ab": "अब",
    "tab": "तब",
    "jab": "जब",
    "sab": "सब",
    "hi": "ही",
    "hee": "ही",
    "toh": "तो",
    "to": "तो",
    "is": "इस",
    "us": "उस",
    "kis": "किस",
    "jis": "जिस",
    "apna": "अपना",
    "apne": "अपने",
    "apni": "अपनी",
    "mera": "मेरा",
    "mere": "मेरे",
    "meri": "मेरी",
    "tumhara": "तुम्हारा",
    "aap": "आप",
    "hum": "हम",
    "humein": "हमें",
    "hamaara": "हमारा",
    "main": "मैं",
    "mujhe": "मुझे",
    "mujhh": "मुझ",
    "tujhe": "तुझे",
    "ise": "इसे",
    "use": "उसे",
    "jise": "जिसे",
    "kise": "किसे",
    "liye": "लिए",
    "diya": "दिया",
    "liya": "लिया",
    "kiya": "किया",
    "kaha": "कहा",
    "raha": "रहा",
    "rahe": "रहे",
    "rahi": "रही",
    "tha": "था",
    "the": "थे",
    "thi": "थी",
    "ho": "हो",
    "hona": "होना",
    "hota": "होता",
    "hote": "होते",
    "hoti": "होती",
    "gaya": "गया",
    "gaye": "गये",
    "gayi": "गयी",
    "bad": "बाद",
    "pehle": "पहले",
    "saath": "साथ",
    "sath": "साथ",
    "baat": "बात",
    "kaam": "काम",
    "naam": "नाम",
    "log": "लोग",
    "kuch": "कुछ",
    "koi": "कोई",
    "nhi": "नहीं",
    "nahin": "नहीं",
    "nahi": "नहीं",
    "accha": "अच्छा",
    "acha": "अच्छा",
    "bohot": "बहुत",
    "bahut": "बहुत",
    "kam": "कम",
    "jyada": "ज्यादा",
    "ziyada": "ज्यादा",
    "samay": "समय",
    "shyam": "श्याम",
    "ram": "राम",
    "hari": "हरि",
    "om": "ॐ",
    "namo": "नमो",
    "shree": "श्री",
    "shri": "श्री",
    "guru": "गुरु",
    "baba": "बाबा",
    "mandir": "मंदिर",
    "vidyalay": "विद्यालय",
    "shiksha": "शिक्षा",
    "pariksha": "परीक्षा",
    "gyan": "ज्ञान",
    "vigyan": "विज्ञान",
    "videsh": "विदेश",
    "bhasha": "भाषा",
    "hindi": "हिंदी",
    "english": "अंग्रेजी",
    "samvidhan": "संविधान",
    "adhikar": "अधिकार",
    "kartavya": "कर्तव्य",
    "nagrik": "नागरिक",
    "sansad": "संसद",
    "sabha": "सभा",
    "nyayalay": "न्यायालय",
    "kanoon": "कानून",
    "police": "पुलिस",
    "sena": "सेना",
    "raksha": "रक्षा",
    "yudh": "युद्ध",
    "shanti": "शांति",
    "rajasthan": "राजस्थान",
    "samayik": "सामयिकी",
    "samayiki": "सामयिकी",
    "coaching": "कोचिंग",
    "kranti": "क्रांति",
    "yojana": "yojana", // will map via exact rules if not overridden
    "yojanae": "योजनाएँ",
    "neetiyan": "नीतियाँ",
    "mela": "मेला",
    "mele": "मेले",
    "utsav": "उत्सव",
    "mahotsav": "महोत्सव",
    "vividh": "विविध",
    "khel": "खेल",
    "puraskar": "पुरस्कार",
    "abhiyan": "अभियान",
    "samiti": "समिति",
    "pratham": "प्रथम",
    "dvititya": "द्वितीय",
    "tritiya": "तृतीय",
    "bharat": "भारत",
    "rajya": "राज्य",
    "desh": "देश",
    "jaipur": "जयपुर",
    "jodhpur": "जोधपुर",
    "udaipur": "उदयपुर",
    "kota": "कोटा",
    "bikaner": "बीकानेर",
    "ajmer": "अजमेर",
    "samyak": "सम्यक",
    "lokbandhu": "लोकबंधु",
    "rajwada": "रजवाड़ा",
    "shasan": "शासन",
    "sarkar": "सरकार",
    "mantri": "मंत्री",
    "mukhyamantri": "मुख्यमंत्री",
    "kalyan": "कल्याण",
    "vikas": "विकास",
    "aarthik": "आर्थिक",
    "samjhauta": "समझौता",
    "charitra": "चरित्र",
    "vyaktitvap": "व्यक्तित्व",
    "charchit": "चर्चित",
    "pramukh": "प्रमुख",
    "namaste": "नमस्ते",
    "namaskar": "नमस्कार",
    "shuru": "शुरू",
    "ant": "अंत",
    "a4": "A4",
    "upsc": "UPSC",
    "ias": "IAS",
    "pcs": "PCS",
    "update": "UPDATE",
    "nfc": "NFC",
    "jkk": "JKK"
};

// Force dictionary adjustments
hindiDictionary["yojana"] = "योजना";

export function transliterateWord(word) {
    const lower = word.toLowerCase();
    if (hindiDictionary[lower]) {
        return hindiDictionary[lower];
    }

    let res = "";
    let i = 0;
    const len = lower.length;
    
    while (i < len) {
        if (i + 2 < len && lower.substr(i, 3) === "ksh") { res += "क्ष"; i += 3; continue; }
        if (i + 2 < len && lower.substr(i, 3) === "chh") { res += "छ"; i += 3; continue; }
        
        if (i + 1 < len && lower.substr(i, 2) === "kh") { res += "ख"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "gh") { res += "घ"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "ch") { res += "च"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "jh") { res += "झ"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "th") { res += "थ"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "dh") { res += "ध"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "ph") { res += "फ"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "bh") { res += "भ"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "sh") { res += "श"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "Th") { res += "ठ"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "Dh") { res += "ढ"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "tr") { res += "त्र"; i += 2; continue; }
        if (i + 1 < len && lower.substr(i, 2) === "gy") { res += "ज्ञ"; i += 2; continue; }
        
        const char = lower[i];
        
        if (char === "a") {
            if (i + 1 < len && lower[i + 1] === "a") {
                res += (res === "") ? "आ" : "ा";
                i += 2;
                continue;
            }
            if (res === "") {
                res += "अ";
            }
            i++;
            continue;
        }
        if (char === "i") {
            res += (res === "") ? "इ" : "ि";
            i++;
            continue;
        }
        if (char === "u") {
            res += (res === "") ? "उ" : "ु";
            i++;
            continue;
        }
        if (char === "e") {
            res += (res === "") ? "ए" : "े";
            i++;
            continue;
        }
        if (char === "o") {
            res += (res === "") ? "ओ" : "ो";
            i++;
            continue;
        }
        
        const consMap = {
            "k": "क", "g": "ग", "j": "ज", "t": "त", "d": "द", "n": "न",
            "p": "प", "b": "ब", "m": "म", "y": "य", "r": "र", "l": "ल",
            "v": "व", "w": "व", "s": "स", "h": "ह", "f": "फ़",
            "T": "ट", "D": "ड", "N": "ण"
        };
        
        if (consMap[char]) {
            res += consMap[char];
            if (i + 1 < len) {
                const next = lower[i + 1];
                const isNextVowel = ["a", "i", "u", "e", "o"].includes(next);
                if (!isNextVowel) {
                    res += "्";
                }
            }
            i++;
            continue;
        }
        
        res += char;
        i++;
    }
    
    return res;
}

export function getCaretCoordinates(element, position) {
    let div = document.getElementById('textarea-caret-position-mirror-div');
    if (!div) {
        div = document.createElement('div');
        div.id = 'textarea-caret-position-mirror-div';
        document.body.appendChild(div);
    }

    const style = window.getComputedStyle(element);
    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.overflow = 'hidden';

    const properties = [
        'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'fontStretch',
        'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'borderStyle', 'boxSizing', 'width', 'height', 'textTransform', 'textAlign'
    ];
    
    properties.forEach(prop => {
        div.style[prop] = style[prop];
    });

    div.style.width = element.clientWidth + 'px';
    div.style.height = element.clientHeight + 'px';
    div.scrollTop = element.scrollTop;

    const textContent = element.value.substring(0, position);
    div.textContent = textContent;

    const span = document.createElement('span');
    span.textContent = ' ';
    div.appendChild(span);

    const rect = element.getBoundingClientRect();
    const spanOffsetTop = span.offsetTop;
    const spanOffsetLeft = span.offsetLeft;

    const top = rect.top + window.scrollY + spanOffsetTop - element.scrollTop;
    const left = rect.left + window.scrollX + spanOffsetLeft - element.scrollLeft;

    return { top, left };
}

export function generatePhoneticSuggestions(word) {
    if (!word) return [];
    const lower = word.toLowerCase();
    let suggestions = [];

    if (hindiDictionary[lower]) {
        suggestions.push(hindiDictionary[lower]);
    }

    const exactTranslit = transliterateWord(lower);
    if (exactTranslit && !suggestions.includes(exactTranslit)) {
        suggestions.push(exactTranslit);
    }

    for (const [key, val] of Object.entries(hindiDictionary)) {
        if (key.startsWith(lower) && !suggestions.includes(val)) {
            suggestions.push(val);
            if (suggestions.length >= 4) break;
        }
    }

    const endings = ["ा", "ी", "ु", "े", "ो"];
    let base = exactTranslit;
    if (base.endsWith("्")) {
        base = base.substring(0, base.length - 1);
    }
    for (const end of endings) {
        if (suggestions.length >= 4) break;
        const variant = base + end;
        if (!suggestions.includes(variant)) {
            suggestions.push(variant);
        }
    }

    const fallbackWords = ["राज", "राम", "कुमार", "सिंह", "वर्मा", "शर्मा", "यादव", "पटेल", "चौधरी"];
    for (const fallback of fallbackWords) {
        if (suggestions.length >= 4) break;
        if (!suggestions.includes(fallback)) {
            suggestions.push(fallback);
        }
    }

    suggestions = suggestions.slice(0, 4);
    suggestions.push(word);
    return suggestions;
}

export function renderPhoneticSuggestionsTooltip(suggestions) {
    const tooltip = dom.phoneticSuggestionsTooltip;
    if (!tooltip) return;

    if (!suggestions || suggestions.length === 0) {
        tooltip.style.display = 'none';
        state.suggestionsActive = false;
        return;
    }

    tooltip.innerHTML = '';
    suggestions.forEach((sug, idx) => {
        const item = document.createElement('div');
        item.className = 'phonetic-suggestion-item' + (idx === state.activeSuggestionIndex ? ' highlighted' : '');
        
        const textSpan = document.createElement('span');
        textSpan.textContent = sug;
        item.appendChild(textSpan);

        const badge = document.createElement('span');
        badge.className = 'suggestion-num-badge';
        badge.textContent = idx + 1;
        item.appendChild(badge);

        item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectPhoneticSuggestion(idx);
        });

        tooltip.appendChild(item);
    });

    tooltip.style.display = 'flex';
    state.suggestionsActive = true;
}

export function selectPhoneticSuggestion(index) {
    if (index < 0 || index >= state.suggestionsList.length) return;
    const chosenWord = state.suggestionsList[index];
    
    const text = dom.pageContentInput.value;
    const selStart = dom.pageContentInput.selectionStart;
    
    const wordStart = state.currentWordStartIdx;
    const wordEnd = selStart;
    
    const newText = text.substring(0, wordStart) + chosenWord + ' ' + text.substring(wordEnd);
    dom.pageContentInput.value = newText;
    
    const newCursorPos = wordStart + chosenWord.length + 1;
    dom.pageContentInput.setSelectionRange(newCursorPos, newCursorPos);
    
    const inputEvent = new Event('input', { bubbles: true });
    dom.pageContentInput.dispatchEvent(inputEvent);
    
    hidePhoneticSuggestionsTooltip();
    dom.pageContentInput.focus();
}

export function hidePhoneticSuggestionsTooltip() {
    if (dom.phoneticSuggestionsTooltip) {
        dom.phoneticSuggestionsTooltip.style.display = 'none';
    }
    state.suggestionsActive = false;
    state.suggestionsList = [];
    state.activeSuggestionIndex = 0;
    state.currentEnglishWord = "";
    state.currentWordStartIdx = -1;
}

export function handlePhoneticTyping(e) {
    if (!state.domInitialized) return; // safety
}
