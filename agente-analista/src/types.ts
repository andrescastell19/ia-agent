export type UserProfile = "tecnico" | "no_tecnico" | "desconocido";
export type Frontend = "angular" | "react" | "vue";
export type Backend = "nodejs" | "python" | "dotnet" | "java";
export type BaseDatos = "sqlite";

export type Arquitectura =
  | "monolito"
  | "microservicios"
  | "hexagonal"
  | "mvc"
  | "event-driven";

export type Infraestructura =
  | "docker"
  | "docker-compose"
  | "kubernetes"
  | "github-actions"
  | "gitlab-ci"
  | "ninguna";

export type PatronDiseño =
  | "repository"
  | "cqrs"
  | "factory"
  | "singleton"
  | "observer"
  | "ninguno";

export interface DecisionTecnica {
  arquitectura: Arquitectura;
  arquitectura_justificacion: string;
  infraestructura: Infraestructura[];
  infraestructura_justificacion: string;
  patrones: PatronDiseño[];
  patrones_justificacion: string;
  sugerido_por_agente: boolean; // true si el usuario no lo mencionó
}

export interface Campo {
  nombre: string;
  tipo: "texto" | "numero" | "fecha" | "booleano" | "email";
  requerido: boolean;
  descripcion: string;
}

export interface Entidad {
  nombre: string;
  descripcion: string;
  campos: Campo[];
}

export interface Modulo {
  nombre: string;
  descripcion: string;
  operaciones: ("crear" | "leer" | "actualizar" | "eliminar" | "listar")[];
  entidad_principal: string;
}

export interface Stack {
  frontend: Frontend;
  backend: Backend;
  base_de_datos: BaseDatos;
}

export interface ProjectData {
  proyecto: string;
  descripcion: string;
  perfil_usuario: UserProfile;
  modulos: Modulo[];
  entidades: Entidad[];
  stack: Stack;
  decision_tecnica: DecisionTecnica | null; // null para usuarios no técnicos
  fecha: string;
}