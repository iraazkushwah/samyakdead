import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limits for handling uploads of large documents
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS manually to support decoupled architecture
app.use((req: any, res: any, next: any) => {
  const origin = req.headers.origin;
  // Echo the Origin dynamically to support credentialed cross-origin requests
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,PATCH,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Healthy Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Lazy load Gemini client to prevent crashing if the key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in Settings > Secrets in the AI Studio UI.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to process images/PDF OCR using Gemini
app.post("/api/ocr", async (req, res): Promise<any> => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing required fields: fileBase64 and mimeType" });
    }

    const ai = getGeminiClient();

    // Prepare content parts
    const filePart = {
      inlineData: {
        mimeType: mimeType,
        data: fileBase64,
      },
    };

    const promptText = `
You are an extremely advanced OCR and Document Layout Expert. 
Your task is to analyze the provided page or document image/PDF and convert it into high-fidelity markdown, following these strict parameters:

1. **Language-Adaptive Extraction**:
   - If the document is in English, extract and keep the output in English.
   - If the document is in Hindi or Sanskrit (Devanagari script), extract and keep the output in Hindi/Sanskrit.
   - If the document is bilingual/multilingual (contains both Hindi and English words or mixed sentences), extract each word in its original script and language exactly as written (e.g. Devanagari script for Hindi, Latin script for English). DO NOT translate or convert any words/phrases between Hindi and English under any circumstances.

2. **Skip Embedded Images / Figures & Reserve Proportional Space**:
   - IMPORTANT: If there are any embedded images, photos, drawings, charts, diagrams, or visual illustrations in between the text, you MUST NOT scan, transcribe, or describe their internal elements. SKIP them completely.
   - You MUST estimate the vertical size or layout height occupied by each embedded image.
   - In the markdown output, at the exact relative visual position where the skipped image was located, you MUST insert a clean HTML spacer placeholder block representing that empty space, so the user can insert an image later.
   - Use this exact spacer format, substituting the height value (e.g. between 100px and 450px) based on how much relative vertical footprint that image takes on the page:
     <div style="height: 220px; border: 1px dashed #cbd5e1; border-radius: 8px; margin: 16px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 11px; font-family: sans-serif;">[Image Slot - Skipped for Manual Placement]</div>

3. **Layout & Flow Preservation**:
   - Maintain the line sequence, bullet points, tabular layouts, indentation, and paragraph boundaries perfectly.
   - Use appropriate heading syntax: '#' for main document headers, '##' or '###' for section titles.
   - DO NOT USE horizontal pagebreak symbols, section divider lines, or horizontal rules (e.g., \`---\`, \`----\`, or multiple consecutive dashes on a line or anywhere in the text) as these cause pagebreak errors in the user's destination copy application. Keep the text flowing as one continuous, uninterrupted stream of readable paragraphs and lists matching the source sequence exactly. No divider lines of any kind.
    - IMPORTANT: Avoid inserting hard line breaks (\\n) in the middle of a paragraph or bullet point. Every single bullet point, list item, or paragraph must be output as a single, continuous line in the markdown text, even if it is physically wrapped across multiple lines in the input image. This ensures that the document flow remains intact and the layout parser does not treat mid-sentence breaks as new elements or paragraphs.
    - **Bullet Point Validation & Merging Rules**:
      1. **Strict Bullet Usage**: A bullet symbol (•) must ONLY be placed at the beginning of a grammatically complete sentence or standalone thought.
      2. **No Fragment Bullets**: Do not place bullet symbols before isolated words, single numbers, page headers, or broken phrase fragments.
      3. **Merge Broken Lines**: If a single sentence is visually broken across multiple lines on the page (due to line wraps or physical layout), you must merge these lines into a single, continuous sentence line in the markdown output, placing only one bullet (•) at the start of that sentence. Never insert new bullet symbols on continuation lines of the same sentence.
      4. **Avoid double bullets**: Do not output lines starting with multiple consecutive bullet symbols (e.g. "- •", "• •", or "* •"). Use only a single bullet character at the start of a list item.

4. **Illegible Words / Bad Handwriting Handling**:
   - If some handwritten words are entirely illegible, fuzzy, or cut-off, mark them inline with: \`==⚠️ High Alert: [illegible word]==\` (or if the surrounding text is Hindi, use: \`==⚠️ High Alert: [अस्पष्ट शब्द]==\`). Add these instances to the 'alerts' array with appropriate context.

5. **Strict Markdown Table Formatting (CRITICAL)**:
   - If the document contains any tables, tabular lists, or column-wise layouts, you MUST convert them into a Markdown Table.
   - **Single-Line Rows**: Every table row MUST be written on a single, continuous physical line in the output. Hitting a newline (\`\n\`) or inserting line breaks inside a row is strictly prohibited.
   - **Cell Line Breaks**: If a cell contains multiple paragraphs, list items, or line breaks, you MUST use HTML \`<br>\` or \`<br><br>\` tags instead of actual newlines.
   - **Row Boundaries**: Every table row must start with a pipe symbol \`|\` and end with a pipe symbol \`|\`.
   - **Header Separator**: You must include a table header separator row (e.g., \`|---|---|---|\`) immediately after the header row.
   - **Example format**:
     | Serial No. | Method | Main Points |
     |---|---|---|
     | 1 | **By Renunciation** | * Point A <br><br> * Point B |
     | 2 | **By Termination** | * Point C <br><br> * Point D |

Please format your response strictly as valid JSON matching the specified responseSchema. Only return the JSON object, do not markdown-wrap the JSON.
    `;

    // Attempt OCR processing using a progressive fallback list of models to avoid 503 Service Unavailable issues
    const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let attempts = 2; // Try each model up to 2 times
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`[OCR Server] Attempting OCR with model: ${modelName} (Attempt ${attempt}/${attempts})`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: [
              filePart,
              { text: promptText }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  markdown: {
                    type: Type.STRING,
                    description: "The complete structured Markdown output of the document matching all language-adaptive and image-skipping spacer requirements."
                  },
                  confidenceEstimate: {
                    type: Type.INTEGER,
                    description: "Estimated OCR accuracy/confidence percentage from 0 to 100."
                  },
                  wordCount: {
                    type: Type.INTEGER,
                    description: "Calculated count of words processed in the document."
                  },
                  alerts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        fragment: {
                          type: Type.STRING,
                          description: "The illegible fragment of text detected."
                        },
                        context: {
                          type: Type.STRING,
                          description: "The sentence or surrounding words where this word was positioned."
                        },
                        reason: {
                          type: Type.STRING,
                          description: "Why this fragment was flagged as illegible/unclear."
                        }
                      },
                      required: ["fragment", "context", "reason"]
                    },
                    description: "Any fuzzy, overlapping, or bad handwriting alerts detected in the document."
                  }
                },
                required: ["markdown", "confidenceEstimate", "wordCount", "alerts"]
              }
            }
          });
          // Break inner loop if successful
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`[OCR Server] Model ${modelName} failed on attempt ${attempt}. Error: ${err.message || err}`);
          if (attempt < attempts) {
            // Wait 1 second before retrying this model
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      if (response) {
        console.log(`[OCR Server] OCR successfully completed using model: ${modelName}`);
        break; // Exit outer loop
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to process document with all available OCR models.");
    }

    const parsedOCRResult = JSON.parse(response.text?.trim() || "{}");
    
    // Post-process the markdown output to guarantee all '---' dividers or triple hyphens are stripped or replaced with clean line breaks or spacing to keep text continuous
    if (parsedOCRResult && typeof parsedOCRResult.markdown === "string") {
      // 1. Replaces line-isolated section break dividers (---) with simple double newlines to make sure they display as a continuous text stream
      parsedOCRResult.markdown = parsedOCRResult.markdown.replace(/^[ \t]*-{3,}[ \t]*$/gm, "\n");
      // 2. Replaces any remaining consecutive hyphens (3 or more) anywhere in the text with empty string or single spaces so they never segment or break documents, except in table lines containing '|'
      parsedOCRResult.markdown = parsedOCRResult.markdown
        .split("\n")
        .map(line => (line.includes("|") ? line : line.replace(/---+/g, " ")))
        .join("\n");

      // 3. Join bullet points and paragraphs that were split across multiple lines
      const lines = parsedOCRResult.markdown.split("\n");
      const joinedLines: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Clean double/triple bullets at the start of the line (e.g. "• • ", "- • ", "• - ")
        line = line.replace(/^(\s*)([•\-\*\u2022\u25CF\u25AA\u25AB]\s*)+/, (match, spaces) => {
          const trimmed = match.trim();
          const firstBullet = trimmed.charAt(0);
          return spaces + firstBullet + " ";
        });

        const trimmedCurrent = line.trim();
        if (!trimmedCurrent) {
          joinedLines.push(line);
          continue;
        }

        const isStartOfBox = trimmedCurrent.startsWith("[box");
        const isEndOfBox = trimmedCurrent.startsWith("[/box]");
        const isChapter = trimmedCurrent.startsWith("[chapter");
        const isTable = trimmedCurrent.startsWith("|");
        const isComment = trimmedCurrent.startsWith("<!--");
        const isHtml = trimmedCurrent.startsWith("<");
        const isHeading = trimmedCurrent.startsWith("#");
        const isQuote = trimmedCurrent.startsWith(">");
        const isPageBreak = trimmedCurrent.startsWith("[pagebreak") || 
                            trimmedCurrent.startsWith("[columnbreak") || 
                            trimmedCurrent.startsWith("[colbreak") || 
                            trimmedCurrent === "[thankyou]" ||
                            trimmedCurrent === "***" ||
                            trimmedCurrent === "* * *" ||
                            trimmedCurrent === "✦ ✦ ✦" ||
                            trimmedCurrent === "---";

        const canHaveContinuation = !isStartOfBox && !isEndOfBox && !isChapter && !isTable && !isComment && !isHtml && !isHeading && !isQuote && !isPageBreak;

        if (canHaveContinuation) {
          while (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const trimmedNext = nextLine.trim();
            if (!trimmedNext) {
              break;
            }

            const isNextHeading = trimmedNext.startsWith("#");
            const isNextBullet = /^\s*(?:[•\u2022\u25CF\u25AA\u25AB➜⭐★]\s*|[-\*]\s+|🔶|🔷|🔸|🔹|♦️|💎|\d+[\.\)]|\(\d+\)|[a-zA-Z][\.\)]|\([a-zA-Z]\)|[ivxIVX]+[\.\)]|\([ivxIVX]+\))/i.test(trimmedNext);
            const isNextQuote = trimmedNext.startsWith(">");
            const isNextBox = trimmedNext.startsWith("[box") || trimmedNext.startsWith("[/box]");
            const isNextChapter = trimmedNext.startsWith("[chapter");
            const isNextPageBreak = trimmedNext.startsWith("[pagebreak") || 
                                    trimmedNext.startsWith("[columnbreak") || 
                                    trimmedNext.startsWith("[colbreak") || 
                                    trimmedNext === "[thankyou]" ||
                                    trimmedNext === "***" ||
                                    trimmedNext === "* * *" ||
                                    trimmedNext === "✦ ✦ ✦" ||
                                    trimmedNext === "---";
            const isNextTable = trimmedNext.startsWith("|");
            const isNextComment = trimmedNext.startsWith("<!--");
            const isNextHtml = trimmedNext.startsWith("<");

            const isNextNewBlock = isNextHeading || isNextBullet || isNextQuote || isNextBox || isNextChapter || isNextPageBreak || isNextTable || isNextComment || isNextHtml;
            if (isNextNewBlock) {
              break;
            }

            const separator = line.endsWith(" ") ? "" : " ";
            line = line + separator + trimmedNext;
            i++;
          }
        }
        joinedLines.push(line);
      }
      parsedOCRResult.markdown = joinedLines.join("\n");
    }

    return res.json(parsedOCRResult);

  } catch (error: any) {
    console.error("OCR API error:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error in OCR processing",
      details: error.stack
    });
  }
});

// Configure Vite middleware or Static files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OCR Server] Server active on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
