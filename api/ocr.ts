import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Lazy load Gemini client to prevent crashing if the key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in Environment Variables in the Vercel Dashboard.");
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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<any> {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

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

4. **Illegible Words / Bad Handwriting Handling**:
   - If some handwritten words are entirely illegible, fuzzy, or cut-off, mark them inline with: \`==⚠️ High Alert: [illegible word]==\` (or if the surrounding text is Hindi, use: \`==⚠️ High Alert: [अस्पष्ट शब्द]==\`). Add these instances to the 'alerts' array with appropriate context.

Please format your response strictly as valid JSON matching the specified responseSchema. Only return the JSON object, do not markdown-wrap the JSON.
    `;

    // Visually rich OCR using gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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

    const parsedOCRResult = JSON.parse(response.text?.trim() || "{}");
    
    // Post-process response
    if (parsedOCRResult && typeof parsedOCRResult.markdown === "string") {
      parsedOCRResult.markdown = parsedOCRResult.markdown.replace(/^[ \t]*-{3,}[ \t]*$/gm, "\n");
      parsedOCRResult.markdown = parsedOCRResult.markdown.replace(/---+/g, " ");
    }

    return res.status(200).json(parsedOCRResult);

  } catch (error: any) {
    console.error("Vercel OCR API error:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error in OCR processing",
      details: error.stack
    });
  }
}
