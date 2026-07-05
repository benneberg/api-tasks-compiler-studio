# Product Purpose — API2UI Studio

## Product Summary
API2UI Studio is a zero-code compilation gateway designed to map complex API capabilities directly onto safe, transaction-controlled micro-interfaces (jdCards). It bridges the gap between raw web service specifications (such as OpenAPI or AsyncAPI) and user interactions, allowing system operators to perform bulk operations and parameter customizations deterministically.

## Problem Statement
Developing customized user interfaces to execute specific, multi-step API workflows (e.g., fetching a filtered list, validating entities, and applying sequential patches with robust rollback options) is slow, repetitive, and error-prone. Standard automated dashboards either offer read-only displays or lack strict execution guardrails, increasing the risk of data corruption due to API contract drifts or user errors during manual operations.

## Target Audience
*   **API Developers & Operators (Confidence: High)**: Teams seeking an instant UI sandbox to test service integration behaviors and schema endpoints.
*   **DevOps Fleet Managers (Confidence: High)**: Operators running routine bulk changes, schema maintenance operations, and fleet configurations across thousands of connected systems.

## Value Proposition
*   **Zero Glue Code**: Converts arbitrary REST and Event specifications directly into interactive UI structures.
*   **Drift Defense**: Visual side-by-side mismatch analysis prevents execution failures when downstream schemas change.
*   **AI-Assisted Calibration**: Utilizes Gemini server-side intent analysis to identify parameters and suggest optimal values, keeping humans firmly in the validation loop before code is executed.

## Core Features
1.  **Capability Graph Linker (Verified)**: Normalizes raw spec files and clusters paths into explicit entity domains.
2.  **API Drift Inspector (Verified)**: Offers visual drift comparison against a compiled schema baseline.
3.  **Action Parameter Calibrator (Verified)**: Lets users confirm or modify parameter values suggested by the Gemini compiler before finalizing the intent graph.
4.  **Interactive DAG Planner (Verified)**: Maps complex actions to a Directed Acyclic Graph displaying step-by-step connections.
