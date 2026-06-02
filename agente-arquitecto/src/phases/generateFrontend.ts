import { Ollama } from "@langchain/ollama";
import { FicheroBase, FrontendOutput } from "../types";

function buildPrompt(base: FicheroBase): string {
  const arquitectura = base.decision_tecnica?.arquitectura ?? "monolito";
  const patrones = base.decision_tecnica?.patrones ?? [];

  return `
Eres un arquitecto frontend senior. Genera la estructura completa de un proyecto frontend.

Framework: ${base.stack.frontend}
Arquitectura: ${arquitectura}
Patrones: ${patrones.join(", ") || "ninguno"}
Módulos: ${base.modulos.map((m) => m.nombre).join(", ")}
Entidades: ${base.entidades.map((e) => e.nombre).join(", ")}

Responde ÚNICAMENTE con un JSON sin texto adicional con este formato:
{
  "framework": "${base.stack.frontend}",
  "estructura": [
    { "ruta": "ruta/del/archivo", "tipo": "archivo|carpeta|modulo", "descripcion": "qué es" }
  ],
  "dependencias": {
    "produccion": ["dep1", "dep2"],
    "desarrollo": ["dep1", "dep2"]
  },
  "codigo_base": [
    {
      "archivo": "ruta/del/archivo",
      "contenido": "código base del archivo"
    }
  ]
}

Reglas:
- Genera código base real y funcional para modelos, servicios y componentes principales.
- Incluye rutas, módulos y componentes para cada módulo del proyecto.
- Para Angular: usa standalone components, HttpClient, y reactive forms.
- Para React: usa hooks, axios y react-router-dom.
- Para Vue: usa composition API y vue-router.
- El código debe reflejar las entidades y sus campos reales.
- Incluye como mínimo: modelo de datos, servicio HTTP, componente de lista y componente de formulario por cada módulo.
`;
}

export async function generateFrontend(
  llm: Ollama,
  base: FicheroBase
): Promise<FrontendOutput> {
  const response = await llm.invoke([
    { role: "system", content: buildPrompt(base) },
    {
      role: "user",
      content: `Genera la estructura frontend completa para: ${base.proyecto}`,
    },
  ]);

  try {
    const clean = response.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      framework: base.stack.frontend,
      estructura: [],
      dependencias: { produccion: [], desarrollo: [] },
      codigo_base: [],
    };
  }
}