# 📚 Product & Design Specification: Samyak (Loka Nota) Premium Layout Engine & OCR Platform

This master specification document outlines **exactly what the website does (Core Features)** and **how the user interface looks and behaves (Premium UI/UX Design System)**. 

---

## 1. Core Application Concept & Features
**Samyak (Loka Nota)** is a high-performance, browser-based, dependency-free Hindi document layout engine and PWA. It enables educators and content creators to transcribe handwritten educational notes via an advanced OCR engine, format them into magazine-grade PDF/A4 multi-page printed notes, and customize their styling using luxury Indian-inspired aesthetics.

### Key Functional Modules:
1. **Zero-Lag Dual-Panel Editor**:
   - **Left Panel (Raw Markdown Editor)**: A zero-lag, custom-built rich text/markdown editor designed for entering educational notes. Powered by `requestAnimationFrame` to eliminate input latency.
   - **Right Panel (Interactive A4 Print Preview)**: Automatically compiles markdown into beautifully styled A4 pages in real time, with exact margin alignments, borders, columns, and pagination markers.
2. **Handcrafted Luxury Design Themes**:
   - Shifts the entire visual layout between themes (e.g., *Gothic Royal Black*, *Maharaja Palace Gold*, *Neo-Gothic Obsidian*, *Royal Sapphire Luxury*, *Classic Academic*).
3. **Advanced Border & Customization Engine**:
   - Dynamic double-line borders with customizable inner margins, elegant corner vectors, and custom header/footer text.
4. **Watermark & Logo Blending**:
   - Blends uploaded logos (like `luka.png`) with advanced CSS (`mix-blend-mode: multiply`) and displays custom diagonal or grid watermarks across all generated pages.
5. **Magazine-Grade Two-Column Flow**:
   - High-fidelity multi-column layout engine with adjustable column gap thickness, divider styles, and anti-gap balancing (`column-fill: auto`) to prevent empty gaps on pages.
6. **Dynamic Cover Page & Drag-and-Drop TOC**:
   - Automatically generates a cover page with title, subtitle, author credits, and social media handles.
   - **Interactive TOC**: Generates a Table of Contents based on document headings. Users can drag and drop TOC rows in the preview to physically reorder pages in the document!
7. **Offline PWA Capabilities**:
   - Fully installable on iOS, Android, and Desktop with offline assets caching via service worker (`sw.js`).
8. **High-Performance Storage**:
   - Document metadata, notes, and user design preferences are automatically saved in the local browser database using **IndexedDB**, guaranteeing zero data loss.

---

## 2. Master UI/UX Layout Specification
The website interface is split into **two major sections**: the **Workspace (Notes Customizer)** and the **Samyak OCR Dashboard**.

```
+---------------------------------------------------------------------------------------+
|                                  TOP NAVIGATION BAR                                   |
|   [ Logo ]   [ Document Title ]   [ Active Tab: Workspace / OCR Scan Dashboard ]      |
+---------------------------------------------------------------------------------------+
|                                  ACTIVE WORKSPACE TAB                                  |
|  +--------------------+  +----------------------------+  +--------------------------+  |
|  | DESIGN SIDEBAR     |  | RAW EDIT PANEL             |  | A4 PRINT PREVIEW PANEL   |  |
|  | - Theme Selector   |  | - Markdown Inputs          |  | - Cover Page             |  |
|  | - Border Settings  |  | - Page/Column Breaks       |  | - Dynamic Borders        |  |
|  | - Columns Config   |  | - Zero-Lag scroll sync     |  | - Two-Column Flow        |  |
|  | - Watermark Text   |  |                            |  | - Multi-page Pagination  |  |
|  | - Cover Layout     |  |                            |  | - Drag-and-Drop TOC      |  |
|  +--------------------+  +----------------------------+  +--------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## 3. Detailed UI Components & Aesthetics

### A. Color Palette & Dark Mode Architecture
Samyak uses premium HSL tailored design systems instead of generic colors:
* **Dark Interface Shell**: `#0b0f17` (Deep Obsidian Black) background, with fine borders in `rgba(255, 255, 255, 0.05)` for a floating glassmorphic container look.
* **Accent Colors**: `#e2b857` (Palace Gold), `#3b82f6` (Sapphire Blue), `#f43f5e` (Gothic Crimson Red).
* **Typography**: Outfit / Inter for UI controls, and clean, high-legibility fonts (Poppins / Kruti Dev / Devanagari standard fonts) for the rendered Hindi text.

