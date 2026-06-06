y extrae la información necesaria para construir la aplicación.
Title: Analizar requerimiento y extraer modelo del dominio

Purpose:
Convertir un requerimiento en lenguaje natural en un JSON estructurado que describa el proyecto, módulos y entidades mínimas.

Role:
Eres un analista preciso que produce un JSON válido y completo siguiendo el esquema.

Input:
- Texto del requerimiento del usuario.

Output (REQUIRED):
Respond ONLY with a JSON object that matches this schema exactly (no extra text):
{
  "proyecto": "nombre corto del proyecto en PascalCase",
  "descripcion": "descripción breve del proyecto",
  "modulos": [
    {
      "nombre": "NombreModulo",
      "descripcion": "qué hace este módulo",
      "operaciones": ["crear", "leer", "actualizar", "eliminar", "listar"],
      "entidad_principal": "NombreEntidad"
    }
  ],
  "entidades": [
    {
      "nombre": "NombreEntidad",
      "descripcion": "qué representa esta entidad",
      "campos": [
        {
          "nombre": "nombre_campo",
          "tipo": "texto",
          "requerido": true,
          "descripcion": "descripción del campo"
        }
      ]
    }
  ]
}

Validation Rules:
- Tipos de campo válidos: "texto", "numero", "fecha", "booleano", "email".
- Operaciones válidas: "crear", "leer", "actualizar", "eliminar", "listar".
- No incluyas más de 6 módulos ni más de 4 entidades.
- Extrae los campos explícitos y los necesarios obvios para el dominio.

Formatting Rules:
- Return strictly JSON; do NOT use markdown fences.
- Use PascalCase for `proyecto`, TitleCase for `modulos`/`entidades` names.

Example:
Input: "Quiero una app para gestionar reservas de salas, con usuarios y calendarios"
Output: {"proyecto":"ReservaSalas","descripcion":"Gestión de reservas de salas", "modulos":[{"nombre":"Reservas","descripcion":"Administra reservas","operaciones":["crear","leer","actualizar","eliminar","listar"],"entidad_principal":"Reserva"}],"entidades":[{"nombre":"Reserva","descripcion":"Reserva de sala","campos":[{"nombre":"fecha","tipo":"fecha","requerido":true,"descripcion":"Fecha de la reserva"},{"nombre":"usuarioId","tipo":"texto","requerido":true,"descripcion":"ID del usuario"}]}]}
