import { Ollama } from "@langchain/ollama";
import { DecisionTecnica, Modulo } from "../types";
import { PROPOSE_ARCHITECTURE_PROMPT } from "../prompts";

export async function proposeArchitecture(
    llm: Ollama,
    requerimiento: string,
    modulos: Modulo[]
): Promise<DecisionTecnica> {
    const contexto = `
Requerimiento original: ${requerimiento}
Módulos del proyecto: ${modulos.map((m) => m.nombre).join(", ")}
  `;

    const response = await llm.invoke([
        { role: "system", content: PROPOSE_ARCHITECTURE_PROMPT },
        { role: "user", content: contexto },
    ]);

    try {
        const clean = response.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
    } catch {
        return {
            arquitectura: "monolito",
            arquitectura_justificacion: "Arquitectura por defecto para proyectos nuevos.",
            infraestructura: ["docker"],
            infraestructura_justificacion: "Docker facilita el despliegue del proyecto.",
            patrones: ["repository"],
            patrones_justificacion: "El patrón Repository desacopla la lógica de negocio del acceso a datos.",
            sugerido_por_agente: true,
        };
    }
}