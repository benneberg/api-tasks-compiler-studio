# System Architecture — API2UI Studio

## 1. System Components
API2UI Studio uses a decoupled multi-layer compiler design:

*   **Ingestion AST Engine (`src/lib/compiler/ingestor.ts`)**: Parses JSON/YAML spec formats and extracts a standardized Normalized Capability Graph (NCG) comprising typed Entities and Actions.
*   **Visual Drift Diff Core (`src/lib/compiler/diff.ts`)**: Compares a modified NCG with the baseline compiled schema to pinpoint added, removed, or modified properties and endpoints.
*   **Intent Extraction & Parameter Suggester (`server.ts` & Gemini API)**: Proxies user requests server-side to identify semantic operations, relevant entities, constraints, and suggested query/path parameter values.
*   **Deterministic Planner (`src/lib/compiler/planner.ts`)**: Creates the formal sequential step-by-step `WorkflowPlan` and translates it into an executable Intermediate Representation Graph (`IRGraph`).
*   **Interactive React Cockpit (`src/App.tsx`)**: Receptive UI wrapper offering side-by-side editing, drift synchronization controls, staging calibration inputs, and a interactive graph representation.

## 2. Core Data Flow & Source of Truth
The specification content inside the editor acts as the supreme source of truth:

```
[OpenAPI Editor Spec] ---> Ingest & Validate ---> [Current NCG (Normalized Capability Graph)]
                                                        |
                                            (Diff with Compiled Baseline)
                                                        |
                                                        v
                                            [Visual Drift Comparison Panel]
                                                        |
               (Natural Language Input)                 |
                         |                              v
                         v                  [Gemini Server-Side Parser]
           [Staging Parameter Calibration] <------------+
                         |
                 (Confirm & Finalize)
                         |
                         v
             [Deterministic Planner IR] ---> [Interactive DAG Projection]
```

## 3. Integrations
*   **Gemini API (@google/genai)**: Handled exclusively in the Express backend using `gemini-3.5-flash` with a strict JSON schema contract. It parses user intent and outputs query/path variable suggestions without runtime execution authority.
*   **xyflow / react**: Renders structural plan steps as connected graph canvas nodes dynamically.

## 4. Observability & Auditing
*   **Before/After Schema Comparison**: Highlight modifications directly on-screen when schemas drift.
*   **Parameter Logs**: Displays configured parameter properties explicitly linked to each executable step block in the compilation output panel.

## 5. Confidence Ratings
*   **System Integrity**: High (Strong structural schemas prevent undefined transitions).
*   **Data Consistency**: High (Zustand client-side state acts as a single source of truth).
*   **AI Suggestion Correctness**: Medium-High (Constrained JSON response schemas prevent model output hallucinations).
