# 📚 सम्यक् (Samyak) — Ultra-Premium Hindi Notes & Document Layout Engine

**सम्यक् (Samyak)** is a modern, high-performance, and dependency-free web application designed to create beautiful, magazine-grade Hindi study materials and documents. Crafted with a focus on premium print-ready aesthetics, Samyak provides creators and educators with advanced page layout configurations, custom branding tools, and interactive content editors.

It is fully structured as a **Progressive Web App (PWA)**, making it installable on mobile devices (Android/iOS) and desktops, with offline capabilities.

---

## ✨ Features at a Glance

### 🎨 Handcrafted Luxury Design Systems
- **Handcrafted Themes:** Instantly shift your documents between handcrafted premium styles such as *Gothic Royal Black*, *Maharaja Palace Gold*, *Neo-Gothic Obsidian*, *Royal Sapphire Luxury*, and *Classic Academic*.
- **Border Customization:** Configure double-line borders, inner border margins, elegant corner decorators, custom corner sizes, and border colors.
- **Watermark & Logo Blending:** Dynamic text watermarks (diagonal or grid) and a custom logo uploader (`luka.png`) with advanced blending modes (`mix-blend-mode: multiply`) and drop-shadow glow highlights.

### 📝 Magazine-Grade Layout & Print Engine
- **Two-Column Flow Optimization:** Structured multi-column layout engine with custom column gap dividers, thickness, and style controls.
- **Anti-Gap Balancing:** Implements sequential column filling (`column-fill: auto`) to prevent premature column breaks and keep text flowing naturally.
- **Dynamic Cover Page:** Automatically generates cover pages with customizable headers, blank author credits, blank social links, and an **Auto-Generated Table of Contents (TOC)**.
- **Manual Control Dividers:** Insert manual pagebreaks (`---`) or column breaks (`[columnbreak]`) to align blocks precisely. Custom manual End Star Dividers (`***`, `* * *`, `✦ ✦ ✦`) can be toggled and styled on demand.

### ⚡ High-Performance Workspace Editor
- **Zero-Lag Scroll Synchronization:** Scroll sync is driven by a custom animation-frame rendering queue (`requestAnimationFrame`), avoiding typing delays in massive documents.
- **Smart DOM Updates:** Minimized DOM writes and throttled scroll rendering lower rendering CPU loads to absolute zero when there are no updates.
- **Local Persistence:** Powered by **IndexedDB**, guaranteeing that notes and design states are safely persisted in the browser and will never be lost on reload.
- **Interactive Drag-and-Drop Reordering:** Simply drag and drop table of contents headers inside the cover preview to reorder sections in real time!

### 📱 Progressive Web App (PWA) Capabilities
- **Installable App:** Prompt options to "Install as an App" on home screens, offering a standalone native app experience.
- **Service Worker Caching:** Employs a robust caching network fallback (`sw.js`) that caches core assets locally, making the application launch instantly and run entirely offline.

---

## 🛠️ Technology Stack
Samyak is designed to be **100% dependency-free and framework-less** for absolute performance, longevity, and speed.

- **Frontend:** Semantic HTML5 & Modern ES6+ JavaScript.
- **Styling:** Advanced Vanilla CSS3 (Custom Properties/CSS Variables, CSS Grid, Flexbox, Multi-Column Layout).
- **Storage:** Local Browser IndexedDB API.
- **PWA:** Web App Manifest (`manifest.json`) & Service Worker APIs.
- **Icons:** SVG vector graphics.

---

## 🚀 Getting Started

### Prerequisites
To test the Progressive Web App (PWA) capabilities and service worker caching, the project should be served over HTTPS or a local server on `localhost`.

### Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/samyakraaz.git
   cd samyakraaz
   ```

2. **Serve the application:**
   You can use any lightweight HTTP server. For example, using Node.js:
   ```bash
   # Install a local static server
   npm install -g http-server
   
   # Run the server
   http-server -p 8080
   ```
   Alternatively, if you use VS Code, you can right-click `index.html` and select **Open with Live Server**.

3. **Open in browser:**
   Navigate to `http://localhost:8080` (or the port served by your local environment).

4. **Install Samyak:**
   Click the install icon in your browser search bar (or "Add to Home Screen" option on mobile Safari/Chrome) to run Samyak as a standalone app!

---

## 🗂️ Project Structure
```markdown
├── index.html         # Main structure, Customizer Sidebars & registration scripts
├── app.js             # Core workspace controllers, IndexedDB, Parser & PWA listeners
├── styles.css         # Unified styling sheet containing all 8 luxury design systems
├── manifest.json      # Web App Manifest describing standalone launcher config
├── sw.js              # Service Worker managing offline asset caches
├── luka.png           # Custom brand brand favicon and apple touch launcher icon
├── raaz_profile.png   # Default branding profile asset
└── README.md          # Project guide and documentation
```

---

## 🤝 Contributing
Contributions, suggestions, and feature requests are welcome! Feel free to open an issue or submit a pull request if you have ideas for adding new themes or further enhancing print layouts.

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