### B. Customizer Sidebar (Left)
A sleek, scrollable control center containing interactive accordion panels:
1. **Luxury Theme Panel**: Dropdown selector with 8 preset color and typography schemes.
2. **Page & Border Setup**: 
   - Sliders for inner page border margins (`10px` to `40px`).
   - Border Style: Solid, Double, Dashed, or Custom Border Corner Decors.
   - Border Color picker.
3. **Column Configurations**:
   - Number of columns toggle (`1 Column` / `2 Columns`).
   - Column gap divider thickness slider and divider line style (dotted, dashed, solid).
4. **Watermark & Logo Settings**:
   - Text watermark input (diagonal angle and opacity sliders).
   - Logo Upload box with drag-and-drop support, size sliders, and blend mode selectors.
5. **Cover & Page Header Settings**:
   - Toggle to enable/disable cover page.
   - Input fields for: Title, Subtitle, Tagline, Author Name, Profile Image, and Instagram/Telegram handles.

### C. Live Workspace Editor Panel (Center)
* **Design**: Minimalist dark-themed code editor container with line numbering.
* **Control Actions**: Top bar with formatting buttons (Bold, Bullet List, Topic `##`, Section `#`, Image Spacer Slot, Manual Page Break, Column Break).
* **Scroll Sync**: Smooth scrolling that locks the editor position with the corresponding page in the right A4 Preview.

### D. Interactive A4 Print Preview Panel (Right)
* **Design**: Simulates a stack of actual physical paper pages floating over a deep shadow drop background.
* **A4 Dimensions**: Rendered page sheets sized exactly at `794px` width and `1123px` height (perfect 1:1.414 aspect ratio).
* **Corner Decorators**: Golden filigrees or classic lines at the four corners of every single page sheet.
* **Drag-and-Drop TOC**: Hovering over the Table of Contents reveals grid handles. Dragging a row swaps the page index inside the workspace arrays dynamically.

---

## 4. The OCR Scan Dashboard: Detailed UI & Integration Specification
When the user clicks the **"OCR Scan Dashboard"** tab in the header, they enter the document transcription workstation.

```
+---------------------------------------------------------------------------------------+
|  OCR WORKSPACE TAB (Double Column Layout)                                              |
|                                                                                       |
|  [ LEFT COLUMN: SCANNED IMAGE WORKSPACE ]  [ RIGHT COLUMN: OCR RESULT WORKSPACE ]      |
|  +-------------------------------------+  +-----------------------------------------+  |
|  | - Drag & Drop / File Upload Box     |  | - Action Bar (Copy / Download / Insert) |  |
|  | - Selected Page Image Preview       |  | - Panel Tabs (Preview | Editor | Alerts)|  |
|  | - Scanning Laser Scan Overlays      |  | - Preview Tab: Beautiful typography     |  |
|  | - Image Hover Bounding Boxes        |  | - Editor Tab: Code editor to edit text  |  |
|  | - Bottom Actions (Reset / Scan)     |  | - Alerts Tab: High Alert Card details   |  |
|  +-------------------------------------+  +-----------------------------------------+  |
+---------------------------------------------------------------------------------------+
|  [ FOOTER STATS BAR: Confidence: 96%  |  Word Count: 342  |  Fuzzy Words Detected: 2 ] |
+---------------------------------------------------------------------------------------+
```

### A. Input Scanning Panel (Left Column)
1. **Interactive File Uploader**:
   - A dotted-line drop zone with custom cloud-upload icon.
   - Accepts JPG, PNG, WEBP, and PDF files.
   - Support for drag-and-drop, showing progress during image compression.
