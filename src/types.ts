/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from "@google/genai";

// --- Normalized Capability Graph (NCG) ---

export type NCG = {
  entities: Entity[];
  actions: Action[];
  relations: Relation[];
  authSchemes: AuthScheme[];
  fingerprint: string;
};

export type Entity = {
  id: string;
  name: string;
  primaryKey: string;
  schema: any; 
  endpoints: {
    list?: EndpointRef;
    get?: EndpointRef;
    create?: EndpointRef;
    update?: EndpointRef;
    delete?: EndpointRef;
  };
  filters: FilterCapability[];
  relations: Relation[];
};

export type EndpointRef = {
  path: string;
  method: string;
  parameters: Parameter[];
};

export type Parameter = {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  schema: any;
};

export type Action = {
  id: string;
  name: string;
  endpoint: EndpointRef;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  sideEffects: 'none' | 'read' | 'write' | 'destructive';
  inputSchema?: any;
  outputSchema?: any;
  targetEntity?: string;
  semanticLabels: string[];
  idempotent: boolean;
};

export type FilterCapability = {
  paramName: string;
  type: string;
  enumValues?: any[];
  description?: string;
};

export type Relation = {
  fromEntity: string;
  toEntity: string;
  type: 'one_to_many' | 'many_to_one' | 'many_to_many' | 'one_to_one';
  foreignKey?: string;
};

export type AuthScheme = {
  id: string;
  type: 'bearer' | 'basic' | 'apiKey' | 'oauth2';
  name?: string; // e.g. "Authorization", "api_key"
  in?: 'header' | 'query';
  config?: {
    apiKey?: {
      location: 'header' | 'query';
      name: string;
    };
    oauth2?: {
      authUrl: string;
      tokenUrl: string;
      refreshUrl?: string;
      scopes: string[];
      clientId: string;
      clientSecret?: string; // Server-side only
    };
  };
};

export type AuthState = {
  schemeId: string;
  isAuthenticated: boolean;
  credentials?: {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
};

export type GoalRefinement = {
  clarifyingQuestions: string[];
  suggestedGoal: string;
  ambiguities: string[];
};

// --- Intermediate Representation (IR) ---

export type IRGraph = {
  version: string;
  nodes: IRNode[];
  edges: IREdge[];
  contextSchema: any;
  metadata: {
    schemaFingerprint: string;
    targetEntities: string[];
    originalGoal: string;
  };
};

export type IRNode = {
  id: string;
  type: IRNodeType;
  config: Record<string, any>;
  execution: ExecutionSemantics;
  inputs: PortDefinition;
  outputs: PortDefinition;
  errorHandling: ErrorPolicy;
  onSuccess?: string;
  onFailure?: string;
  position?: { x: number; y: number }; // For visual layout
};

export type IRNodeType = 
  | 'query' 
  | 'filter' 
  | 'selection' 
  | 'transform' 
  | 'mutation' 
  | 'scheduler' 
  | 'approval' 
  | 'notification' 
  | 'export' 
  | 'ai_assistant';

export type ExecutionSemantics = {
  mode: 'immediate' | 'batch' | 'scheduled' | 'approval_gated' | 'dry_run';
  requiresConfirmation: boolean;
  idempotent: boolean;
  retryPolicy: 'none' | 'exponential' | 'linear';
  maxRetries: number;
  pagination?: { strategy: 'offset' | 'cursor'; totalPath?: string; };
};

export type ErrorPolicy = {
  onFailure: 'abort' | 'skip' | 'fallback';
  fallbackNodeId?: string;
};

export type PortDefinition = {
  type: 'array' | 'object' | 'primitive' | 'void';
  itemSchemaRef?: string;
};

export type IREdge = {
  fromNodeId: string;
  toNodeId: string;
  mapping: Record<string, string>;
};

// --- Intent and Plan ---

export type IntentGraph = {
  goal: string;
  entities: string[];
  actions: string[];
  constraints: string[];
};

export type WorkflowPlan = {
  steps: {
    id: string;
    actionId?: string;
    entityId?: string;
    type: string;
    description: string;
    dependsOn: string[];
  }[];
};

// --- Ingestion Formats & Enrichment ---

export type SpecFormat = 'openapi' | 'asyncapi' | 'http_traffic' | 'auto';

export type UIEnrichmentItem = {
  label: string;
  description: string;
  tooltip: string;
};

export type UIEnrichmentMap = Record<string, UIEnrichmentItem>;

// --- Debugger State ---

export type DebugStepEvent = {
  nodeId: string;
  timestamp: number;
  inputData: any;
  outputData: any;
  status: 'running' | 'success' | 'failure' | 'breakpoint';
};

