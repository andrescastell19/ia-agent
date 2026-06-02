import { Ollama } from "@langchain/ollama";
import inquirer from "inquirer";
import { validateRequirement } from "./phases/validateRequirement";
import { detectProfile } from "./phases/detectProfile";
import { analyzeRequirement } from "./phases/analyzeRequirement";
import { proposeStack } from "./phases/proposeStack";
import { proposeArchitecture } from "./phases/proposeArchitecture";
import { generateFile } from "./phases/generateFile";
import { detectIntent, findExistingProject } from "./phases/detectIntent";
import { mergeProject } from "./phases/mergeProject";
import * as fs from "fs";
import { ProjectData, Stack, DecisionTecnica, Modulo, Entidad } from "./types";

const llm = new Ollama({
  model: "qwen2.5:14b",
  temperature: 0.3,
});

function printDecisionTecnica(d: DecisionTecnica) {
  console.log(`\n🏗️  Decisiones técnicas${d.sugerido_por_agente ? " (sugeridas por el agente)" : " (basadas en tu requerimiento)"}:`);
  console.log(`   Arquitectura:    ${d.arquitectura}`);
  console.log(`   💬 ${d.arquitectura_justificacion}`);
  console.log(`   Infraestructura: ${d.infraestructura.join(", ")}`);
  console.log(`   💬 ${d.infraestructura_justificacion}`);
  console.log(`   Patrones:        ${d.patrones.join(", ")}`);
  console.log(`   💬 ${d.patrones_justificacion}\n`);
}

