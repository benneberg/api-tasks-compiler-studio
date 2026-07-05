# Testing Delta — API2UI Studio

## Current Testing Environment
*   **Static Checks**: Configured with `tsc --noEmit` under `npm run lint`. This validates strict type contracts, import locations, and structural assignments across all compiled TSX and TS files.
*   **Testing Status**: Static verification completes green with no compiler or styling errors.

## Recommended Testing Delta
To achieve 100% test coverage and ensure continuous delivery safety, the following test matrix should be implemented.

### 1. Ingestion Parser Unit Tests (`tests/ingestor.test.ts`)
```typescript
import { ingestSpec } from '../src/lib/compiler/ingestor';

describe('Ingestor Engine', () => {
  it('should parse valid OpenAPI spec and create entities and actions', () => {
    const spec = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths:
        /devices:
          get:
            operationId: listDevices
            summary: List all devices
    `;
    const ncg = ingestSpec(spec, 'openapi');
    expect(ncg.actions.length).toBe(1);
    expect(ncg.actions[0].id).toBe('listDevices');
  });

  it('should fallback to auto-detect AsyncAPI and HTTP traffic logs', () => {
    const traffic = 'GET /api/v1/users\nPOST /api/v1/users/create';
    const ncg = ingestSpec(traffic, 'auto');
    expect(ncg.entities.length).toBeGreaterThan(0);
    expect(ncg.actions.some(a => a.id.startsWith('get_'))).toBe(true);
  });
});
```

### 2. Semantic Diff & Drift Unit Tests (`tests/diff.test.ts`)
```typescript
import { diffNcgs } from '../src/lib/compiler/diff';
import { NCG } from '../src/types';

describe('NCG Drift Detector', () => {
  it('should identify newly added and removed entities', () => {
    const baseline: NCG = {
      entities: [{ id: 'User', name: 'User', primaryKey: 'id', endpoints: {}, filters: [], relations: [] }],
      actions: [], relations: [], authSchemes: [], fingerprint: '123'
    };
    const current: NCG = {
      entities: [{ id: 'Device', name: 'Device', primaryKey: 'id', endpoints: {}, filters: [], relations: [] }],
      actions: [], relations: [], authSchemes: [], fingerprint: '456'
    };

    const diff = diffNcgs(baseline, current);
    expect(diff.hasDrift).toBe(true);
    expect(diff.entities.added).toContain('Device');
    expect(diff.entities.removed).toContain('User');
  });
});
```

### 3. Integrated Flow Integration Tests
*   **Action Parameter Interceptor Flow**: Test the interaction state from pasting an OpenAPI spec, inputting "Fetch firmware", receiving parameter suggestions, modifying a parameter value, and verifying that the final generated IRGraph correctly maps the updated parameter.
