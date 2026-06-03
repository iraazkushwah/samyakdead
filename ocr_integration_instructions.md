# Samyak (Loka Nota) OCR Developer Specification & Editor Syntax Guide

This document defines the interface, API contract, transcription guidelines, and markdown syntax specifications required to build a standalone OCR engine compatible with the **Samyak (Loka Nota) Layout Engine & Editor**. 

You should share this guide with your developer to ensure the OCR engine produces outputs that compile and render perfectly within the Samyak platform.

---

## 1. API Contract & Communication Schema

The Samyak frontend communicates with the OCR backend using a single REST endpoint.

### Endpoint: `POST /api/ocr`
* **Content-Type**: `application/json`

#### Request Payload Structure
The frontend uploads files (PDFs or images) encoded as base64 string.
```json
{
  "fileBase64": "string (Base64 representation of the image or PDF)",
  "mimeType": "string (e.g., 'application/pdf', 'image/png', 'image/jpeg')",
  "fileName": "string (Optional, name of the file)"
}
```

#### Response Payload Structure
The response must be valid JSON containing the structured markdown, estimated confidence score, word count, and an array of legibility alerts.
```json
{
  "markdown": "string (The compiled markdown following the syntax specifications below)",
  "confidenceEstimate": 95, // Integer percentage (0-100)
  "wordCount": 352,         // Total words processed
  "alerts": [
    {
      "fragment": "[अस्पष्ट शब्द]", // The unclear/illegible handwritten word
      "context": "प्रधानमंत्री फसल बीमा योजना के तहत [अस्पष्ट शब्द] दिया गया", // Surrounding text
      "reason": "Faded ink or smudged handwriting" // Reason for low confidence
    }
  ]
}
```

---

## 2. Core OCR Transcription & Formatting Rules

The OCR engine must follow these rules during multimodal processing:

### A. Language & Script Consistency (Zero Translation)
* **Keep Original Scripts**:
  - If text is written in Hindi (Devanagari script), transcribe in Devanagari script (e.g., `योजना`).
  - If text is written in English (Latin script), transcribe in Latin script (e.g., `UPDATE`).
  - If the text is bilingual (Hinglish or mixed sentences), keep each word in its original script.
* **No Translation**: Never translate Hindi to English or English to Hindi.
* **No Transliteration**: Never convert scripts (e.g., do not write "Yojana" if the source has "योजना").

### B. Skip Visual Elements (Diagrams / Images / Drawings)
* **Do Not Describe**: Handwritten notes often contain drawings, maps, flowcharts, circular diagrams, or tables representing graphics. The OCR must **NOT** scan or describe them.
* **Insert HTML Spacers**: Estimate the physical vertical height that the visual element occupies on the paper (usually between 100px and 450px). At that exact sequential location in the markdown, insert the following HTML placeholder block:
  ```html
  <div style="height: 220px; border: 1px dashed #cbd5e1; border-radius: 8px; margin: 16px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 11px; font-family: sans-serif;">[Image Slot - Skipped for Manual Placement]</div>
  ```

### C. Line Wrapping & Bullet Point Re-construction
* **Strict Bullets**: The bullet symbol (`•`) must **ONLY** be placed at the beginning of a grammatically complete sentence or standalone thought.
* **No Fragment Bullets**: Do not put bullet symbols before running headers, page numbers, single numbers, dates, or broken phrases.
* **Merge Wrapped Lines**: Handwritten notes wrap single sentences across 2–3 physical lines on paper due to margin width. The OCR must merge these physically wrapped continuation lines into a **single, continuous, uninterrupted line in markdown** with only one bullet `•` at the start. Do not insert hard line breaks (`\n`) or new bullet symbols inside a paragraph or bullet point.
* **Clean Prefixes**: Never output double bullets (e.g., `- •`, `• •`, `* •`).

### D. Bad Handwriting Handling (Fuzzy Words)
* **Inline Highlights**: If a handwritten word is smudged, crossed-out, or illegible:
  - If the surrounding sentence is Hindi: Replace inline with `==⚠️ High Alert: [अस्पष्ट शब्द]==`
  - If the surrounding sentence is English: Replace inline with `==⚠️ High Alert: [illegible word]==`
* **Metadata Alert**: For each fuzzy segment, add a structured entry in the JSON response `alerts` array containing the `fragment`, `context`, and `reason`.

