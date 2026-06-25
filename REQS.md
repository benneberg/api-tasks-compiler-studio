# API2UI Studio Core Design Doctrine

This specification operationalizes the **API2UI Studio** (API TaskApp Compiler Studio) Core Design Doctrine. It integrates the structural validation paradigms established in your Version 4.0 prototype—specifically **Live Hot-Reloading Compilation, Dependent Data Chaining, Saga-Pattern Fault Tolerance, and Before/After Telemetry Audits**—into a production blueprint.

## 1. Grounded Product Requirements Document (PRD)

### 1.1 Core Vision & System Boundaries
API2UI Studio is a deterministic, schema-constrained operational compiler. It translates structural API semantics into isolated, atomic user applications called **jdCards**. The platform explicitly isolates Large Language Models (LLMs) from runtime execution authority. The LLM acts solely as a linguistic translator that maps natural language requests into structured intent blocks, which are then passed to a strict, deterministic compiler pipeline.

```
[OpenAPI Spec] ---> (Capability Graph) 
                           |
[Natural Intent] -> [LLM Intent Matcher] -> (Planning IR) -> [Deterministic Compiler] -> (Execution DAG) + (UI IR) -> [jdCard]
```

### 1.2 Target Metrics & Success Criteria
The system is technically validated when the **Canonical Scenario** runs from end to end without manually written glue code:
 * **Input Intent**: *"Update all Tizen devices provisioned to partner 124 in organization ABC with firmware version lower than 100."*
 * **System Action**: The system ingests an OpenAPI spec, automatically targets the Device entity, extracts the correct query parameters (organization, partnerId, platform), infers the conditional filtration property (firmwareVersion < 100), synthesizes a multi-step execution Directed Acyclic Graph (DAG), projects a corresponding responsive data-table/filtering UI, performs an out-of-band dry run to return an *Affected Count Telemetry Diff*, and awaits explicit confirmation before executing the change through a safe transaction pipeline.

### 1.3 Detailed Functional Requirements

#### Layer 1: Ingestion & Live Re-Compilation Loop
 * **Functional Spec**: The workspace must maintain a hot-reloading parser that watches an OpenAPI JSON/YAML payload. Any change to the schema must immediately invalidate the internal token cache and trigger a re-compilation of the system's **Capability Graph**.
 * **Validation Rule**: If an invalid OpenAPI document is provided, the UI must display a precise line-level syntax error badge and freeze down-stream state projection to prevent memory corruption.

#### Layer 2: LLM-Bounded Intent Extraction
 * **Functional Spec**: The natural language input interface sends the user’s prompt alongside a minified schema map of the Capability Graph to the LLM (configured at temperature: 0).
 * **Output Constraint**: The LLM must return a strict JSON block matching the system’s schema structure. It must only identify:
   1. The targeted semantic entity nodes.
   2. The key-value restriction parameters.
   3. The requested state mutation operation.

#### Layer 3: Two-Stage Compiler Framework (Planning to Execution IR)
 * **Functional Spec**: The compiler processes the intent map through a strict two-stage translation:
   * **Stage A (Planning IR)**: An abstract semantic sequence that outlines entity dependencies (e.g., Fetch IDs -> Filter Dataset -> Execute Patch).
   * **Stage B (Execution IR)**: A fully concrete Directed Acyclic Graph (DAG) with explicit variable bindings, dynamic output parameter mappings (e.g., passing {{Steps.1.Outputs.body.id}} down-funnel into a path vector parameter), parameter validation blocks, and explicit **Compensation Nodes** for error rollbacks.

#### Layer 4: Schema-Driven UI Projection
 * **Functional Spec**: The system maps the output schemas of the Execution IR onto a hardcoded, rigid UI registry.
 * **Component Registry Constraints**: Components are limited to semantic primitives: Data-Table, Filter-Group, Interactive-Form-Field, Metric-Card, and Action-Trigger-Button. Freeform layout design, arbitrary absolute positioning, and generative styling are strictly banned.

#### Layer 5: Fault-Tolerant Runtime & Saga Framework
 * **Functional Spec**: All operations that alter state must execute inside an isolated transactional worker implementing a Saga pattern.
 * **Saga Requirements**: Every mutation node inside the Execution IR must map to an inverse compensation node defined in the OpenAPI spec metadata (e.g., POST /store/order requires a corresponding rollback step like DELETE /store/order/{id}). If any step fails, the runtime must halt forward progression, show a failure state in the UI, and run the compensation steps in reverse order to return the system to its baseline configuration.

## 2. System Architecture Specification

### 2.1 The Core Compilation Pipeline Data Flow
The system processes data linearly through six decoupled execution blocks. Each phase operates on typed, auditable JSON payloads.

