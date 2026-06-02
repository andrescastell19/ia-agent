import { Ollama } from "@langchain/ollama";
import * as fs from "fs";
import * as path from "path";

export type Intent = "nuevo_proyecto" | "modificar_proyecto";

export interface IntentResult {
    intent: Intent;
    nombre_proyecto: string | null;
}

const DETECT_INTENT_PROMPT = `
Eres un asistente que analiza el mensaje de un usuario para determinar 
si quiere crear un proyecto nuevo o modificar uno existente.

El usuario menciona un proyecto existente cuando usa frases como:
- "quiero añadir al proyecto X"
- "al proyecto X agrégale..."  
- "modifica el proyecto X"
- "en el proyecto X quiero incluir"
- "el proyecto X necesita"

Responde ÚNICAMENTE con un JSON sin texto adicional:
{
  "intent": "nuevo_proyecto" o "modificar_proyecto",
  "nombre_proyecto": "nombre exacto del proyecto mencionado o null"
}
`;

export async function detectIntent(
    llm: Ollama,
    requerimiento: string
): Promise<IntentResult> {
    const response = await llm.invoke([
        { role: "system", content: DETECT_INTENT_PROMPT },
        { role: "user", content: requerimiento },
    ]);

    try {
        const clean = response.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
    } catch {
        return { intent: "nuevo_proyecto", nombre_proyecto: null };
    }
}

export function findExistingProject(nombreProyecto: string): string | null {
    const outputDir = path.resolve("output");

    if (!fs.existsSync(outputDir)) return null;

    const files = fs.readdirSync(outputDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
        const filePath = path.join(outputDir, file);
        try {
            const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            if (
                content.proyecto?.toLowerCase() === nombreProyecto.toLowerCase()
            ) {
                return filePath;
            }
        } catch {
            continue;
        }
    }

    return null;
}