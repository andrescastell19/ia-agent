import path from "path";
import { fileURLToPath } from "url";
import { PromptLoader } from "./utils/promptLoader.js";

const PROMPTS_PATH = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../prompts/prompts.json"
);
const promptLoader = new PromptLoader(PROMPTS_PATH);

export const DETECT_PROFILE_PROMPT = promptLoader.get("DETECT_PROFILE_PROMPT");
export const ANALYZE_REQUIREMENT_PROMPT = promptLoader.get("ANALYZE_REQUIREMENT_PROMPT");
export const PROPOSE_STACK_TECNICO_PROMPT = promptLoader.get("PROPOSE_STACK_TECNICO_PROMPT");
export const PROPOSE_STACK_NO_TECNICO_PROMPT = promptLoader.get("PROPOSE_STACK_NO_TECNICO_PROMPT");
export const DETECT_INTENT_PROMPT = promptLoader.get("DETECT_INTENT_PROMPT");
export const VALIDATE_REQUIREMENT_PROMPT = promptLoader.get("VALIDATE_REQUIREMENT_PROMPT");
export const VALIDATE_BUSINESS_PROMPT = promptLoader.get("VALIDATE_BUSINESS_PROMPT");
export const PROPOSE_ARCHITECTURE_PROMPT = promptLoader.get("PROPOSE_ARCHITECTURE_PROMPT");
export const DETECT_CHANGES_PROMPT = promptLoader.get("DETECT_CHANGES_PROMPT");

export const getPrompt = (key: string): string => promptLoader.get(key);