```
+------------------+     +--------------------+     +-----------------+
|   OpenAPI Spec   | --> |  Capability Graph  | --> |   Intent Map    |
|   (JSON/YAML)    |     |   (Inferred Nodes) |     |  (LLM Generated)|
+------------------+     +--------------------+     +-----------------+
                                                              |
+------------------+     +--------------------+               v
|      jdCard      | <-- |   Execution IR     | <-- |   Planning IR   |
| (UI IR + Target) |     | (DAG + Rollbacks)  |     | (Abstract Steps)|
+------------------+     +--------------------+     +-----------------+
```

### 2.2 Formal Structural Definitions (The jdCard Blueprint)
The standard output format of the API2UI compiler is a jdCard artifact. The following interface structure defines its schema configuration:

```json
{
  "$schema": "https://api2ui.dev/schemas/v1/jdcard.json",
  "id": "card_tizen_firmware_upgrade_2026",
  "version": "1.0.0",
  "metadata": {
    "title": "Automated Tizen Firmware Updater",
    "targetDomain": "Fleet Management",
    "compiledAt": "2026-05-26T04:40:00Z"
  },
  "capabilitiesMode": "WRITE_SESSION_REQUIRED",
  "contracts": {
    "inboundIntent": "Update all Tizen devices provisioned to partner 124 in organization ABC with firmware version lower than 100",
    "expectedEntity": "Device"
  },
  "executionGraph": {
    "rootNode": "node_01_fetch_devices",
    "nodes": {
      "node_01_fetch_devices": {
        "operationId": "getDevices",
        "verb": "GET",
        "path": "/devices",
        "parameters": {
          "organization": "ABC",
          "partnerId": "124",
          "platform": "tizen"
        },
        "exports": {
          "deviceList": "response.body.items"
        },
        "onSuccess": "node_02_filter_dataset",
        "onFailure": null
      },
      "node_02_filter_dataset": {
        "operationId": "localTransform",
        "verb": "TRANSFORM",
        "expression": "deviceList.filter(d => d.firmwareVersion < 100)",
        "exports": {
          "filteredIds": "output.map(d => d.id)",
          "affectedCount": "output.length"
        },
        "onSuccess": "node_03_patch_firmware",
        "onFailure": null
      },
      "node_03_patch_firmware": {
        "operationId": "upgradeFirmware",
        "verb": "POST",
        "path": "/devices/{deviceId}/upgrade",
        "iterator": "filteredIds",
        "parameters": {
          "deviceId": "{{iterator.item}}",
          "firmwareVersion": "100"
        },
        "compensation": {
          "verb": "POST",
          "path": "/devices/{deviceId}/rollback-firmware",
          "parameters": {
            "deviceId": "{{iterator.item}}",
            "targetVersion": "{{iterator.meta.previousVersion}}"
          }
        },
        "onSuccess": "node_final_audit_log",
        "onFailure": "TRIGGER_SAGA_ROLLBACK"
      },
      "node_final_audit_log": {
        "operationId": "writeLog",
        "verb": "LOCAL_LOG",
        "message": "Successfully updated {{node_02_filter_dataset.exports.affectedCount}} devices.",
        "onSuccess": "END",
        "onFailure": "END"
      }
    }
  },
  "uiProjection": {
    "layout": "vertical-stack",
    "components": [
      {
        "id": "summary_metric",
        "type": "Metric-Card",
        "bindings": {
          "label": "Targeted Devices Flashed",
          "value": "{{node_02_filter_dataset.exports.affectedCount}}"
        }
      },
      {
        "id": "preview_table",
        "type": "Data-Table",
        "bindings": {
          "dataSource": "{{node_01_fetch_devices.exports.deviceList}}",
          "columns": ["id", "name", "platform", "firmwareVersion"]
        }
      },
      {
        "id": "trigger_action",
        "type": "Action-Trigger-Button",
        "properties": {
          "label": "Execute Bulk Operational Firmware Upgrade",
          "requiresConfirmation": true,
          "variant": "destructive"
        },
        "events": {
          "onClick": "START_GRAPH_EXECUTION"
        }
      }
    ]
  }
}
```

## 3. Repository Structure
This codebase uses modular, framework-free design patterns. It relies on clean, decoupled standard ES6 modules to protect the compiler loop from framework deprecation cycles.

