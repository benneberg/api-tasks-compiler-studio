# API2UI Studio

API2UI Studio is a deterministic, schema-constrained compiler that transforms REST and Event-driven API specifications into safe, transaction-controlled micro-interfaces (jdCards) using server-side intent extraction and interactive parameter validation.

## Key Features
*   **Live Re-Compilation Loop**: Ingests, normalizes, and links OpenAPI, AsyncAPI, or raw HTTP traffic specifications into a structural Normalized Capability Graph (NCG).
*   **Visual Drift & Schema Diff**: Detects schema changes between active edits and the compiled baseline, prompting users to review additions, removals, or parameter mutations.
*   **AI-Assisted Intent Compiler**: Uses Gemini (`gemini-3.5-flash`) via a secure Express proxy to map user goals to target endpoints, suggesting logical query and path parameters.
*   **Visual Staging Area**: Inspect, edit, and confirm AI-suggested parameters before final compilation, keeping operations fully safe and deterministic.
*   **Interactive DAG Viewer**: Visualizes the planned steps, entities, and parameter bindings as a connected Directed Acyclic Graph.

## Quick Start & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory (using `.env.example` as a template):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Development Server
```bash
npm run dev
```
The server will boot on port `3000` (externally accessible at http://localhost:3000).

## Usage Guide
1.  **Ingest Specification**: Paste an OpenAPI YAML/JSON schema into the INGEST editor panel.
2.  **Inspect Schema Drift**: If you make edits to your spec, the **API Schema Drift Detected** panel will highlight the differences compared to your last compiled baseline. Click **Accept Changes & Sync Baseline** to synchronize them.
3.  **Define Operational Goal**: Go to the **INTENT** tab, and enter a natural language command (e.g., *"Update device partner to 124 for organization ABC"*).
4.  **Calibrate Parameters**: Review the parameter recommendations suggested by the AI. You can directly edit the values inside the staging inputs.
5.  **Confirm & Finalize**: Click **Confirm & Finalize Intent Graph** to compile the DAG. The interface will switch to the **COMPILE** tab displaying your interactive execution tree and data bindings.

## Verification & Build
*   **Lint & Typecheck**: `npm run lint` (runs `tsc --noEmit` to verify type safety).
*   **Build Production Bundle**: `npm run build` (bundles front-end assets via Vite and wraps the Node server using esbuild into `dist/server.cjs`).
