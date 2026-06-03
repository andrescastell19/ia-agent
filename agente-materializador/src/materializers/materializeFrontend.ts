import * as fs from "fs";
import * as path from "path";
import { FrontendJson } from "../types";

function buildPackageJson(framework: string, deps: FrontendJson["dependencias"]): string {
  return JSON.stringify(
    {
      name: "frontend",
      version: "1.0.0",
      private: true,
      dependencies: Object.fromEntries(deps.produccion.map((d) => [d, "latest"])),
      devDependencies: Object.fromEntries(deps.desarrollo.map((d) => [d, "latest"])),
      scripts: {
        start: framework === "react" ? "react-scripts start" : "ng serve",
        build: framework === "react" ? "react-scripts build" : "ng build",
        test: framework === "react" ? "react-scripts test" : "ng test",
      },
    },
    null,
    2
  );
}

function buildReadme(framework: string): string {
  return `# Frontend — ${framework.toUpperCase()}

## Instalación
\`\`\`bash
npm install
\`\`\`

## Desarrollo
\`\`\`bash
npm start
\`\`\`

## Build
\`\`\`bash
npm run build
\`\`\`
`;
}

export function materializeFrontend(
  baseDir: string,
  frontend: FrontendJson
): { archivosCreados: number; carpetasCreadas: number } {
  const frontendDir = path.join(baseDir, "frontend");
  let archivosCreados = 0;
  let carpetasCreadas = 0;

  // Crear carpeta raíz
  fs.mkdirSync(frontendDir, { recursive: true });
  carpetasCreadas++;

  // Crear estructura de carpetas del JSON
  for (const item of frontend.estructura) {
    const fullPath = path.join(frontendDir, item.ruta);

    // FIX: si la ruta tiene extensión de archivo, tratarla como archivo aunque
    // el JSON diga que es carpeta o modulo — el Agente 2 a veces los confunde
    const tieneExtension = path.extname(item.ruta) !== "";

    if (!tieneExtension && (item.tipo === "carpeta" || item.tipo === "modulo")) {
      fs.mkdirSync(fullPath, { recursive: true });
      carpetasCreadas++;
    }
  }

  // Escribir código base
  for (const codigo of frontend.codigo_base) {
    const fullPath = path.join(frontendDir, codigo.archivo);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });

    // FIX: verificar que el destino no sea una carpeta existente
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      console.warn(`   ⚠️  Saltando "${codigo.archivo}" — existe como carpeta`);
      continue;
    }

    fs.writeFileSync(fullPath, codigo.contenido, "utf-8");
    archivosCreados++;
  }

  // Generar package.json
  fs.writeFileSync(
    path.join(frontendDir, "package.json"),
    buildPackageJson(frontend.framework, frontend.dependencias),
    "utf-8"
  );
  archivosCreados++;

  // Generar README
  fs.writeFileSync(
    path.join(frontendDir, "README.md"),
    buildReadme(frontend.framework),
    "utf-8"
  );
  archivosCreados++;

  // Generar .gitignore
  fs.writeFileSync(
    path.join(frontendDir, ".gitignore"),
    "node_modules/\ndist/\nbuild/\n.env\n",
    "utf-8"
  );
  archivosCreados++;

  return { archivosCreados, carpetasCreadas };
}