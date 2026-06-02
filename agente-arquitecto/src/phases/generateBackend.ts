import { Ollama } from "@langchain/ollama";
import { FicheroBase, BackendOutput } from "../types";

function buildPrompt(base: FicheroBase): string {
  const arquitectura = base.decision_tecnica?.arquitectura ?? "monolito";
  const patrones = base.decision_tecnica?.patrones ?? [];

  const entidadesDetalle = base.entidades
    .map(
      (e) =>
        `${e.nombre}: ${e.campos.map((c) => `${c.nombre}(${c.tipo}${c.requerido ? ", requerido" : ""})`).join(", ")}`
    )
    .join("\n");

  return `
Eres un arquitecto backend senior. Genera la estructura completa de un proyecto backend.

Framework: ${base.stack.backend}
Base de datos: ${base.stack.base_de_datos}
Arquitectura: ${arquitectura}
Patrones: ${patrones.join(", ") || "ninguno"}
Módulos: ${base.modulos.map((m) => `${m.nombre} (operaciones: ${m.operaciones.join(", ")})`).join("\n")}
Entidades y campos:
${entidadesDetalle}

Responde ÚNICAMENTE con un JSON sin texto adicional con este formato:
{
  "framework": "${base.stack.backend}",
  "arquitectura": "${arquitectura}",
  "estructura": [
    { "ruta": "ruta/del/archivo", "tipo": "archivo|carpeta", "descripcion": "qué es" }
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
- Genera código base real y funcional.
- Para nodejs: usa Express, better-sqlite3, y TypeScript.
- Para python: usa FastAPI o Django REST Framework con SQLite.
- Para dotnet: usa ASP.NET Core minimal API.
- Para java: usa Spring Boot.
- Si la arquitectura es hexagonal: separa domain, application, infrastructure.
- Si es microservicios: crea una carpeta por servicio.
- Si es MVC: separa models, controllers, routes.
- Incluye: modelo/entidad, repositorio, caso de uso o servicio, controlador y rutas por cada módulo.
- Incluye configuración de base de datos SQLite.
- Los campos de las entidades deben estar en el código generado.
`;
}

export async function generateBackend(
  llm: Ollama,
  base: FicheroBase
): Promise<BackendOutput> {
  const response = await llm.invoke([
    { role: "system", content: buildPrompt(base) },
    {
      role: "user",
      content: `Genera la estructura backend completa para: ${base.proyecto}`,
    },
  ]);

  try {
    const clean = response.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      framework: base.stack.backend,
      arquitectura: base.decision_tecnica?.arquitectura ?? "monolito",
      estructura: [],
      dependencias: { produccion: [], desarrollo: [] },
      codigo_base: [],
    };
  }
}