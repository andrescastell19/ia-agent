import { Ollama } from "@langchain/ollama";
import * as fs from "fs";
import * as path from "path";
import { DETECT_INTENT_PROMPT } from "../prompts";

export type Intent = "nuevo_proyecto" | "modificar_proyecto";

export interface IntentResult {
    intent: Intent;
    nombre_proyecto: string | null;
}

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