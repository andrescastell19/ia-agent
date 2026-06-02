import { Ollama } from "@langchain/ollama";

const VALIDATE_REQUIREMENT_PROMPT = `
Eres un analista de software. Tu tarea es evaluar si un requerimiento 
de usuario contiene suficiente información FUNCIONAL para poder diseñar 
un sistema de software.

Un requerimiento es SUFICIENTE si menciona al menos:
- Qué hace el sistema (su propósito o dominio)
- Qué información maneja o gestiona

Un requerimiento es INSUFICIENTE si solo menciona:
- Tecnologías, frameworks o herramientas
- Características técnicas (responsive, microservicios, docker)
- Preferencias de arquitectura
- Sin mencionar el propósito real del sistema

Ejemplos INSUFICIENTES:
- "quiero un proyecto con React y Node.js"
- "quiero una app responsive con microservicios"
- "quiero un backend en Python con Docker"

Ejemplos SUFICIENTES:
- "quiero registrar las mascotas de una veterinaria"
- "quiero una tienda online para vender ropa"
- "quiero gestionar los empleados de mi empresa"

Responde ÚNICAMENTE con un JSON sin texto adicional:
{
  "es_suficiente": true o false,
  "razon": "explicación breve de por qué es suficiente o no",
  "preguntas": ["pregunta1", "pregunta2"] 
}

El campo "preguntas" solo se incluye cuando es_suficiente es false.
Incluye máximo 3 preguntas concretas para obtener la información funcional faltante.
`;

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