# IA Agent

Sistema multi-agente de IA para la generación automatizada de proyectos de software a partir de requerimientos en lenguaje natural.

---

## Qué hace

El usuario describe lo que quiere construir. El sistema analiza el requerimiento, diseña la arquitectura y genera la estructura completa del proyecto lista para desarrollar.

```text
Usuario: "Quiero un sistema de inventario con control de stock y reportes"
    │
    ▼
[Agente Analista]  →  detecta módulos, entidades, stack y arquitectura
    │
    ▼
[Agente Arquitecto]  →  genera estructura de archivos, código base e infraestructura
    │
    ▼
[Agente Materializador]  →  escribe el proyecto en disco
    │
    ▼
/proyectos/Inventario/
    ├── frontend/   (Angular)
    ├── backend/    (Node.js + Express + SQLite)
    ├── infra/      (Docker + docker-compose)
    └── README.md
```

---

## Agentes

### Agente Analista

Interactúa con el usuario vía CLI para recopilar y procesar el requerimiento.

**Fases internas:**

1. `detect-intent` — identifica si es un proyecto nuevo o modificación de uno existente
2. `validate-requirement` — verifica que el requerimiento tiene suficiente información funcional; si no, hace preguntas
3. `detect-profile` — clasifica al usuario como técnico o no técnico para adaptar el lenguaje
4. `analyze-requirement` — extrae módulos, entidades y operaciones CRUD del dominio
5. `propose-stack` — sugiere frontend, backend y base de datos según el perfil y los módulos
6. `propose-architecture` — propone arquitectura, infraestructura y patrones de diseño (solo perfil técnico)
7. `generate-file` — persiste el análisis como `fichero_base.json`

**Modelo:** Ollama `qwen2.5:14b`  
**Output:** `agente-analista/output/<proyecto>.json`

---

### Agente Arquitecto

Lee el output del Analista y genera los planos de cada capa del sistema.

**Fases internas:**

1. `generate-frontend` — estructura de archivos, dependencias y código base del frontend
2. `generate-backend` — estructura, dependencias y código base del backend según la arquitectura elegida
3. `generate-infra` — Dockerfiles, docker-compose y pipeline de CI/CD
4. `generate-maestro` — fichero resumen del proyecto (versión, stack, patrones, capas)

Frontend y backend se generan en paralelo. La infra espera a que ambos terminen.

**Modelo:** Ollama `deepseek-coder-v2` (8192 tokens de contexto)  
**Output:** `agente-arquitecto/output/<proyecto>/{maestro,frontend,backend,infra}.json`

---

### Agente Materializador

Lee los JSONs del Arquitecto y los convierte en archivos reales en disco.

**Pasos:**

1. Lee `maestro.json`, `frontend.json`, `backend.json`, `infra.json`
2. Crea la carpeta del proyecto
3. Escribe la estructura de directorios y archivos de cada capa
4. Genera el `README.md` raíz del proyecto

**Sin LLM** — es un paso de materialización determinista.  
**Output:** `agente-materializador/proyectos/<proyecto>/`

---

## Tecnologías

| Componente          | Tecnología                      |
| ------------------- | ------------------------------- |
| Lenguaje            | TypeScript 5                    |
| Runtime LLM         | Ollama (local)                  |
| Framework LLM       | LangChain (`@langchain/ollama`) |
| CLI interactiva     | Inquirer.js                     |
| Modelo — Analista   | `qwen2.5:14b`                   |
| Modelo — Arquitecto | `deepseek-coder-v2`             |

---

## Requisitos

