import * as fs from "fs";
import * as path from "path";
import { FicheroBase } from "../types";

export function writeJson(carpetaProyecto: string, nombre: string, data: object): string {
  const dir = path.resolve("output", carpetaProyecto);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${nombre}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}

export function readFicheroBase(outputDir: string): { fichero: FicheroBase; ruta: string } | null {
  if (!fs.existsSync(outputDir)) return null;

  const files = fs.readdirSync(outputDir)
    .filter((f) => f.startsWith("fichero_base_") && f.endsWith(".json"))
    .map((f) => ({
      nombre: f,
      ruta: path.join(outputDir, f),
      mtime: fs.statSync(path.join(outputDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (files.length === 0) return null;

  const ruta = files[0].ruta;
  const fichero: FicheroBase = JSON.parse(fs.readFileSync(ruta, "utf-8"));
  return { fichero, ruta };
}