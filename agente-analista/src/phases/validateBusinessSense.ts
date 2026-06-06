import { Ollama } from "@langchain/ollama";
import { VALIDATE_BUSINESS_PROMPT } from "../prompts";

export type BusinessValidationResult =
  | { valido: true }
  | { valido: false; tipo: "contradiccion" | "alcance_irreal" | "incoherencia"; mensaje: string; sugerencia: string };

export async function validateBusinessSense(
  llm: Ollama,
  requerimiento: string
): Promise<BusinessValidationResult> {
  const response = await llm.invoke([
    { role: "system", content: VALIDATE_BUSINESS_PROMPT },
    { role: "user", content: requerimiento },
  ]);

  try {
    const clean = response.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { valido: true }; // ante la duda, dejar pasar
  }
}