```
api2ui-studio/
├── .github/                     # Operational automation and testing workflows
├── assets/                      # Static layout icons and styling base tokens
├── docs/                        # Formal specifications and architectural logs
├── spec/                        # Strict JSON schemas checking intermediate IR representations
│   ├── capability-graph.schema.json
│   ├── execution-ir.schema.json
│   └── jdcard.schema.json
├── src/                         # Unified Compiler Source Space
│   ├── main.js                  # Application entry bootstrap hook
│   ├── compiler/                # Core Lexical and Topology Engineering Area
│   │   ├── openapi-parser.js    # Ingests, normalizes, and repairs OpenAPI files
│   │   └── capability-linker.js # Synthesizes the indexed tree graph
│   ├── planner/                 # Linguistic Transformation Modules
│   │   ├── intent-extractor.js  # Bounded, schema-constrained zero-temp LLM mapping bridge
│   │   └── dag-compiler.js      # Translates intent maps into concrete execution graphs
│   ├── renderer/                # Rigid UI Projection System
│   │   ├── component-registry.js# Central repository of UI primitives
│   │   └── viewport-engine.js   # Evaluates schema fields and projects UI interfaces
│   ├── runtime/                 # Safe State & Transaction Runner
│   │   ├── saga-executor.js     # Manages asynchronous pipelines and forward/backward rollbacks
│   │   └── http-client-mock.js  # Sandboxed network client with chaos simulation capabilities
│   └── storage/                 # Data Layer Core
│       └── indexed-db-driver.js # Manages local history and saves compiled jdCards
├── tests/                       # Functional Test Matrices
│   ├── canonical-scenario.test.js # Core verification tests for the firmware update process
│   ├── openapi-fixtures.json    # Standard and broken OpenAPI files used for testing
│   └── saga-rollback.test.js    # Automated tests for error injection and recovery
└── index.html                   # Central management cockpit template UI
```

## 4. Implementation Phases & Milestones

```
[Phase 1: Ingestion] ---> [Phase 2: Intent Pass] ---> [Phase 3: Projection] ---> [Phase 4: Saga Validation]
 (Spec -> Graph)           (Intent -> DAG)            (Schema -> UI UI)            (Chaos Testing)
```

### Phase 1: Ingestion & Capability Topology Mapping (Weeks 1–2)
 * **Goal**: Ingest non-standard or malformed OpenAPI specifications and construct an auditable dependency map.
 * **Deliverables**:
   * An input processor module (openapi-parser.js) that automatically repairs missing operationId tags and normalizes raw JSON/YAML inputs.
   * A schema engine (capability-linker.js) that organizes paths into explicit entity clusters (Device, Order, Pet) and indexes their queries, query parameters, and structural mutations.

### Phase 2: Bounded Intent Extraction & Two-Stage Compiler (Weeks 3–4)
 * **Goal**: Convert unstructured natural language strings into a concrete execution DAG without giving the LLM execution control.
 * **Deliverables**:
   * A structured prompt generator (intent-extractor.js) that packages user intent along with minified entity definitions, returning a strictly constrained JSON plan object.
   * A dependency resolver engine (dag-compiler.js) that processes the JSON plan, maps references down the data funnel, hooks variable parameters into downstream steps (e.g., {{Step.1.Outputs.id}}), and attaches corresponding compensation steps.

### Phase 3: Schema-Driven UI Projection (Weeks 5–6)
 * **Goal**: Project structured UI components from schema fields and data arrays, enforcing 44px mobile-first tap targets without visual design systems or arbitrary code generation.
 * **Deliverables**:
   * A data-binding pipeline (viewport-engine.js) that parses the properties of a jdCard and generates structural layouts based on schema data shapes.
   * A rigid UI library (component-registry.js) that renders explicit primitives (Data-Table, Metric-Card) directly into the workspace DOM using responsive, accessible layouts.

### Phase 4: Fault-Tolerant Runtime & Technical Validation (Weeks 7–8)
 * **Goal**: Run complex transaction steps against mock or real endpoints while maintaining an isolated, safe, and verifiable state runtime.
 * **Deliverables**:
   * An execution runtime (saga-executor.js) that handles step resolution, displays loading indicators, and prints real-time logs to the console workspace.
   * A transaction monitoring system that generates side-by-side snapshots displaying system variables before and after pipeline runs.
   * A test runner dashboard featuring toggle controls to simulate network dropped packets and unexpected error rollbacks.

### Core Verification Checklist for Code Reviews
Before promoting an intermediate feature branch into the master workspace tree, verify it adheres to these system constraints:
>  1. **Zero Runtime AI Exposure**: Does this feature give an unconstrained LLM direct control over runtime loops or code generation? If yes, reject the pull request.
>  2. **Structural Validation Checks**: Do all compiler transitions validate against their corresponding system schemas?
>  3. **Framework Independence**: Is the core pipeline decoupled from temporary framework dependencies, relying instead on clean, standard ES6 JavaScript modules?
>  4. **Compensation Safety**: Does every new state-altering mutation node feature an inverse structural rollback path to handle unexpected execution failures?
