import { Ollama } from "@langchain/ollama";

export type BusinessValidationResult =
  | { valido: true }
  | { valido: false; tipo: "contradiccion" | "alcance_irreal" | "incoherencia"; mensaje: string; sugerencia: string };

const VALIDATE_BUSINESS_PROMPT = `
Eres un consultor de negocio senior con experiencia en proyectos de software.
Analiza el requerimiento del usuario y determina si tiene sentido de negocio real.

Detecta estos problemas:

1. CONTRADICCION: el requerimiento se contradice a sí mismo.
   Ejemplo: "quiero una app offline que sincronice datos en tiempo real"

2. ALCANCE_IRREAL: el alcance es demasiado amplio para un solo proyecto coherente.
   Ejemplo: "quiero una app que gestione hospitales, bancos, colegios y gobiernos"

3. INCOHERENCIA: los módulos o funcionalidades no tienen relación entre sí.
   Ejemplo: "quiero registrar mascotas y también gestionar contratos de bolsa"

Si el requerimiento es válido responde:
{"valido": true}

Si tiene problemas responde:
{
  "valido": false,
  "tipo": "contradiccion" | "alcance_irreal" | "incoherencia",
  "mensaje": "explicación clara del problema encontrado",
  "sugerencia": "cómo podría reformular o dividir el requerimiento"
}

Responde ÚNICAMENTE con JSON sin texto adicional.
Sé tolerante con requerimientos ambiciosos pero razonables.
Solo rechaza casos claramente problemáticos.
`;

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