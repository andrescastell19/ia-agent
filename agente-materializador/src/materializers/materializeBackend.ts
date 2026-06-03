import * as fs from "fs";
import * as path from "path";
import { BackendJson } from "../types";

function buildRequirementsTxt(deps: BackendJson["dependencias"]): string {
  return [...deps.produccion, ...deps.desarrollo].join("\n") + "\n";
}

function buildPackageJson(deps: BackendJson["dependencias"]): string {
  return JSON.stringify(
    {
      name: "backend",
      version: "1.0.0",
      dependencies: Object.fromEntries(deps.produccion.map((d) => [d, "latest"])),
      devDependencies: Object.fromEntries(deps.desarrollo.map((d) => [d, "latest"])),
      scripts: {
        start: "ts-node src/index.ts",
        dev: "nodemon src/index.ts",
        test: "jest",
      },
    },
    null,
    2
  );
}

function buildReadme(framework: string, arquitectura: string): string {
  const isPython = ["python", "fastapi", "django", "flask"].includes(framework.toLowerCase());
  const installCmd = isPython ? "pip install -r requirements.txt" : "npm install";
  const startCmd = isPython ? "python app.py" : "npm start";

  return `# Backend — ${framework.toUpperCase()}

## Arquitectura: ${arquitectura}

## Instalación
\`\`\`bash
${installCmd}
\`\`\`

## Desarrollo
\`\`\`bash
${startCmd}
\`\`\`
`;
}

export function materializeBackend(
  baseDir: string,
  backend: BackendJson
): { archivosCreados: number; carpetasCreadas: number } {
  const backendDir = path.join(baseDir, "backend");
  let archivosCreados = 0;
  let carpetasCreadas = 0;

  fs.mkdirSync(backendDir, { recursive: true });
  carpetasCreadas++;

// Crear estructura de carpetas
  for (const item of backend.estructura) {
    const fullPath = path.join(backendDir, item.ruta);

    // FIX: ignorar rutas con extensión aunque vengan marcadas como carpeta
    const tieneExtension = path.extname(item.ruta) !== "";

    if (!tieneExtension && item.tipo === "carpeta") {
      fs.mkdirSync(fullPath, { recursive: true });
      carpetasCreadas++;
    }
  }

  // Escribir código base
  for (const codigo of backend.codigo_base) {
    const fullPath = path.join(backendDir, codigo.archivo);
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

  // Detectar si es Python o Node
  const isPython = ["python", "fastapi", "django", "flask"].includes(
    backend.framework.toLowerCase()
  );

  if (isPython) {
    fs.writeFileSync(
      path.join(backendDir, "requirements.txt"),
      buildRequirementsTxt(backend.dependencias),
      "utf-8"
    );
    // Crear __init__.py en carpetas src para que Python las reconozca como módulos
    const srcDirs = backend.estructura
      .filter((e) => e.tipo === "carpeta" || e.tipo === "archivo")
      .map((e) => path.dirname(path.join(backendDir, e.ruta)))
      .filter((d, i, arr) => arr.indexOf(d) === i);

    for (const dir of srcDirs) {
      const initFile = path.join(dir, "__init__.py");
      if (!fs.existsSync(initFile)) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(initFile, "", "utf-8");
        archivosCreados++;
      }
    }
  } else {
    fs.writeFileSync(
      path.join(backendDir, "package.json"),
      buildPackageJson(backend.dependencias),
      "utf-8"
    );
  }

  fs.writeFileSync(
    path.join(backendDir, "README.md"),
    buildReadme(backend.framework, backend.arquitectura),
    "utf-8"
  );
  archivosCreados++;

  fs.writeFileSync(
    path.join(backendDir, ".gitignore"),
    isPython
      ? "__pycache__/\n*.pyc\n.env\n*.db\n"
      : "node_modules/\ndist/\n.env\n*.db\n",
    "utf-8"
  );
  archivosCreados++;

  return { archivosCreados, carpetasCreadas };
}