import * as fs from "fs";
import * as path from "path";
import { ProjectData } from "../types";

export function generateFile(data: ProjectData): string {
  const outputDir = path.resolve("output");
  const fileName = `fichero_base_${Date.now()}.json`;
  const filePath = path.join(outputDir, fileName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}