export async function runAgent(): Promise<void> {
  console.log("\n🤖 Agente Analista iniciado\n");

  // FASE 1: Obtener requerimiento e identificar intención
  const { requerimientoInicial } = await inquirer.prompt([
    {
      type: "input",
      name: "requerimientoInicial",
      message: "Describe tu proyecto o el cambio que deseas hacer:",
    },
  ]);

  console.log("\n⏳ Evaluando el requerimiento...\n");
  const intentResult = await detectIntent(llm, requerimientoInicial);

  // ─────────────────────────────────────────────
  // FLUJO A: Modificar proyecto existente
  // ─────────────────────────────────────────────
  if (intentResult.intent === "modificar_proyecto" && intentResult.nombre_proyecto) {
    const proyectoPath = findExistingProject(intentResult.nombre_proyecto);
    let proyectoExistente: ProjectData | null = null;

    if (proyectoPath) {
      proyectoExistente = JSON.parse(fs.readFileSync(proyectoPath, "utf-8"));
    } else {
      const files = fs.readdirSync("output").filter((f) => f.endsWith(".json"));
      const proyectosDisponibles = files
        .map((f) => {
          try {
            const content = JSON.parse(fs.readFileSync(`output/${f}`, "utf-8"));
            return { nombre: content.proyecto, archivo: `output/${f}` };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as { nombre: string; archivo: string }[];

      if (proyectosDisponibles.length === 0) {
        console.log(`⚠️  No encontré proyectos existentes en output/.\n`);
        return;
      }

      console.log(`⚠️  No encontré un proyecto llamado "${intentResult.nombre_proyecto}".\n`);

      const { proyectoSeleccionado } = await inquirer.prompt([
        {
          type: "select",
          name: "proyectoSeleccionado",
          message: "¿A cuál de estos proyectos deseas aplicar los cambios?",
          choices: [
            ...proyectosDisponibles.map((p) => p.nombre),
            "Ninguno, cancelar",
          ],
        },
      ]);

      if (proyectoSeleccionado === "Ninguno, cancelar") {
        console.log("\n❌ Operación cancelada.\n");
        return;
      }

      const proyectoEncontrado = proyectosDisponibles.find(
        (p) => p.nombre === proyectoSeleccionado
      );

      if (proyectoEncontrado) {
        proyectoExistente = JSON.parse(
          fs.readFileSync(proyectoEncontrado.archivo, "utf-8")
        );
      }
    }

    if (!proyectoExistente) {
      console.log("❌ No se pudo cargar el proyecto. Operación cancelada.\n");
      return;
    }

    console.log(`📂 Proyecto encontrado: ${proyectoExistente.proyecto}`);
    console.log(`   Módulos actuales: ${proyectoExistente.modulos.map((m: Modulo) => m.nombre).join(", ")}\n`);
    console.log("⏳ Procesando los cambios solicitados...\n");

    const proyectoActualizado = await mergeProject(
      llm,
      proyectoExistente,
      requerimientoInicial
    );

    const modulosNuevos = proyectoActualizado.modulos.filter(
      (m: Modulo) => !proyectoExistente!.modulos.find((e: Modulo) => e.nombre === m.nombre)
    );
    const entidadesNuevas = proyectoActualizado.entidades.filter(
      (e: Entidad) => !proyectoExistente!.entidades.find((ex: Entidad) => ex.nombre === e.nombre)
    );

    if (modulosNuevos.length > 0) {
      console.log(`✅ Módulos añadidos: ${modulosNuevos.map((m: Modulo) => m.nombre).join(", ")}`);
    }
    if (entidadesNuevas.length > 0) {
      console.log(`✅ Entidades añadidas: ${entidadesNuevas.map((e: Entidad) => e.nombre).join(", ")}`);
    }

    const { confirmar } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmar",
        message: "\n¿Quieres guardar estos cambios?",
        default: true,
      },
    ]);

    if (confirmar) {
      const filePath = generateFile(proyectoActualizado);
      console.log(`\n✅ Proyecto actualizado guardado: ${filePath}\n`);
    } else {
      console.log("\n❌ Cambios descartados.\n");
    }

    return;
  }

  // ─────────────────────────────────────────────
  // FLUJO B: Proyecto nuevo
  // ─────────────────────────────────────────────

  // FASE 2: Validar que el requerimiento tiene suficiente info funcional
  let requerimiento = requerimientoInicial;
  let requerimientoCompleto = false;

  while (!requerimientoCompleto) {
    const validacion = await validateRequirement(llm, requerimiento);

    if (validacion.esSuficiente) {
      requerimientoCompleto = true;
    } else {
      console.log(`⚠️  Necesito entender mejor tu proyecto para poder ayudarte.\n`);

      let respuestasAdicionales = "";

      for (const pregunta of validacion.preguntas) {
        const { respuesta } = await inquirer.prompt([
          {
            type: "input",
            name: "respuesta",
            message: `❓ ${pregunta}`,
          },
        ]);
        respuestasAdicionales += `\n- ${pregunta}: ${respuesta}`;
      }

      requerimiento = `${requerimiento}\n\nInformación adicional:${respuestasAdicionales}`;

      console.log("\n⏳ Evaluando la nueva información...\n");
    }
  }

  // FASE 3: Detectar perfil
  const perfil = await detectProfile(llm, requerimiento);
  console.log(`👤 Perfil detectado: ${perfil}\n`);

  // FASE 4: Analizar requerimiento
  const { proyecto, descripcion, modulos, entidades } = await analyzeRequirement(
    llm,
    requerimiento
  );

  console.log(`📋 Proyecto: ${proyecto}`);
  console.log(`📝 Módulos identificados:`);
  modulos.forEach((m) => console.log(`   - ${m.nombre}: ${m.descripcion}`));
  console.log(`\n🗃️  Entidades detectadas:`);
  entidades.forEach((e) => {
    console.log(`   - ${e.nombre}: ${e.campos.map((c) => c.nombre).join(", ")}`);
  });

  // FASE 5: Proponer stack
  const moduloNombres = modulos.map((m) => m.nombre);
  const { stack: stackPropuesto, mensaje } = await proposeStack(
    llm,
    moduloNombres,
    perfil
  );

  console.log("\n🛠️  Stack propuesto:");
  console.log(`   Frontend:      ${stackPropuesto.frontend}`);
  console.log(`   Backend:       ${stackPropuesto.backend}`);
  console.log(`   Base de datos: ${stackPropuesto.base_de_datos}`);
  console.log(`\n💬 ${mensaje}\n`);

  // FASE 6: Decisiones técnicas (solo perfil técnico)
  let decisionTecnica: DecisionTecnica | null = null;

  if (perfil === "tecnico") {
    console.log("⏳ Analizando decisiones técnicas...\n");
    decisionTecnica = await proposeArchitecture(llm, requerimiento, modulos);
    printDecisionTecnica(decisionTecnica);

    let decisionAprobada = false;

    while (!decisionAprobada) {
      const { confirmarDecision } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmarDecision",
          message: "¿Estás de acuerdo con estas decisiones técnicas?",
          default: true,
        },
      ]);

      if (confirmarDecision) {
        decisionAprobada = true;
      } else {
        const ajuste = await inquirer.prompt([
          {
            type: "select",
            name: "arquitectura",
            message: "Elige la arquitectura:",
            choices: ["monolito", "microservicios", "hexagonal", "mvc", "event-driven"],
          },
          {
            type: "checkbox",
            name: "infraestructura",
            message: "Elige la infraestructura (espacio para seleccionar):",
            choices: ["docker", "docker-compose", "kubernetes", "github-actions", "gitlab-ci", "ninguna"],
          },
          {
            type: "checkbox",
            name: "patrones",
            message: "Elige los patrones de diseño (espacio para seleccionar):",
            choices: ["repository", "cqrs", "factory", "singleton", "observer", "ninguno"],
          },
        ]);

        decisionTecnica = {
          arquitectura: ajuste.arquitectura,
          arquitectura_justificacion: "Seleccionado manualmente por el usuario.",
          infraestructura: ajuste.infraestructura,
          infraestructura_justificacion: "Seleccionado manualmente por el usuario.",
          patrones: ajuste.patrones,
          patrones_justificacion: "Seleccionado manualmente por el usuario.",
          sugerido_por_agente: false,
        };

        printDecisionTecnica(decisionTecnica);
        decisionAprobada = true;
      }
    }
  }

  // FASE 7: Confirmación del stack
  let stackFinal: Stack = stackPropuesto;

  if (perfil === "tecnico") {
    let stackAprobado = false;

    while (!stackAprobado) {
      const { confirmar } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmar",
          message: "¿Estás de acuerdo con el stack propuesto?",
          default: true,
        },
      ]);

      if (confirmar) {
        stackAprobado = true;
      } else {
        const ajuste = await inquirer.prompt([
          {
            type: "select",
            name: "frontend",
            message: "Elige el frontend:",
            choices: ["angular", "react", "vue"],
          },
          {
            type: "select",
            name: "backend",
            message: "Elige el backend:",
            choices: ["nodejs", "python", "dotnet", "java"],
          },
        ]);

        stackFinal = {
          frontend: ajuste.frontend,
          backend: ajuste.backend,
          base_de_datos: "sqlite",
        };

        console.log("\n🛠️  Stack actualizado:");
        console.log(`   Frontend:      ${stackFinal.frontend}`);
        console.log(`   Backend:       ${stackFinal.backend}`);
        console.log(`   Base de datos: ${stackFinal.base_de_datos}\n`);
        stackAprobado = true;
      }
    }
  } else {
    let conforme = false;

    while (!conforme) {
      const { ok } = await inquirer.prompt([
        {
          type: "confirm",
          name: "ok",
          message: "¿Quieres continuar con estas tecnologías para tu proyecto?",
          default: true,
        },
      ]);

      if (ok) {
        conforme = true;
      } else {
        const { inquietud } = await inquirer.prompt([
          {
            type: "input",
            name: "inquietud",
            message: "¿Qué duda tienes o qué te gustaría entender mejor?",
          },
        ]);

        console.log("\n⏳ Consultando...\n");

        const respuesta = await llm.invoke([
          {
            role: "system",
            content: `Eres un consultor amigable de software. El usuario no es técnico.
Stack propuesto: Angular (frontend), Node.js (backend), SQLite (base de datos).
Responde la duda en máximo 3 oraciones simples, sin tecnicismos.`,
          },
          { role: "user", content: inquietud },
        ]);

        console.log(`\n💬 ${respuesta}\n`);
      }
    }
  }

  // FASE 8: Generar fichero
  const projectData: ProjectData = {
    proyecto,
    descripcion,
    perfil_usuario: perfil,
    modulos,
    entidades,
    stack: stackFinal,
    decision_tecnica: decisionTecnica,
    fecha: new Date().toISOString().split("T")[0],
  };

  const filePath = generateFile(projectData);
  console.log(`\n✅ Fichero generado: ${filePath}\n`);
}