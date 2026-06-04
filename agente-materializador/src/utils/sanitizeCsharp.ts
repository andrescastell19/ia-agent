export function sanitizeCsharp(code: string): string {
  let result = code;

  // Fix: [Route("[controller]"]) → [Route("[controller]")]
  // Patrón: atributo con corchete de cierre incorrecto antes del paréntesis
  result = result.replace(/\[([^\]]+)\"\](\s*)\)/g, '[$1")]');

  // Fix: [Route("[controller]"]) → [Route("[controller]")]
  result = result.replace(/\[Route\("(\[controller\])"\]\)/g, '[Route("$1")]');

  // Fix genérico: cualquier atributo con ]) al final → ")]
  result = result.replace(/(")\]\)/g, '$1")]');

  // Fix: paréntesis extra al cierre de atributos [Atributo("valor")])
  result = result.replace(/(\[[\w]+\([^)]*\))\]\)/g, '$1]');

  return result;
}