import { Ollama } from "@langchain/ollama";
import { ANALYZE_REQUIREMENT_PROMPT } from "../prompts";
import { Modulo, Entidad } from "../types";

export async function analyzeRequirement(
  llm: Ollama,
  userMessage: string
): Promise<{ proyecto: string; descripcion: string; modulos: Modulo[]; entidades: Entidad[] }> {
  const response = await llm.invoke([
    { role: "system", content: ANALYZE_REQUIREMENT_PROMPT },
    { role: "user", content: userMessage },
  ]);

  try {
    const clean = response.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      proyecto: "ProyectoSinNombre",
      descripcion: userMessage,
      modulos: [
        {
          nombre: "ModuloPrincipal",
          descripcion: "Módulo principal del sistema",
          operaciones: ["crear", "leer", "actualizar", "eliminar", "listar"],
          entidad_principal: "Entidad",
        },
      ],
      entidades: [
        {
          nombre: "Entidad",
          descripcion: "Entidad principal",
          campos: [
            { nombre: "nombre", tipo: "texto", requerido: true, descripcion: "Nombre" },
          ],
        },
      ],
    };
  }
}