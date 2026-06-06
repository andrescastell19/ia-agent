import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

type PromptMap = Record<string, string>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PromptLoader {
  private baseDir: string;
  private prompts: PromptMap = {};

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(__dirname, "..", "..", "prompts");
    this.loadAll();
  }

  private resolvePath(key: string) {
    return path.join(this.baseDir, key + ".md");
  }

  private loadAll() {
    if (!fs.existsSync(this.baseDir)) return;
    const stat = fs.statSync(this.baseDir);
    if (!stat.isDirectory()) return;
    const files = fs.readdirSync(this.baseDir).filter(f => f.endsWith('.md'));
    for (const f of files) {
      const key = f.replace(/\.md$/, "");
      this.prompts[key] = fs.readFileSync(path.join(this.baseDir, f), "utf-8");
    }
  }

  public get(key: string): string {
    const p = this.prompts[key];
    if (!p) throw new Error(`Prompt key not found: ${key}`);
    return p;
  }

  public getAll(): PromptMap {
    return { ...this.prompts };
  }
}

export function loadPrompts(baseDir?: string): PromptMap {
  return new PromptLoader(baseDir).getAll();
}
