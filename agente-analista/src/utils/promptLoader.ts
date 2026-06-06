/// <reference types="node" />
import * as fs from "fs";
import * as path from "path";

export type PromptConfigValue = string | { file: string };
export type PromptConfig = Record<string, PromptConfigValue>;
export type PromptMap = Record<string, string>;

export class PromptLoader {
  private readonly prompts: PromptMap;

  constructor(private readonly configFilePath: string) {
    const resolvedPath = path.resolve(configFilePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Prompt configuration file not found: ${resolvedPath}`);
    }

    this.prompts = this.loadPrompts(resolvedPath);
  }

  private loadPrompts(configPath: string): PromptMap {
    const raw = fs.readFileSync(configPath, "utf-8");
    const promptConfig = JSON.parse(raw) as PromptConfig;
    const baseDir = path.dirname(configPath);

    return Object.entries(promptConfig).reduce<PromptMap>((acc, [key, value]) => {
      acc[key] = this.resolvePromptValue(value, baseDir);
      return acc;
    }, {});
  }

  private resolvePromptValue(value: PromptConfigValue, baseDir: string): string {
    if (typeof value === "string") {
      const maybePath = path.resolve(baseDir, value);
      if (fs.existsSync(maybePath) && fs.statSync(maybePath).isFile()) {
        return fs.readFileSync(maybePath, "utf-8");
      }
      return value;
    }

    if (value && typeof value.file === "string") {
      const promptPath = path.resolve(baseDir, value.file);
      if (!fs.existsSync(promptPath)) {
        throw new Error(`Prompt file not found: ${promptPath}`);
      }
      return fs.readFileSync(promptPath, "utf-8");
    }

    throw new Error("Prompt value must be a string or an object with a file property.");
  }

  public get(key: string): string {
    const prompt = this.prompts[key];
    if (!prompt) {
      throw new Error(`Prompt key not found in configuration: ${key}`);
    }
    return prompt;
  }

  public getAll(): PromptMap {
    return { ...this.prompts };
  }
}

export function loadPrompts(configFilePath: string): PromptMap {
  return new PromptLoader(configFilePath).getAll();
}
