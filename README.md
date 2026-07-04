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