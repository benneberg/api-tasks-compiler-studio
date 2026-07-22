import { describe, it, expect } from 'vitest';
import { ingestOpenApi, ingestSpec } from '../src/lib/compiler/ingestor';
import { diffNcgs } from '../src/lib/compiler/diff';
import { planWorkflow, buildIR } from '../src/lib/compiler/planner';
import { buildJdCardArtifact, generateReactComponentBundle } from '../src/lib/compiler/export';
import { NCG, IntentGraph } from '../src/types';

describe('API2UI Compiler Pipeline', () => {
  const CANONICAL_SPEC = `
openapi: 3.0.0
info:
  title: Fleet Management API
  version: 1.0.0
paths:
  /devices:
    get:
      operationId: getDevices
      summary: List fleet devices
      parameters:
        - name: organization
          in: query
          required: true
          schema:
            type: string
        - name: partnerId
          in: query
          required: false
          schema:
            type: string
        - name: platform
          in: query
          required: false
          schema:
            type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    firmwareVersion:
                      type: integer
                    platform:
                      type: string
  /devices/{id}/firmware:
    put:
      operationId: updateDeviceFirmware
      summary: Update device firmware version
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                targetVersion:
                  type: integer
      responses:
        '200':
          description: Updated
`;

  it('1. Ingestor: should parse OpenAPI spec into normalized NCG with entities and actions', () => {
    const ncg = ingestOpenApi(CANONICAL_SPEC);
    expect(ncg).toBeDefined();
    expect(ncg.actions.length).toBeGreaterThanOrEqual(2);
    
    const getDevicesAction = ncg.actions.find(a => a.id === 'getDevices');
    expect(getDevicesAction).toBeDefined();
    expect(getDevicesAction?.endpoint?.parameters.some(p => p.name === 'organization')).toBe(true);

    const updateAction = ncg.actions.find(a => a.id === 'updateDeviceFirmware');
    expect(updateAction).toBeDefined();
    expect(updateAction?.endpoint?.parameters.some(p => p.name === 'id')).toBe(true);
  });

  it('2. Ingestor: should support auto-detecting raw HTTP traffic logs', () => {
    const traffic = `GET /api/v1/devices?org=ABC
POST /api/v1/devices/upgrade`;
    const ncg = ingestSpec(traffic, 'auto');
    expect(ncg.actions.length).toBeGreaterThanOrEqual(2);
  });

  it('3. Visual Diff: should detect drift when schema is modified', () => {
    const baselineNCG = ingestOpenApi(CANONICAL_SPEC);
    
    const MODIFIED_SPEC = CANONICAL_SPEC.replace(
      'type: integer',
      'type: string'
    ) + `
  /devices/{id}/reboot:
    post:
      operationId: rebootDevice
      summary: Reboot device
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
`;
    const modifiedNCG = ingestOpenApi(MODIFIED_SPEC);

    const diff = diffNcgs(baselineNCG, modifiedNCG);
    expect(diff.hasDrift).toBe(true);
    expect(diff.actions.added.length).toBeGreaterThan(0);
  });

  it('4. Deterministic Planner: should generate a WorkflowPlan and Execution IR DAG for Canonical Intent', () => {
    const ncg = ingestOpenApi(CANONICAL_SPEC);

    const intent: IntentGraph = {
      goal: 'Update all Tizen devices provisioned to partner 124 in organization ABC with firmware version lower than 100',
      entities: ['Device'],
      actions: ['getDevices', 'updateDeviceFirmware'],
      constraints: ['platform = tizen', 'partnerId = 124', 'firmwareVersion < 100'],
      parameters: [
        { actionId: 'getDevices', paramName: 'organization', in: 'query', suggestedValue: 'ABC', description: 'Target Organization' },
        { actionId: 'getDevices', paramName: 'partnerId', in: 'query', suggestedValue: '124', description: 'Target Partner ID' },
        { actionId: 'getDevices', paramName: 'platform', in: 'query', suggestedValue: 'tizen', description: 'Target Platform' },
        { actionId: 'updateDeviceFirmware', paramName: 'id', in: 'path', suggestedValue: '{{item.id}}', description: 'Device ID vector' }
      ]
    };

    const plan = planWorkflow(intent, ncg);
    expect(plan.steps.length).toBeGreaterThan(0);

    const ir = buildIR(plan, ncg, intent.goal, intent);
    expect(ir.nodes.length).toBeGreaterThan(0);
    expect(ir.metadata.originalGoal).toBe(intent.goal);
    expect(ir.nodes[0].config.parameters?.some(p => p.paramName === 'organization' && p.suggestedValue === 'ABC')).toBe(true);

    // Test Export
    const artifact = buildJdCardArtifact(ir, intent, 'Canonical Firmware Updater');
    expect(artifact.id).toContain('card_');
    expect(artifact.metadata.title).toBe('Canonical Firmware Updater');

    const bundleCode = generateReactComponentBundle(artifact);
    expect(bundleCode).toContain('export default function JdCardRunner');
    expect(bundleCode).toContain('Canonical Firmware Updater');
  });
});
