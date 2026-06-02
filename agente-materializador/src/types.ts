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

export interface FrontendJson {
  framework: string;
  estructura: EstructuraArchivo[];
  dependencias: Dependencias;
  codigo_base: CodigoBase[];
}

export interface BackendJson {
  framework: string;
  arquitectura: string;
  estructura: EstructuraArchivo[];
  dependencias: Dependencias;
  codigo_base: CodigoBase[];
}

export interface InfraJson {
  docker: {
    frontend: string;
    backend: string;
  };
  docker_compose: string;
  ci_cd: {
    plataforma: string;
    contenido: string | null;
  } | null;
}

export interface MaestroJson {
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