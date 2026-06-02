import { Ollama } from "@langchain/ollama";
import { DecisionTecnica, Modulo } from "../types";

const PROPOSE_ARCHITECTURE_PROMPT = `
Eres un arquitecto de software senior. Analiza el requerimiento técnico del usuario.

El usuario puede haber mencionado explícitamente una arquitectura, infraestructura 
o patrones de diseño, o puede no haber mencionado nada.

Tu trabajo es:
1. Si el usuario los mencionó → respétalos y valídalos
2. Si el usuario NO los mencionó → propone los más adecuados para el proyecto

Opciones válidas:
- arquitectura: monolito, microservicios, hexagonal, mvc, event-driven
- infraestructura: docker, docker-compose, kubernetes, github-actions, gitlab-ci, ninguna
- patrones: repository, cqrs, factory, singleton, observer, ninguno

Responde ÚNICAMENTE con un JSON sin texto adicional:
{
  "arquitectura": "...",
  "arquitectura_justificacion": "por qué esta arquitectura es la más adecuada",
  "infraestructura": ["..."],
  "infraestructura_justificacion": "por qué estas herramientas",
  "patrones": ["..."],
  "patrones_justificacion": "por qué estos patrones",
  "sugerido_por_agente": true o false
}

sugerido_por_agente es false si el usuario mencionó explícitamente 
alguna de estas decisiones, true si el agente las propone por cuenta propia.
`;

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