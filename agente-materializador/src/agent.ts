import * as fs from "fs";
import * as path from "path";
import { FrontendJson, BackendJson, InfraJson, MaestroJson } from "./types";
import { materializeFrontend } from "./materializers/materializeFrontend";
import { materializeBackend } from "./materializers/materializeBackend";
import { materializeInfra } from "./materializers/materializeInfra";

// Ruta al output del Agente 2
const AGENTE2_OUTPUT = path.resolve(__dirname, "../../agente-arquitecto/output");
const PROYECTOS_DIR = path.resolve(__dirname, "../proyectos");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function findProyectos(): string[] {
  if (!fs.existsSync(AGENTE2_OUTPUT)) return [];
  return fs.readdirSync(AGENTE2_OUTPUT).filter((f) => {
    return fs.statSync(path.join(AGENTE2_OUTPUT, f)).isDirectory();
  });
}

function buildRootReadme(maestro: MaestroJson): string {
  return `# ${maestro.proyecto}

**Versión:** ${maestro.version}  
**Fecha:** ${maestro.fecha}  
**Arquitectura:** ${maestro.arquitectura}  

## Stack
- Frontend: ${maestro.stack.frontend}
- Backend: ${maestro.stack.backend}
- Base de datos: ${maestro.stack.base_de_datos}

## Infraestructura
${maestro.infraestructura.map((i) => `- ${i}`).join("\n")}

## Patrones de diseño
${maestro.patrones.map((p) => `- ${p}`).join("\n")}

## Estructura del proyecto
\`\`\`
${maestro.proyecto}/
├── frontend/
├── backend/
├── infra/
└── docker-compose.yml
\`\`\`

## Inicio rápido
\`\`\`bash
docker-compose up --build
\`\`\`
`;
}

export async function runAgent(): Promise<void> {
  console.log("\n🔨 Agente Materializador iniciado\n");

  // PASO 1: Encontrar proyectos disponibles en output del Agente 2
  const proyectos = findProyectos();

  if (proyectos.length === 0) {
    console.log("❌ No se encontraron proyectos en:");
    console.log(`   ${AGENTE2_OUTPUT}`);
    console.log("\n   Ejecuta primero el Agente 2 para generar los ficheros.\n");
    return;
  }

  // Por ahora toma el más reciente — puedes extender esto con inquirer si quieres selección
  const proyecto = proyectos[proyectos.length - 1];
  const proyectoInputDir = path.join(AGENTE2_OUTPUT, proyecto);
  const proyectoOutputDir = path.join(PROYECTOS_DIR, proyecto);

  console.log(`📂 Proyecto a materializar: ${proyecto}`);
  console.log(`   Origen:  ${proyectoInputDir}`);
  console.log(`   Destino: ${proyectoOutputDir}\n`);

  // PASO 2: Leer los JSONs
  const maestro = readJson<MaestroJson>(path.join(proyectoInputDir, "maestro.json"));
  const frontend = readJson<FrontendJson>(path.join(proyectoInputDir, "frontend.json"));
  const backend = readJson<BackendJson>(path.join(proyectoInputDir, "backend.json"));
  const infra = readJson<InfraJson>(path.join(proyectoInputDir, "infra.json"));

  // PASO 3: Crear carpeta raíz del proyecto
  fs.mkdirSync(proyectoOutputDir, { recursive: true });

  // PASO 4: Materializar cada capa
  console.log("⏳ Materializando frontend...");
  const resultFrontend = materializeFrontend(proyectoOutputDir, frontend);
  console.log(`   ✅ ${resultFrontend.archivosCreados} archivos, ${resultFrontend.carpetasCreadas} carpetas`);

  console.log("⏳ Materializando backend...");
  const resultBackend = materializeBackend(proyectoOutputDir, backend);
  console.log(`   ✅ ${resultBackend.archivosCreados} archivos, ${resultBackend.carpetasCreadas} carpetas`);

  console.log("⏳ Materializando infraestructura...");
  const resultInfra = materializeInfra(proyectoOutputDir, infra);
  console.log(`   ✅ ${resultInfra.archivosCreados} archivos`);

  // PASO 5: Generar README raíz
  fs.writeFileSync(
    path.join(proyectoOutputDir, "README.md"),
    buildRootReadme(maestro),
    "utf-8"
  );

  console.log(`\n✅ Proyecto materializado en:\n   ${proyectoOutputDir}\n`);
  console.log("📁 Estructura generada:");
  console.log(`   ${proyecto}/`);
  console.log(`   ├── frontend/`);
  console.log(`   ├── backend/`);
  console.log(`   ├── infra/`);
  console.log(`   ├── docker-compose.yml`);
  console.log(`   └── README.md\n`);
}