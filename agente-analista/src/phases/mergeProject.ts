import { Ollama } from "@langchain/ollama";
import { ProjectData, Modulo, Entidad, DecisionTecnica } from "../types";

const DETECT_CHANGES_PROMPT = `
Eres un analista de software. Tienes un proyecto existente y un nuevo requerimiento del usuario.
Tu tarea es identificar exactamente qué cambios quiere hacer el usuario.

Responde ÚNICAMENTE con un JSON sin texto adicional:
{
  "tipo_cambio": ["nuevos_modulos", "modificar_modulos", "cambiar_decisiones_tecnicas"],
  "modulos_nuevos": [
    {
      "nombre": "NombreModulo",
      "descripcion": "qué hace este módulo",
      "operaciones": ["crear", "leer", "actualizar", "eliminar", "listar"],
      "entidad_principal": "NombreEntidad"
    }
  ],
  "modulos_modificados": [
    {
      "nombre": "NombreModuloExistente",
      "cambios": "descripción de los cambios"
    }
  ],
  "entidades_nuevas": [
    {
      "nombre": "NombreEntidad",
      "descripcion": "qué representa",
      "campos": [
        {
          "nombre": "nombre_campo",
          "tipo": "texto",
          "requerido": true,
          "descripcion": "descripción"
        }
      ]
    }
  ],
  "entidades_modificadas": [
    {
      "nombre": "NombreEntidadExistente",
      "campos_nuevos": [
        {
          "nombre": "nombre_campo",
          "tipo": "texto",
          "requerido": true,
          "descripcion": "descripción"
        }
      ]
    }
  ],
  "cambios_tecnicos": {
    "arquitectura": null,
    "infraestructura_agregar": [],
    "patrones_agregar": []
  }
}

Si no hay cambios de un tipo, usa arrays vacíos o null según corresponda.
Tipos de campo válidos: texto, numero, fecha, booleano, email.
`;

export async function mergeProject(
    llm: Ollama,
    proyectoExistente: ProjectData,
    nuevoRequerimiento: string
): Promise<ProjectData> {
    const contexto = `
Proyecto existente:
${JSON.stringify(proyectoExistente, null, 2)}

Nuevo requerimiento del usuario:
${nuevoRequerimiento}
  `;

    const response = await llm.invoke([
        { role: "system", content: DETECT_CHANGES_PROMPT },
        { role: "user", content: contexto },
    ]);

    try {
        const clean = response.replace(/```json|```/g, "").trim();
        const cambios = JSON.parse(clean);

        // Clonar proyecto existente
        const proyectoActualizado: ProjectData = JSON.parse(
            JSON.stringify(proyectoExistente)
        );

        // 1. Añadir módulos nuevos
        if (cambios.modulos_nuevos?.length > 0) {
            proyectoActualizado.modulos = [
                ...proyectoActualizado.modulos,
                ...cambios.modulos_nuevos,
            ];
        }

        // 2. Modificar módulos existentes (actualizar descripción)
        if (cambios.modulos_modificados?.length > 0) {
            for (const mod of cambios.modulos_modificados) {
                const idx = proyectoActualizado.modulos.findIndex(
                    (m) => m.nombre.toLowerCase() === mod.nombre.toLowerCase()
                );
                if (idx !== -1) {
                    proyectoActualizado.modulos[idx].descripcion += ` | Actualizado: ${mod.cambios}`;
                }
            }
        }

        // 3. Añadir entidades nuevas
        if (cambios.entidades_nuevas?.length > 0) {
            proyectoActualizado.entidades = [
                ...proyectoActualizado.entidades,
                ...cambios.entidades_nuevas,
            ];
        }

        // 4. Modificar entidades existentes (añadir campos)
        if (cambios.entidades_modificadas?.length > 0) {
            for (const entMod of cambios.entidades_modificadas) {
                const idx = proyectoActualizado.entidades.findIndex(
                    (e) => e.nombre.toLowerCase() === entMod.nombre.toLowerCase()
                );
                if (idx !== -1 && entMod.campos_nuevos?.length > 0) {
                    proyectoActualizado.entidades[idx].campos = [
                        ...proyectoActualizado.entidades[idx].campos,
                        ...entMod.campos_nuevos,
                    ];
                }
            }
        }

        // 5. Cambios técnicos
        if (cambios.cambios_tecnicos && proyectoActualizado.decision_tecnica) {
            if (cambios.cambios_tecnicos.arquitectura) {
                proyectoActualizado.decision_tecnica.arquitectura =
                    cambios.cambios_tecnicos.arquitectura;
            }
            if (cambios.cambios_tecnicos.infraestructura_agregar?.length > 0) {
                proyectoActualizado.decision_tecnica.infraestructura = [
                    ...new Set([
                        ...proyectoActualizado.decision_tecnica.infraestructura,
                        ...cambios.cambios_tecnicos.infraestructura_agregar,
                    ]),
                ] as any;
            }
            if (cambios.cambios_tecnicos.patrones_agregar?.length > 0) {
                proyectoActualizado.decision_tecnica.patrones = [
                    ...new Set([
                        ...proyectoActualizado.decision_tecnica.patrones,
                        ...cambios.cambios_tecnicos.patrones_agregar,
                    ]),
                ] as any;
            }
        }

        // Actualizar fecha
        proyectoActualizado.fecha = new Date().toISOString().split("T")[0];

        return proyectoActualizado;
    } catch {
        return proyectoExistente;
    }
}