export interface EstructuraArchivo {
  ruta: string;
  tipo: "archivo" | "carpeta" | "modulo";
  descripcion: string;
}

export interface CodigoBase {
  archivo: string;
  contenido: string;
}

export interface Dependencias {
  produccion: string[];
  desarrollo: string[];
}

export interface FrontendOutput {
  framework: string;
  estructura: EstructuraArchivo[];
  dependencias: Dependencias;
  codigo_base: CodigoBase[];
}

export interface BackendOutput {
  framework: string;
  arquitectura: string;
  estructura: EstructuraArchivo[];
  dependencias: Dependencias;
  codigo_base: CodigoBase[];
}

export interface InfraOutput {
  docker: {
    frontend: string;
    backend: string;
  };
  docker_compose: string;
  ci_cd: {
    plataforma: string;
    contenido: string;
  } | null;
}

export interface MaestroOutput {
  proyecto: string;
  version: string;
  stack: {
    frontend: string;
    backend: string;
    base_de_datos: string;
  };
  arquitectura: string;
  infraestructura: string[];
  patrones: string[];
  capas: string[];
  fecha: string;
}

// Tipos del fichero_base.json del Agente 1
export interface Campo {
  nombre: string;
  tipo: string;
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
  operaciones: string[];
  entidad_principal: string;
}

export interface FicheroBase {
  proyecto: string;
  descripcion: string;
  perfil_usuario: string;
  modulos: Modulo[];
  entidades: Entidad[];
  stack: {
    frontend: string;
    backend: string;
    base_de_datos: string;
  };
  decision_tecnica: {
    arquitectura: string;
    arquitectura_justificacion: string;
    infraestructura: string[];
    infraestructura_justificacion: string;
    patrones: string[];
    patrones_justificacion: string;
    sugerido_por_agente: boolean;
  } | null;
  fecha: string;
}