- [Node.js](https://nodejs.org) >= 20
- [Ollama](https://ollama.com) instalado y corriendo localmente
- Modelos descargados:

```bash
ollama pull qwen2.5:14b
ollama pull deepseek-coder-v2
```

---

## Instalación

Cada agente es un paquete independiente. Instala las dependencias en cada uno:

```bash
cd agente-analista && npm install
cd ..
cd ../agente-arquitecto && npm install
cd ..
cd ../agente-materializador && npm install
cd ..
```

---

## Uso

Los agentes se ejecutan en secuencia. Cada uno consume el output del anterior.

### Paso 1 — Agente Analista

```bash
cd agente-analista
npm start
cd ..
```

El agente te hace preguntas en la terminal para entender tu proyecto. Al finalizar genera un JSON en `agente-analista/output/`.

### Paso 2 — Agente Arquitecto

```bash
cd agente-arquitecto
npm start
cd ..
```

Lee el JSON más reciente del Analista y genera los planos de arquitectura en `agente-arquitecto/output/`.

### Paso 3 — Agente Materializador

```bash
cd agente-materializador
npm start
cd ..
```

Lee los planos del Arquitecto y escribe el proyecto en `agente-materializador/proyectos/`.

---

## Stacks soportados

| Capa            | Opciones                                                      |
| --------------- | ------------------------------------------------------------- |
| Frontend        | Angular, React, Vue                                           |
| Backend         | Node.js, Python, .NET, Java                                   |
| Base de datos   | SQLite                                                        |
| Arquitectura    | Monolito, Microservicios, Hexagonal, MVC, Event-Driven        |
| Infraestructura | Docker, docker-compose, Kubernetes, GitHub Actions, GitLab CI |
| Patrones        | Repository, CQRS, Factory, Singleton, Observer                |

---

## Modificar un proyecto existente

El Agente Analista detecta automáticamente si describes una modificación a un proyecto ya generado:

```text
"Al proyecto Inventario agrégale un módulo de reportes con exportación a PDF"
```

El agente carga el `fichero_base.json` existente, aplica los cambios y genera una versión actualizada.

---

## Estructura del repositorio

```text
ia-agent/
├── agente-analista/
│   ├── src/
│   │   ├── agent.ts           ← orquestador de fases
│   │   ├── prompts.ts         ← prompts del sistema
│   │   ├── types.ts           ← tipos del dominio
│   │   ├── phases/            ← una función por fase
│   │   └── index.ts
│   ├── output/                ← ficheros_base.json generados (gitignore)
│   ├── package.json
│   └── tsconfig.json
│
├── agente-arquitecto/
│   ├── src/
│   │   ├── agent.ts
│   │   ├── types.ts
│   │   ├── phases/            ← generate{Frontend,Backend,Infra,Maestro}.ts
│   │   └── utils/fileWriter.ts
│   ├── output/                ← JSONs de arquitectura (gitignore)
│   ├── package.json
│   └── tsconfig.json
│
├── agente-materializador/
│   ├── src/
│   │   ├── agent.ts
│   │   ├── types.ts
│   │   └── materializers/     ← materialize{Frontend,Backend,Infra}.ts
│   ├── proyectos/             ← proyectos generados (gitignore)
│   ├── package.json
│   └── tsconfig.json
│
└── docs/
    └── arquitectura/
        ├── 01-analisis-inicial.md       ← diagnóstico y arquitectura objetivo
        ├── 02-multi-agent-pipeline.md   ← roles, presets y modelos parametrizables
        └── 03-contratos-inter-fase.md   ← contratos y reglamento de comunicación
```

---

## Arquitectura objetivo

El sistema está en transición hacia una arquitectura modular basada en **Specification-Driven Development**. Los documentos en `docs/arquitectura/` describen el diseño objetivo:

- **`PhaseSpec`** — cada fase como contrato declarativo con schema de entrada/salida, prompt y fallback tipado
- **`AgentPreset`** — combinación de rol + modelo parametrizable; diferente preset por fase
- **`PipelineContext`** — bus de datos inmutable que conecta fases sin acoplamiento directo
- **Monorepo** — `packages/shared` con contratos Zod compartidos y `packages/core` como motor de ejecución

Ver [docs/arquitectura/01-analisis-inicial.md](docs/arquitectura/01-analisis-inicial.md) para el análisis completo.
