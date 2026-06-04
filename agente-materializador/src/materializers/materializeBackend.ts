import * as fs from "fs";
import * as path from "path";
import { BackendJson } from "../types";
import { sanitizeCsharp } from "../utils/sanitizeCsharp";

type FrameworkType = "python" | "nodejs" | "dotnet" | "java" | "unknown";

function detectFramework(framework: string): FrameworkType {
  const f = framework.toLowerCase();
  if (["python", "fastapi", "django", "flask"].includes(f)) return "python";
  if (["nodejs", "node", "express"].includes(f)) return "nodejs";
  if (["dotnet", ".net", "aspnet", "csharp"].includes(f)) return "dotnet";
  if (["java", "spring", "springboot"].includes(f)) return "java";
  return "unknown";
}

// ─── Node.js ───────────────────────────────────────────
function buildNodePackageJson(deps: BackendJson["dependencias"]): string {
  return JSON.stringify(
    {
      name: "backend",
      version: "1.0.0",
      scripts: {
        start: "ts-node src/index.ts",
        dev: "nodemon src/index.ts",
        test: "jest",
      },
      dependencies: Object.fromEntries(deps.produccion.map((d) => [d, "latest"])),
      devDependencies: Object.fromEntries(deps.desarrollo.map((d) => [d, "latest"])),
    },
    null,
    2
  );
}

// ─── Python ────────────────────────────────────────────
function buildRequirementsTxt(deps: BackendJson["dependencias"]): string {
  return [...deps.produccion, ...deps.desarrollo].join("\n") + "\n";
}

// ─── .NET ──────────────────────────────────────────────
function buildCsprojFile(projectName: string, deps: BackendJson["dependencias"]): string {
  const VERSION_MAP: Record<string, string> = {
    "Microsoft.EntityFrameworkCore.Sqlite": "8.0.0",
    "Microsoft.EntityFrameworkCore.Design": "8.0.0",
    "Microsoft.EntityFrameworkCore.Tools": "8.0.0",
    "Microsoft.EntityFrameworkCore": "8.0.0",
    "Microsoft.AspNetCore.Authentication.JwtBearer": "8.0.0",
    "Swashbuckle.AspNetCore": "6.5.0",
    "AutoMapper": "12.0.1",
    "FluentValidation": "11.9.0",
  };

  // Paquetes que no deben incluirse — ya los provee el SDK automáticamente
  const EXCLUDED = new Set([
    "Microsoft.AspNetCore.App",
    "Microsoft.NETCore.App",
  ]);

  // Deduplicar: produccion tiene prioridad sobre desarrollo
  const prodSet = new Set(deps.produccion.filter((d) => !EXCLUDED.has(d)));
  const devSet = new Set(
    deps.desarrollo.filter((d) => !EXCLUDED.has(d) && !prodSet.has(d))
  );

  const prodPackages = [...prodSet]
    .map((d) => {
      const version = VERSION_MAP[d] ?? "8.0.0";
      return `    <PackageReference Include="${d}" Version="${version}" />`;
    })
    .join("\n");

  const devPackages = [...devSet]
    .map((d) => {
      const version = VERSION_MAP[d] ?? "8.0.0";
      return `    <PackageReference Include="${d}" Version="${version}">\n      <PrivateAssets>all</PrivateAssets>\n      <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>\n    </PackageReference>`;
    })
    .join("\n");

  return `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>${projectName}</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
${prodPackages}
  </ItemGroup>

  <ItemGroup>
${devPackages}
  </ItemGroup>

</Project>
`;
}

function buildDotnetProgramCs(): string {
  return `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
`;
}

function buildDotnetGitignore(): string {
  return `bin/
obj/
*.user
.vs/
*.db
.env
`;
}

