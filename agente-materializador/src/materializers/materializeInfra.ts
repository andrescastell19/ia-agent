import * as fs from "fs";
import * as path from "path";
import { InfraJson } from "../types";

export function materializeInfra(
  baseDir: string,
  infra: InfraJson
): { archivosCreados: number } {
  const infraDir = path.join(baseDir, "infra");
  fs.mkdirSync(infraDir, { recursive: true });
  let archivosCreados = 0;

  // Dockerfile frontend
  if (infra.docker.frontend) {
    fs.writeFileSync(
      path.join(infraDir, "Dockerfile.frontend"),
      infra.docker.frontend,
      "utf-8"
    );
    archivosCreados++;
  }

  // Dockerfile backend
  if (infra.docker.backend) {
    fs.writeFileSync(
      path.join(infraDir, "Dockerfile.backend"),
      infra.docker.backend,
      "utf-8"
    );
    archivosCreados++;
  }

  // docker-compose.yml en raíz del proyecto
  if (infra.docker_compose) {
    fs.writeFileSync(
      path.join(baseDir, "docker-compose.yml"),
      infra.docker_compose,
      "utf-8"
    );
    archivosCreados++;
  }

  // CI/CD
  if (infra.ci_cd && infra.ci_cd.contenido) {
    if (infra.ci_cd.plataforma === "github-actions") {
      const workflowDir = path.join(baseDir, ".github", "workflows");
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(
        path.join(workflowDir, "ci.yml"),
        infra.ci_cd.contenido,
        "utf-8"
      );
      archivosCreados++;
    } else if (infra.ci_cd.plataforma === "gitlab-ci") {
      fs.writeFileSync(
        path.join(baseDir, ".gitlab-ci.yml"),
        infra.ci_cd.contenido,
        "utf-8"
      );
      archivosCreados++;
    }
  }

  return { archivosCreados };
}