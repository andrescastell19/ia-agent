import { FicheroBase, MaestroOutput } from "../types";

export function generateMaestro(base: FicheroBase): MaestroOutput {
  return {
    proyecto: base.proyecto,
    version: "1.0.0",
    stack: base.stack,
    arquitectura: base.decision_tecnica?.arquitectura ?? "monolito",
    infraestructura: base.decision_tecnica?.infraestructura ?? [],
    patrones: base.decision_tecnica?.patrones ?? [],
    capas: ["frontend", "backend", "infra"],
    fecha: new Date().toISOString().split("T")[0],
  };
}