---

## 3. Samyak Editor Syntax Specifications

The Samyak Layout Engine parses the markdown using specific regex block rules. The OCR output must conform to these formatting constructs to render properly in A4 page print layouts:

### A. YAML Metadata Header Block
If the document has a cover page or main header information, it should start with:
```yaml
---
title: [Title of the notes, e.g., लोकबंधु]
tagline: [Tagline, e.g., कोचिंग नहीं क्रांति]
subtitle: [Subtitle or Section details, e.g., राजस्थान समसामयिकी : 1-10 मई]
---
```

### B. Heading Levels
* **Heading Level 1 (H1)**: Major section bars (e.g., `# योजनाएँ एवं नीतियां`).
* **Heading Level 2 (H2 - Topic Titles)**: Sub-topics (e.g., `## प्रधानमंत्री फसल बीमा योजना UPDATE`). You may prefix topics with diamond emojis (e.g., `🔶`, `🔷`, `🔸`, `🔹`, `♦️`, `💎`), as the Samyak editor uses these for styling topic headings.

### C. List Bullet Points & Key-Values
* **Bullet points**: Always use the standard bullet character `•` (Unicode `U+2022`).
* **Key-Value metadata**: Inside notes, sub-details like organizers or dates are formatted with bold keys separated by ` :- ` inside a bullet:
  `• **आयोजन** :- 7 और 8 मई 2026, जयपुर`
* **Nested bullets**: Indent child bullets with two spaces:
  ```markdown
  • Parent bullet point
    • Child bullet point
  ```

### D. Layout Control Tags
* **Page Break**: Insert `[pagebreak]` to manually force content to start on the next A4 sheet. (Note: Avoid using `---` in OCR body text for page breaks because the backend post-processor strips `---` to prevent visual separation errors).
* **Column Break**: Insert `[columnbreak]` or `[colbreak]` to push subsequent text into the next column in a 2-column layout.
* **Vertical Spacers**: Insert `[space 5]` or `[spce 5]` (values from 1 to 50) to introduce clean vertical gaps.
* **Box Container Blocks**: To wrap information inside stylized border boxes, use:
  ```markdown
  [box]
  • Content inside box
  • Point 2
  [/box]
  ```
  *(Supported box variants: `[box]`, `[box-double]`, `[box-dashed]`, `[box-bg]`, `[box-royal]`)*
* **Divider Lines / Thank You Blocks**: Use `[thankyou]`, `***`, `* * *`, or `✦ ✦ ✦` at the end of sections to render magazine-grade star dividers.

### E. Interactive Comment Cards (Custom Customizer Tags)
The editor parses specific HTML comments to build beautiful grid callouts:
* **Personality Feature Card**:
  `<!-- personality|avatar=👤|name=ऋषभ पारेख|title=संस्कृत विशेषज्ञ|desc=व्याकरण विशेषज्ञ। -->`
* **Stats Callout Grid**:
  `<!-- stats|num1=92%|lbl1=सफलता दर|desc1=2026 परीक्षा|num2=500+|lbl2=चयनित छात्र|desc2=राजस्थान -->`
* **Quick Facts Grid**:
  `<!-- facts-grid|t1=तथ्य 1|d1=विवरण 1|t2=तथ्य 2|d2=विवरण 2 -->`
* **Announcement Alert Box**:
  `<!-- announcement|title=महत्वपूर्ण सूचना|content=कक्षाएं 10 मई से शुरू होंगी। -->`

### F. Inline Formatting
* **Bold text**: `**text**`
* **Italic text**: `*text*`
* **Highlight markers**: `==text==` (renders as yellow highlight) or color-coded highlights: `==green|text==`, `==pink|text==`, `==blue|text==`, `==orange|text==`.
* **Exponents / Superscripts**: `base^(exponent)` or `base^exponent` (e.g. `x^2` or `x^(a+b)`).
* **Subscripts**: `base_(subscript)` or `base_subscript` (e.g. `H_2O` or `H_(abc)`).
* **Math symbols**: Math formulas written in LaTeX style shorthand are automatically converted to clean Unicode symbols:
  - `\\alpha` -> `α`
  - `\\beta` -> `β`
  - `\\pi` -> `π`
  - `\\infinity` -> `∞`
  - `\\times` -> `×`
  - `\\geq` -> `≥` (etc.)

