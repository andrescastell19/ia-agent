import { Ollama } from "@langchain/ollama";
import { FicheroBase, InfraOutput } from "../types";

function buildPrompt(base: FicheroBase): string {
  const infra = base.decision_tecnica?.infraestructura ?? ["docker"];
  const cicd = infra.find((i) => ["github-actions", "gitlab-ci"].includes(i)) ?? null;

  return `
Eres un ingeniero DevOps senior. Genera la configuración de infraestructura completa.

Proyecto: ${base.proyecto}
Frontend: ${base.stack.frontend}
Backend: ${base.stack.backend}
Base de datos: ${base.stack.base_de_datos}
Infraestructura requerida: ${infra.join(", ")}
CI/CD: ${cicd ?? "ninguno"}

Responde ÚNICAMENTE con un JSON sin texto adicional con este formato:
{
  "docker": {
    "frontend": "contenido completo del Dockerfile del frontend",
    "backend": "contenido completo del Dockerfile del backend"
  },
  "docker_compose": "contenido completo del docker-compose.yml",
  "ci_cd": {
    "plataforma": "${cicd ?? "ninguno"}",
    "contenido": "contenido completo del archivo de CI/CD"
  }
}

Reglas:
- Los Dockerfiles deben ser funcionales y usar imágenes oficiales.
- El docker-compose debe incluir frontend, backend y volumen para SQLite.
- Si CI/CD es github-actions: genera .github/workflows/ci.yml con build, test y deploy.
- Si CI/CD es gitlab-ci: genera .gitlab-ci.yml.
- Si no hay CI/CD: el campo ci_cd debe ser null.
- Usa buenas prácticas: multi-stage builds, variables de entorno, healthchecks.
`;
}

export async function generateInfra(
  llm: Ollama,
  base: FicheroBase
): Promise<InfraOutput> {
  const response = await llm.invoke([
    { role: "system", content: buildPrompt(base) },
    {
      role: "user",
      content: `Genera la infraestructura completa para: ${base.proyecto}`,
    },
  ]);

  try {
    const clean = response.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      docker: { frontend: "", backend: "" },
      docker_compose: "",
      ci_cd: null,
    };
  }
}