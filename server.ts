import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Goal Refinement API
  app.post("/api/compiler/refine", async (req, res) => {
    try {
      const { goal, ncg } = req.body;
      
      const response = await ai.models.generateContent({
        model: req.body.model || "gemini-3.5-flash",
        contents: `You are an expert systems analyst. A user has provided an operational goal for an API-driven workflow.
        
        API Capabilities (NCG): ${JSON.stringify(ncg.entities.map((e: any) => ({ 
          id: e.id,
          name: e.name, 
          actions: ncg.actions.filter((a: any) => a.targetEntity === e.id).map((a: any) => a.name) 
        })))}

        User Goal: ${goal}

        Analyze the goal for ambiguities and missing details relative to the API. 
        Output:
        1. 3-5 clarifying questions to resolve ambiguities.
        2. A set of specific ambiguities identified.
        3. A suggested, more professional and comprehensive goal description that incorporates common best practices for this type of task.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clarifyingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              ambiguities: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedGoal: { type: Type.STRING },
            },
            required: ["clarifyingQuestions", "ambiguities", "suggestedGoal"],
          },
        },
      });

      const text = response.text || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(cleaned));
    } catch (error: any) {
      console.error("Refinement error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Intent Compiler API
  app.post("/api/compiler/intent", async (req, res) => {
    try {
      const { goal, ncg } = req.body;
      
      const response = await ai.models.generateContent({
        model: req.body.model || "gemini-3.5-flash",
        contents: `You are a precise intent compiler. Analyze the user goal relative to the API Capability Graph (NCG).
        Goal: ${goal}
        NCG Summary: ${JSON.stringify(ncg.entities.map((e: any) => ({ 
          id: e.id, 
          name: e.name, 
          actions: ncg.actions.filter((a: any) => a.targetEntity === e.id).map((a: any) => ({
            id: a.id,
            name: a.name,
            parameters: a.endpoint?.parameters || []
          }))
        })))}
        
        Extract a structured intent graph. 
        CRITICAL Rules:
        1. The "entities" and "actions" arrays MUST ONLY contain IDs that exist in the NCG provided above. Do not invent new IDs.
        2. Identify which action parameters (from the parameters lists provided in NCG actions above) are relevant to satisfy the user goal. For each identified parameter, suggest a logical "suggestedValue" based on the user's operational goal and provide a clear, concise "description" justifying this choice. Ensure to output a flat list of parameter suggestions in the "parameters" field.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              goal: { type: Type.STRING },
              entities: { type: Type.ARRAY, items: { type: Type.STRING } },
              actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
              parameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    actionId: { type: Type.STRING },
                    paramName: { type: Type.STRING },
                    in: { type: Type.STRING },
                    suggestedValue: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["actionId", "paramName", "in", "suggestedValue", "description"]
                }
              }
            },
            required: ["goal", "entities", "actions", "constraints", "parameters"],
          },
        },
      });

      const text = response.text || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(cleaned));
    } catch (error: any) {
      console.error("Intent compilation error:", error);
      if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({ error: "Gemini API Quota Exceeded. Please wait a few seconds or check your API key billings. (Try Gemini 3.5 Flash fallback)" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
