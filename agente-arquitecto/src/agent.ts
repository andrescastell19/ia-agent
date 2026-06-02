import { Ollama } from "@langchain/ollama";
import * as path from "path";
import * as fs from "fs";
import { readFicheroBase, writeJson } from "./utils/fileWriter";
import { generateFrontend } from "./phases/generateFrontend";
import { generateBackend } from "./phases/generateBackend";
import { generateInfra } from "./phases/generateInfra";
import { generateMaestro } from "./phases/generateMaestro";
import { FicheroBase } from "./types";

const llm = new Ollama({
  model: "deepseek-coder-v2",
  temperature: 0.2,
  numCtx: 8192,
});
// Ruta al output del Agente 1
const AGENTE1_OUTPUT = path.resolve(
  __dirname,
  "../../agente-analista/output"
);

export async function runAgent(): Promise<void> {
  console.log("\n🏗️  Agente Arquitecto iniciado\n");

  // PASO 1: Leer fichero_base.json más reciente del Agente 1
  const resultado = readFicheroBase(AGENTE1_OUTPUT);

  if (!resultado) {
    console.log("❌ No se encontró ningún fichero_base.json en:");
    console.log(`   ${AGENTE1_OUTPUT}`);
    console.log("\n   Ejecuta primero el Agente 1 para generar el fichero base.\n");
    return;
  }

  const { fichero, ruta } = resultado;
  console.log(`📂 Fichero base encontrado: ${path.basename(ruta)}`);
  console.log(`📋 Proyecto: ${fichero.proyecto}`);
  console.log(`🛠️  Stack: ${fichero.stack.frontend} + ${fichero.stack.backend} + ${fichero.stack.base_de_datos}`);
  if (fichero.decision_tecnica) {
    console.log(`🏗️  Arquitectura: ${fichero.decision_tecnica.arquitectura}`);
    console.log(`📦 Infraestructura: ${fichero.decision_tecnica.infraestructura.join(", ")}`);
  }
  console.log();

  // PASO 2: Generar cada capa en paralelo con feedback
  console.log("⏳ Generando estructura frontend...");
  const frontend = await generateFrontend(llm, fichero);
  console.log(`   ✅ Frontend: ${frontend.estructura.length} archivos/carpetas`);

  console.log("⏳ Generando estructura backend...");
  const backend = await generateBackend(llm, fichero);
  console.log(`   ✅ Backend: ${backend.estructura.length} archivos/carpetas`);

  console.log("⏳ Generando configuración de infraestructura...");
  const infra = await generateInfra(llm, fichero);
  console.log(`   ✅ Infraestructura: Docker + ${infra.ci_cd?.plataforma ?? "sin CI/CD"}`);

  console.log("⏳ Generando fichero maestro...");
  const maestro = generateMaestro(fichero);
  console.log(`   ✅ Maestro generado`);

  // PASO 3: Escribir ficheros de salida
  const carpeta = fichero.proyecto;
  const paths = {
    maestro: writeJson(carpeta, "maestro", maestro),
    frontend: writeJson(carpeta, "frontend", frontend),
    backend: writeJson(carpeta, "backend", backend),
    infra: writeJson(carpeta, "infra", infra),
  };

  console.log("\n✅ Ficheros generados:");
  Object.entries(paths).forEach(([capa, ruta]) => {
    console.log(`   📄 ${capa}: ${ruta}`);
  });
  console.log();
}