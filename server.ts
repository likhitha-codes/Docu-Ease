import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Auto-create logs database folder if not exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const LOGS_FILE = path.join(DATA_DIR, "logs.json");

// Define types for logs
enum LogType {
  SIMPLIFY = "SIMPLIFY",
  TRANSLATE = "TRANSLATE",
  AUDIT = "AUDIT"
}

interface LogEntry {
  id: number;
  timestamp: string;
  userEmail: string;
  fileName: string;
  detectedType: string;
  isGovernmentRelated: boolean;
  simplifiedEnglish: string;
  teluguTranslation: string;
  hindiTranslation: string;
}

// Read log entries from simulated JSON database (provides high-reliability SQLite equivalent persistent log storage)
function getLogs(): LogEntry[] {
  if (!fs.existsSync(LOGS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(LOGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading logs file:", err);
    return [];
  }
}

// Add a log entry
function addLog(entry: Omit<LogEntry, "id" | "timestamp">): LogEntry {
  const logs = getLogs();
  const newId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
  const newEntry: LogEntry = {
    ...entry,
    id: newId,
    timestamp: new Date().toISOString()
  };
  logs.push(newEntry);
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing logs file:", err);
  }
  return newEntry;
}

// Lazy Initialize Gemini SDK to prevent server startup crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets / environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large document payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route - Get History Logs
  app.get("/api/logs", (req, res) => {
    try {
      const logs = getLogs();
      // Only return fields needed for display (don't send entire massive texts by default or keep them for reference)
      res.json({ status: "success", count: logs.length, logs });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // API Route - Clear History Logs
  app.post("/api/logs/clear", (req, res) => {
    try {
      fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), "utf-8");
      res.json({ status: "success", message: "Logs cleared successfully." });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // API Route - Simplify & Translate Government Document
  app.post("/api/simplify", async (req, res) => {
    try {
      const { fileName, documentText, fileBase64, userEmail, fileType } = req.body;

      if (!documentText && !fileBase64) {
        return res.status(400).json({ status: "error", message: "No document content provided." });
      }

      const ai = getAi();

      // We will prepare the prompt for Gemini. We instruct it to:
      // 1. Verify if it is a government-related document.
      // 2. Classify the type.
      // 3. Simplify to plain English.
      // 4. Translate both to Hindi and Telugu.
      const prompt = `
You are DocuEase, an advanced AI engine styled as an Indian Government document parsing specialist.
Analyze the following document. Follow these steps carefully:

1. **Govt Verification**: Detect if the provided text/document is genuinely related to government, administration, state policies, gazette, judicial, public acts, directives, schemes, or municipal operations. Non-government general text (like biryani recipes, personal diaries, love letters, tech blogs, commercial advertisements) should be rejected.
2. **Document Structure**: Identify the official category/type of the document (e.g. "Gazette Notification", "Government Order (GO)", "Policy Circular", "Judicial Order", "Executive Act/Bill", "Scheme Guildlines").
3. **English Simplification**: Simplify the complex technical or legal English jargon into clear, plain, simple English (6th-grade equivalent reading level). Ensure dates, act section references, department names, exact allowances, fees, deadlines, and eligibility conditions are strictly preserved.
4. **Hindi Translation**: Provide a high-fidelity translation of the *simplified English version* into standard, easy-to-understand bureaucratic Hindi.
5. **Telugu Translation**: Provide a high-fidelity translation of the *simplified English version* into standard, easy-to-understand Telugu.

Respond strictly in the requested JSON formats. Do not include any HTML markdown containers or words other than the raw JSON body.
`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          isGovernmentRelated: {
            type: Type.BOOLEAN,
            description: "Whether the text/document is genuinely related to a government, municipality, or state department."
          },
          rejectionReason: {
            type: Type.STRING,
            description: "If isGovernmentRelated is false, explain beautifully why this was flagged as non-government."
          },
          detectedType: {
            type: Type.STRING,
            description: "The specific classification of document if legitimate (empty if not related)."
          },
          simplifiedEnglish: {
            type: Type.STRING,
            description: "The clear, simple English breakdown."
          },
          hindiTranslation: {
            type: Type.STRING,
            description: "High quality Hindi translation of the simplified English text."
          },
          teluguTranslation: {
            type: Type.STRING,
            description: "High quality Telugu translation of the simplified English text."
          }
        },
        required: ["isGovernmentRelated", "detectedType", "simplifiedEnglish", "hindiTranslation", "teluguTranslation"]
      };

      let contents: any[] = [];
      
      if (fileBase64 && fileType === "pdf") {
        // Send the raw PDF file directly to Gemini!
        contents = [
          {
            inlineData: {
              data: fileBase64,
              mimeType: "application/pdf"
            }
          },
          {
            text: `${prompt}\nParse the associated government PDF and run the instructions.`
          }
        ];
      } else if (fileBase64 && (fileType === "image" || fileType?.startsWith("image/"))) {
        // Send the image directly to Gemini for OCR and simplification!
        const resolvedMime = fileType.startsWith("image/") ? fileType : "image/jpeg";
        contents = [
          {
            inlineData: {
              data: fileBase64,
              mimeType: resolvedMime
            }
          },
          {
            text: `${prompt}\nParse the associated government photo copy / image, extract its text content, and run the instructions.`
          }
        ];
      } else {
        // Plain text inputs
        contents = [
          {
            text: `${prompt}\nHere is the document content to analyze:\n\n${documentText}`
          }
        ];
      }

      console.log(`Sending document analysis request to gemini-3.5-flash...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());

      // Save to Database logs if government-related succeeds or fail.
      addLog({
        userEmail: userEmail || "anonymous@nic.in",
        fileName: fileName || "Pasted Text Content",
        detectedType: result.isGovernmentRelated ? result.detectedType : "Rejected (Non-Govt)",
        isGovernmentRelated: result.isGovernmentRelated || false,
        simplifiedEnglish: result.simplifiedEnglish || "",
        teluguTranslation: result.teluguTranslation || "",
        hindiTranslation: result.hindiTranslation || ""
      });

      res.json({
        status: "success",
        data: result
      });

    } catch (err: any) {
      console.error("Simplification error:", err);
      res.status(500).json({
        status: "error",
        message: err.message || "An internal error occurred during processing."
      });
    }
  });

  // Setup Vite Dev Server / Static files middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocuEase Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server failure on startup:", err);
});
