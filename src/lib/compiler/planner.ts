import { NCG, IntentGraph, WorkflowPlan, IRGraph, IRNode, IREdge } from "../../types";

export function planWorkflow(intent: IntentGraph, ncg: NCG): WorkflowPlan {
  const steps: WorkflowPlan['steps'] = [];

  // Very basic deterministic planning:
  // 1. For each entity in intent, add a query/list step
  // 2. For each action in intent, add a mutation step
  
  intent.entities.forEach(entityId => {
    const entity = ncg.entities.find(e => e.id === entityId || e.name === entityId);
    if (entity) {
      steps.push({
        id: `query_${entity.id}`,
        entityId: entity.id,
        type: 'query',
        description: `Fetch list of ${entity.name}`,
        dependsOn: []
      });
    }
  });

  intent.actions.forEach(actionId => {
    const action = ncg.actions.find(a => a.id === actionId || a.name === actionId);
    if (action) {
      // Mutations usually depend on a selection from a query
      const relatedQuery = steps.find(s => s.entityId === action.targetEntity);
      steps.push({
        id: `mutate_${action.id}`,
        actionId: action.id,
        type: 'mutation',
        description: `Perform ${action.name}`,
        dependsOn: relatedQuery ? [relatedQuery.id] : []
      });
    }
  });

  return { steps };
}

export function buildIR(plan: WorkflowPlan, ncg: NCG, originalGoal: string, intent?: IntentGraph): IRGraph {
  const nodes: IRNode[] = [];
  const edges: IREdge[] = [];

  plan.steps.forEach((step, index) => {
    const node: IRNode = {
      id: step.id,
      type: step.type as any,
      config: {},
      execution: {
        mode: 'immediate',
        requiresConfirmation: step.type === 'mutation',
        idempotent: false,
        retryPolicy: 'exponential',
        maxRetries: 3
      },
      inputs: { type: 'void' },
      outputs: { type: 'object' },
      errorHandling: { onFailure: 'abort' },
      onSuccess: plan.steps[index + 1]?.id || 'END',
      onFailure: 'TRIGGER_SAGA_ROLLBACK',
      position: { x: 100, y: 100 + index * 150 }
    };

    if (step.type === 'query' && step.entityId) {
      const entity = ncg.entities.find(e => e.id === step.entityId);
      const queryParams = intent?.parameters?.filter(p => p.actionId === step.id) || [];
      node.config = { 
        entityId: step.entityId, 
        endpoint: entity?.endpoints.list,
        parameters: queryParams
      };
      node.outputs = { type: 'array', itemSchemaRef: step.entityId };
    }

    if (step.type === 'mutation' && step.actionId) {
      const action = ncg.actions.find(a => a.id === step.actionId);
      const actionParams = intent?.parameters?.filter(p => p.actionId === step.actionId) || [];
      node.config = { 
        actionId: step.actionId, 
        action,
        parameters: actionParams
      };
      node.inputs = { type: 'array', itemSchemaRef: action?.targetEntity };
    }

    nodes.push(node);

    step.dependsOn.forEach(depId => {
      edges.push({
        fromNodeId: depId,
        toNodeId: step.id,
        mapping: {} // Passthrough by default
      });
    });
  });

  return {
    version: "1.0.0",
    nodes,
    edges,
    contextSchema: {},
    metadata: {
      schemaFingerprint: ncg.fingerprint,
      targetEntities: plan.steps.map(s => s.entityId).filter(Boolean) as string[],
      originalGoal
    }
  };
}