2. **Page Image View & Laser Scan Animation**:
   - Once uploaded, displays the scanned document page.
   - **Scanning Overlay**: When the user clicks "Process Document", a bright cyan laser line scans vertically from top to bottom across the image in an infinite loop.
   - **Bounding Box Highlights**: As OCR runs, glowing highlighted boxes overlay recognized word structures on the image to visually demonstrate "reading in progress".

### B. Output Panel & Action Center (Right Column)
1. **Top Actions Bar**:
   - **Insert to Editor Button**: Directly inserts the scanned text into the main Samyak A4 Editor at the selected page position.
   - **Copy to Clipboard Button**: Copies the entire markdown output. Shows "Copied! ✓" on success.
   - **Download Markdown (.md) Button**: Downloads the raw text as a local markdown file.
2. **Three-Panel Tab Switcher**:
   - **Preview Tab (Selected by Default)**: Shows a magazine-grade, styled preview of the parsed OCR document, using Poppins typography, rendering standard bullet points, H1 tags, H2 topics, and skipping drawings/images with custom placeholder boxes.
   - **Editor Tab**: A text editor allowing the user to manually edit and touch up the transcribed markdown.
   - **Alerts Tab**: Shows glowing crimson cards for every unclear or illegible handwritten word found.

### C. The Alerts Card UI (Under Alerts Tab)
Unclear or smudged handwriting is flagged by the OCR backend. For each flagged word, the UI displays a clean, rounded alert card:
* **Alert Badge**: Glowing crimson label `⚠️ HIGH ALERT #[Index]`
* **Flagged Text**: Highlighted fragment in yellow/crimson background (e.g. `[अस्पष्ट शब्द]`).
* **Context Display**: Displays the surrounding sentence context so the user can easily guess and fill in the missing word.
* **Reason Tag**: A capsule badge explaining the failure (e.g. `Blurry Handwriting`, `Ink Stain`, `Page Cut-off`).

### D. Bottom Status & Statistics Bar
Displays high-fidelity key performance metrics:
* **Confidence Gauge**: Horizontal bar showing the overall accuracy score (e.g., `Confidence: 97.4%`). Glowing green for high confidence, orange for medium, red for low.
* **Word Count**: Count of total words parsed.
* **Alerts Count**: Red circle showing the count of fuzzy words requiring manual attention.

---

## 5. Frontend & Backend OCR API Integration Flow

For Vercel stability and high-performance scanning, the frontend connects to a decoupled, high-capacity, standalone OCR backend using the following protocol:

```
[Browser Upload] 
       │
       ▼ (Base64 compression in frontend)
[POST /api/ocr Payload (up to 50MB)] ────► [Decoupled Backend API Server]
                                                    │
                                                    ▼ (Failover query)
                                           [Gemini Multimodal LLM Client]
                                                    │
                                                    ▼ (Generates Structured JSON)
[Clean JSON Response] ◄──────────────────── [Post-Processing Sanitizer Engine]
```

### Integration Workflow Steps:
1. **Frontend Compression**: Before uploading, the frontend javascript reads the selected image file and encodes it as a base64 string.
2. **Payload Dispatch**: Dispatches the payload directly to the dedicated OCR backend API URL (bypassing Vercel's 4.5MB limit entirely).
3. **Scan Animation Activation**: The UI immediately starts the laser-scan overlay and locks the action buttons.
4. **Backend Failover Engine**: The backend tries `gemini-3.5-flash` first, and cascade-fails over to `gemini-2.5-pro` in case of rate limits or service dropouts to ensure 100% service uptime.
5. **Post-Processing & Line Merging**: The backend sanitizes hyphens, strips layout-destroying divider lines, and merges wrapped handwriting sentences.
6. **Result Rendering**: On receipt, the frontend:
   - Sets the confidence gauge.
   - Populates the alerts list.
   - Populates the raw textarea.
   - Stops the laser-scan animation.
   - Shows the active "Preview" tab.
