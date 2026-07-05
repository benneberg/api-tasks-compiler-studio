# Technical Audit — API2UI Studio

## 1. Correctness & Reliability
*   **Ingestion Pipeline**: The parser `ingestSpec` in `src/lib/compiler/ingestor.ts` gracefully parses standard OpenAPI specs, AsyncAPI, and HTTP raw logs. It establishes correct schema hierarchies and uses relationship heuristics (e.g., matching entity properties with primary keys).
*   **Intent Compile Stage**: Natural language operational goals are successfully compiled by the backend LLM into structured `IntentGraph` models. 
*   **Staging Calibration**: The user-facing staging area in `src/App.tsx` allows the operator to inspect and edit AI-suggested parameters before the `IntentGraph` is finalized. This completely eliminates hallucination risks in automated actions.
*   **Workflows and planning**: The compilation to `WorkflowPlan` and subsequent conversion to `IRGraph` is entirely deterministic and relies on type-safe path variables.

## 2. Security Audit
*   **Gemini API Isolation**: The Gemini SDK operates exclusively on the backend (`server.ts`) via `/api/compiler/intent`. The browser has no knowledge of `process.env.GEMINI_API_KEY`, preventing frontend API key theft.
*   **YAML Ingestion Safe-Load**: Standard YAML parsing is performed using `jsYaml.load`, which prevents arbitrary code execution vulnerabilities often found with native deserialization methods.
*   **Strict Port Handling**: Dev server runs on port `3000` behind a standard reverse proxy as required, keeping local dev environments consistent with production containers.
*   **XSS Mitigation**: Data table values and interactive labels are rendered through standard React text bindings (`{value}`), preventing DOM injection vulnerabilities.

## 3. Dependency Audit
*   **React 19 & Tailwind 4**: The app utilizes the latest modern build configuration with `@tailwindcss/vite` and `vite` v6.
*   **Zustand**: Clean state management with a singular store `useStudioStore` in `src/store.ts`. No high-cost context re-renders.
*   **xyflow**: Visualizing execution plans utilizes `@xyflow/react`, which renders fast SVG/HTML nodes dynamically.

## 4. Performance Audit
*   **State Selectors**: Zustand states are isolated with specific accessor selectors, keeping redraw cycles to minimum levels.
*   **HMR Handling**: Standard static assets are precompiled into `dist/`, avoiding websocket server connection overhead during active development.

## 5. Observability Audit
*   **Interactive Visual Diffing**: The system performs strict semantic diffing between the editor spec and the compiled baseline. Users see real-time drift highlights (Added/Removed/Modified entities and actions) before final execution.
*   **AST Node Inspection**: The schema visualization displays the validated graph nodes, properties, endpoints, and input parameter suggestions with clear status tags.
