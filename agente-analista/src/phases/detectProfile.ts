import { Ollama } from "@langchain/ollama";
import { UserProfile } from "../types";
import { DETECT_PROFILE_PROMPT } from "../prompts";

export async function detectProfile(
  llm: Ollama,
  userMessage: string
): Promise<UserProfile> {
  const response = await llm.invoke([
    { role: "system", content: DETECT_PROFILE_PROMPT },
    { role: "user", content: userMessage },
  ]);

  try {
    const parsed = JSON.parse(response);
    return parsed.perfil as UserProfile;
  } catch {
    return "desconocido";
  }
}