// ─── Java ──────────────────────────────────────────────
function buildPomXml(projectName: string, deps: BackendJson["dependencias"]): string {
  const dependencies = deps.produccion
    .map((d) => {
      const parts = d.split(":");
      const groupId = parts[0] ?? "org.springframework.boot";
      const artifactId = parts[1] ?? d;
      return `        <dependency>
            <groupId>${groupId}</groupId>
            <artifactId>${artifactId}</artifactId>
        </dependency>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <groupId>com.${projectName.toLowerCase()}</groupId>
    <artifactId>${projectName.toLowerCase()}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${projectName}</name>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.xerial</groupId>
            <artifactId>sqlite-jdbc</artifactId>
        </dependency>
${dependencies}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`;
}


function buildAppSettings(projectName: string): string {
  return JSON.stringify(
    {
      Logging: {
        LogLevel: {
          Default: "Information",
          "Microsoft.AspNetCore": "Warning",
        },
      },
      AllowedHosts: "*",
      ConnectionStrings: {
        DefaultConnection: `Data Source=${projectName}.db`,
      },
    },
    null,
    2
  );
}

function buildAppSettingsDevelopment(): string {
  return JSON.stringify(
    {
      Logging: {
        LogLevel: {
          Default: "Information",
          "Microsoft.AspNetCore": "Warning",
        },
      },
    },
    null,
    2
  );
}

function buildDbContext(projectName: string, backend: BackendJson): string {
  // Detectar entidades desde los modelos en estructura
  const modelos = backend.estructura
    .filter((e) => e.ruta.includes("Models/") || e.ruta.includes("models/"))
    .filter((e) => path.extname(e.ruta) === ".cs")
    .map((e) => path.basename(e.ruta, ".cs"));

  const dbSets = modelos
    .map((m) => `    public DbSet<${m}> ${m}s { get; set; }`)
    .join("\n");

  return `using Microsoft.EntityFrameworkCore;

namespace ${projectName}.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

${dbSets}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
`;
}

function buildDotnetProgramCsWithDb(projectName: string): string {
  return `using Microsoft.EntityFrameworkCore;
using ${projectName}.Data;

var builder = WebApplication.CreateBuilder(args);

// Servicios
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Base de datos SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Crear la base de datos si no existe
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
`;
}

// ─── README ────────────────────────────────────────────
function buildReadme(framework: FrameworkType, arquitectura: string, projectName: string): string {
  const comandos: Record<FrameworkType, { install: string; start: string }> = {
    python:   { install: "pip install -r requirements.txt", start: "python app.py" },
    nodejs:   { install: "npm install", start: "npm start" },
    dotnet:   { install: "dotnet restore", start: "dotnet run" },
    java:     { install: "mvn install", start: "mvn spring-boot:run" },
    unknown:  { install: "# ver documentación", start: "# ver documentación" },
  };

  const cmd = comandos[framework];
  return `# Backend — ${framework.toUpperCase()}

## Arquitectura: ${arquitectura}

## Instalación
\`\`\`bash
${cmd.install}
\`\`\`

## Ejecución
\`\`\`bash
${cmd.start}
\`\`\`
`;
}

// ─── Materializador principal ───────────────────────────
export function materializeBackend(
  baseDir: string,
  backend: BackendJson
): { archivosCreados: number; carpetasCreadas: number } {
  const backendDir = path.join(baseDir, "backend");
  const frameworkType = detectFramework(backend.framework);
  const projectName = path.basename(baseDir);
  let archivosCreados = 0;
  let carpetasCreadas = 0;

  fs.mkdirSync(backendDir, { recursive: true });
  carpetasCreadas++;

  // Crear estructura de carpetas
  for (const item of backend.estructura) {
    const fullPath = path.join(backendDir, item.ruta);
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

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      console.warn(`   ⚠️  Saltando "${codigo.archivo}" — existe como carpeta`);
      continue;
    }

    // Sanitizar código C# antes de escribir
    const esCsharp = path.extname(codigo.archivo) === ".cs";
    const contenido = esCsharp ? sanitizeCsharp(codigo.contenido) : codigo.contenido;

    fs.writeFileSync(fullPath, contenido, "utf-8");
    archivosCreados++;
  }

  // Archivos de configuración según framework
  if (frameworkType === "python") {
    fs.writeFileSync(
      path.join(backendDir, "requirements.txt"),
      buildRequirementsTxt(backend.dependencias),
      "utf-8"
    );
    // __init__.py en cada carpeta para que Python las reconozca como módulos
    const dirs = backend.estructura
      .map((e) => path.dirname(path.join(backendDir, e.ruta)))
      .filter((d, i, arr) => arr.indexOf(d) === i);
    for (const dir of dirs) {
      const initFile = path.join(dir, "__init__.py");
      if (!fs.existsSync(initFile)) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(initFile, "", "utf-8");
        archivosCreados++;
      }
    }
    fs.writeFileSync(path.join(backendDir, ".gitignore"), "__pycache__/\n*.pyc\n.env\n*.db\n", "utf-8");

  } else if (frameworkType === "nodejs") {
    fs.writeFileSync(path.join(backendDir, "package.json"), buildNodePackageJson(backend.dependencias), "utf-8");
    fs.writeFileSync(path.join(backendDir, ".gitignore"), "node_modules/\ndist/\n.env\n*.db\n", "utf-8");

  } else if (frameworkType === "dotnet") {
    // .csproj
    fs.writeFileSync(
      path.join(backendDir, `${projectName}.csproj`),
      buildCsprojFile(projectName, backend.dependencias),
      "utf-8"
    );
    archivosCreados++;

    // Program.cs con conexión a SQLite
    fs.writeFileSync(
      path.join(backendDir, "Program.cs"),
      buildDotnetProgramCsWithDb(projectName),
      "utf-8"
    );
    archivosCreados++;

    // appsettings.json con connection string
    fs.writeFileSync(
      path.join(backendDir, "appsettings.json"),
      buildAppSettings(projectName),
      "utf-8"
    );
    archivosCreados++;

    // appsettings.Development.json
    fs.writeFileSync(
      path.join(backendDir, "appsettings.Development.json"),
      buildAppSettingsDevelopment(),
      "utf-8"
    );
    archivosCreados++;

    // Carpeta Data con DbContext
    const dataDir = path.join(backendDir, "Data");
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, "AppDbContext.cs"),
      buildDbContext(projectName, backend),
      "utf-8"
    );
    archivosCreados++;
    carpetasCreadas++;

    fs.writeFileSync(
      path.join(backendDir, ".gitignore"),
      buildDotnetGitignore(),
      "utf-8"
    );
    archivosCreados++;
  } else if (frameworkType === "java") {
    fs.writeFileSync(
      path.join(backendDir, "pom.xml"),
      buildPomXml(projectName, backend.dependencias),
      "utf-8"
    );
    archivosCreados++;
    fs.writeFileSync(
      path.join(backendDir, ".gitignore"),
      "target/\n*.class\n.env\n*.db\n.idea/\n",
      "utf-8"
    );
  }

  // README siempre
  fs.writeFileSync(
    path.join(backendDir, "README.md"),
    buildReadme(frameworkType, backend.arquitectura, projectName),
    "utf-8"
  );
  archivosCreados++;

  return { archivosCreados, carpetasCreadas };
}