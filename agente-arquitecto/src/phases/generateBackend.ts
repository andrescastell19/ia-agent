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

REGLAS GENERALES:
- Genera código base real, completo y compilable sin errores.
- Todos los archivos deben incluir los imports y usings necesarios.
- El código debe ser coherente entre archivos (nombres de clases, namespaces, tipos).

REGLAS PARA .NET / C#:
- Usa SIEMPRE el namespace del proyecto en cada archivo: "namespace ${base.proyecto}"
- Incluye SIEMPRE los usings necesarios en cada archivo:
  * Modelos: sin usings adicionales
  * Repositorios: using Microsoft.EntityFrameworkCore; using ${base.proyecto}.Models; using ${base.proyecto}.Data;
  * Servicios: using ${base.proyecto}.Models; using ${base.proyecto}.Repositories;
  * Controladores: using Microsoft.AspNetCore.Mvc; using ${base.proyecto}.Services; using ${base.proyecto}.Models;
- Los repositorios deben inyectar AppDbContext, NO DbContext genérico.
- AppDbContext se encuentra en el namespace ${base.proyecto}.Data
- Cada clase debe tener su namespace declarado explícitamente.
- NO uses top-level statements en clases que no sean Program.cs.
- Los controladores deben heredar de ControllerBase y tener [ApiController] y [Route].

REGLAS PARA Node.js:
- Usa Express con TypeScript.
- Incluye imports de módulos en cada archivo.
- Usa better-sqlite3 para la base de datos.

REGLAS PARA Python:
- Usa FastAPI con imports explícitos en cada archivo.
- Incluye from __future__ import annotations donde sea necesario.

REGLAS PARA Java:
- Incluye los imports de Spring Boot en cada archivo.
- Usa anotaciones @RestController, @Service, @Repository.
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