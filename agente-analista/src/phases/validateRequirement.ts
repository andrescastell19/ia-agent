import { Ollama } from "@langchain/ollama";
import { VALIDATE_REQUIREMENT_PROMPT } from "../prompts";

export async function validateRequirement(
    llm: Ollama,
    requerimiento: string
): Promise<{ esSuficiente: boolean; razon: string; preguntas: string[] }> {
    const response = await llm.invoke([
        { role: "system", content: VALIDATE_REQUIREMENT_PROMPT },
        { role: "user", content: requerimiento },
    ]);

    try {
        const clean = response.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        return {
            esSuficiente: parsed.es_suficiente,
            razon: parsed.razon,
            preguntas: parsed.preguntas || [],
        };
    } catch {
        return {
            esSuficiente: false,
            razon: "No se pudo evaluar el requerimiento.",
            preguntas: ["¿Cuál es el propósito principal del sistema?"],
        };
    }
}