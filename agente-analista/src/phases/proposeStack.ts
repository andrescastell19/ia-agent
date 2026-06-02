import { Ollama } from "@langchain/ollama";
import { UserProfile, Stack } from "../types";
import {
  PROPOSE_STACK_TECNICO_PROMPT,
  PROPOSE_STACK_NO_TECNICO_PROMPT,
} from "../prompts";

export async function proposeStack(
  llm: Ollama,
  modulos: string[],
  perfil: UserProfile
): Promise<{ stack: Stack; mensaje: string }> {
  const prompt =
    perfil === "tecnico"
      ? PROPOSE_STACK_TECNICO_PROMPT
      : PROPOSE_STACK_NO_TECNICO_PROMPT;

  const response = await llm.invoke([
    { role: "system", content: prompt },
    { role: "user", content: `Módulos del proyecto: ${modulos.join(", ")}` },
  ]);

  try {
    const parsed = JSON.parse(response);
    return {
      stack: parsed.propuesta as Stack,
      mensaje: parsed.justificacion || parsed.explicacion_simple || "",
    };
  } catch {
    return {
      stack: { frontend: "angular", backend: "nodejs", base_de_datos: "sqlite" },
      mensaje: "Stack por defecto asignado.",
    };
  }
}