---

## 4. Backend Post-Processing Sanitizer (Recommended Algorithm)

Even with strict prompts, LLMs can output broken bullet sequences or fragmented line wraps. The backend should implement a post-processor to sanitize the markdown output before sending it to the client:

```typescript
export function sanitizeOCRResult(markdown: string): string {
  if (!markdown) return "";

  let text = markdown;

  // 1. Remove line-isolated section break hyphens that break multi-column rendering
  text = text.replace(/^[ \t]*-{3,}[ \t]*$/gm, "\n");

  // 2. Strip consecutive hyphens inside running sentences
  text = text.replace(/---+/g, " ");

  const lines = text.split("\n");
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 3. Clean duplicate or mixed bullets at the start of a line (e.g. "- • ", "• • ", "* • ")
    line = line.replace(/^(\s*)([•\-\*\u2022\u25CF\u25AA\u25AB]\s*)+/, (match, spaces) => {
      const trimmed = match.trim();
      const bulletChar = trimmed.charAt(0);
      return spaces + bulletChar + " ";
    });

    const trimmedCurrent = line.trim();
    if (!trimmedCurrent) {
      processedLines.push(line);
      continue;
    }

    // Identify structural markdown block types that should NEVER be merged
    const isSpecialBlock = trimmedCurrent.startsWith("[box") ||
                           trimmedCurrent.startsWith("[/box]") ||
                           trimmedCurrent.startsWith("[chapter") ||
                           trimmedCurrent.startsWith("|") ||
                           trimmedCurrent.startsWith("<!--") ||
                           trimmedCurrent.startsWith("<") ||
                           trimmedCurrent.startsWith("#") ||
                           trimmedCurrent.startsWith(">") ||
                           trimmedCurrent.startsWith("[pagebreak") ||
                           trimmedCurrent.startsWith("[columnbreak") ||
                           trimmedCurrent.startsWith("[colbreak") ||
                           trimmedCurrent === "[thankyou]" ||
                           trimmedCurrent === "***" ||
                           trimmedCurrent === "* * *" ||
                           trimmedCurrent === "✦ ✦ ✦" ||
                           trimmedCurrent === "---";

    // 4. Merge broken trailing paragraphs/sentences (Sentence Re-construction)
    if (!isSpecialBlock) {
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const trimmedNext = nextLine.trim();
        if (!trimmedNext) break;

        // Next line represents a brand-new logical block
        const isNextNewBlock = trimmedNext.startsWith("#") ||
                               trimmedNext.startsWith("•") ||
                               trimmedNext.startsWith("-") ||
                               trimmedNext.startsWith("*") ||
                               /^[🔶🔷🔸🔹♦️💎]/u.test(trimmedNext) ||
                               /^\(\d+\)/.test(trimmedNext) ||
                               /^\d+\./.test(trimmedNext) ||
                               trimmedNext.startsWith(">") ||
                               trimmedNext.startsWith("[box") ||
                               trimmedNext.startsWith("[/box]") ||
                               trimmedNext.startsWith("[chapter") ||
                               trimmedNext.startsWith("|") ||
                               trimmedNext.startsWith("<") ||
                               trimmedNext.startsWith("[pagebreak") ||
                               trimmedNext.startsWith("[columnbreak") ||
                               trimmedNext.startsWith("[colbreak") ||
                               trimmedNext === "***";

        if (isNextNewBlock) break;

        // Append line and continue looking ahead
        const spacer = line.endsWith(" ") ? "" : " ";
        line = line + spacer + trimmedNext;
        i++;
      }
    }
    processedLines.push(line);
  }

  return processedLines.join("\n");
}
```

---

## 5. Model Retry Cascade (Waterfall Retry)

To guarantee 100% service uptime and prevent HTTP 429 (rate limits) or 503 (service unavailable) failures, the API should implement a retry cascade loop:
1. **Primary Model**: `gemini-3.5-flash` or `gemini-2.5-flash` (First attempt, fast and cost-effective).
2. **Secondary Fallback**: `gemini-2.5-pro` (If rate limits or errors occur, retry with a more capable model).
3. **Linear Backoff**: Introduce a 1-second delay between fallback attempts to let the rates settle.
