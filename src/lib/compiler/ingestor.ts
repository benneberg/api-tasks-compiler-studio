import { NCG, Entity, Action, AuthScheme, Relation, SpecFormat } from "../../types";
import jsYaml from "js-yaml";

export function ingestOpenApi(specContent: string): NCG {
  return ingestSpec(specContent, 'openapi');
}

export function ingestSpec(specContent: string, format: SpecFormat = 'auto'): NCG {
  let detectedFormat = format;
  if (detectedFormat === 'auto') {
    if (specContent.includes('asyncapi:') || specContent.includes('channels:')) {
      detectedFormat = 'asyncapi';
    } else if (specContent.includes('HTTP/1.1') || specContent.includes('curl ') || specContent.startsWith('GET ') || specContent.startsWith('POST ')) {
      detectedFormat = 'http_traffic';
    } else {
      detectedFormat = 'openapi';
    }
  }

  const entities: Entity[] = [];
  const actions: Action[] = [];
  const authSchemes: AuthScheme[] = [];
  const relations: Relation[] = [];

  if (detectedFormat === 'asyncapi') {
    let spec: any;
    try {
      spec = jsYaml.load(specContent);
    } catch (e) {
      spec = {};
    }
    const channels = spec?.channels || {};
    const schemas = spec?.components?.schemas || {};

    Object.entries(schemas).forEach(([name, schema]: [string, any]) => {
      entities.push({
        id: name,
        name,
        primaryKey: 'id',
        schema,
        endpoints: {},
        filters: [],
        relations: []
      });
    });

    Object.entries(channels).forEach(([chName, chItem]: [string, any]) => {
      ['publish', 'subscribe'].forEach(opType => {
        if (!chItem[opType]) return;
        const op = chItem[opType];
        const actionId = op.operationId || `${opType}_${chName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const action: Action = {
          id: actionId,
          name: op.summary || actionId,
          method: opType === 'publish' ? 'POST' : 'GET',
          endpoint: {
            path: chName,
            method: opType === 'publish' ? 'POST' : 'GET',
            parameters: []
          },
          sideEffects: opType === 'publish' ? 'write' : 'none',
          semanticLabels: [opType, chName],
          idempotent: false
        };

        const msgSchemaRef = op.message?.$ref || op.message?.payload?.$ref;
        if (msgSchemaRef) {
          const targetName = msgSchemaRef.split('/').pop();
          const targetEntity = entities.find(e => e.name === targetName);
          if (targetEntity) {
            action.targetEntity = targetEntity.id;
          }
        }
        actions.push(action);
      });
    });
  } else if (detectedFormat === 'http_traffic') {
    const lines = specContent.split('\n');
    const pathSet = new Set<string>();
    lines.forEach(line => {
      const trimmed = line.trim();
      const match = trimmed.match(/^(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)/i) || trimmed.match(/curl\s+(?:-X\s+)?(GET|POST|PUT|PATCH|DELETE)?\s*([^\s]+)/i);
      if (match) {
        const method = (match[1] || 'GET').toUpperCase() as any;
        let urlPath = match[2];
        try {
          if (urlPath.startsWith('http')) {
            urlPath = new URL(urlPath).pathname;
          }
        } catch (e) {}
        
        const cleanPath = urlPath.split('?')[0];
        const segs = cleanPath.split('/').filter(Boolean);
        const entityName = segs[0] ? segs[0].charAt(0).toUpperCase() + segs[0].slice(1).replace(/s$/, '') : 'Resource';
        
        let entity = entities.find(e => e.name === entityName);
        if (!entity) {
          entity = {
            id: entityName,
            name: entityName,
            primaryKey: 'id',
            schema: { type: 'object', properties: { id: { type: 'string' } } },
            endpoints: {},
            filters: [],
            relations: []
          };
          entities.push(entity);
        }

        const actionId = `${method.toLowerCase()}_${cleanPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
        if (!actions.find(a => a.id === actionId)) {
          actions.push({
            id: actionId,
            name: `${method} ${cleanPath}`,
            method,
            endpoint: { path: cleanPath, method, parameters: [] },
            sideEffects: method === 'GET' ? 'none' : 'write',
            semanticLabels: [entityName],
            idempotent: ['GET', 'PUT', 'DELETE'].includes(method),
            targetEntity: entity.id
          });
        }
      }
    });
  } else {
    // Standard OpenAPI
    let spec: any;
    try {
      spec = jsYaml.load(specContent);
    } catch (e) {
      spec = {};
    }
    const paths = spec?.paths || {};

    if (spec?.components?.securitySchemes) {
      Object.entries(spec.components.securitySchemes).forEach(([id, scheme]: [string, any]) => {
        const authScheme: AuthScheme = {
          id,
          type: scheme.type === 'http' ? (scheme.scheme === 'bearer' ? 'bearer' : 'basic') : scheme.type as any,
          name: id,
          config: {}
        };

        if (scheme.type === 'apiKey') {
          authScheme.config = {
            apiKey: {
              location: scheme.in === 'header' ? 'header' : 'query',
              name: scheme.name
            }
          };
        } else if (scheme.type === 'oauth2') {
          const flow = scheme.flows?.authorizationCode || scheme.flows?.implicit || Object.values(scheme.flows || {})[0];
          if (flow) {
            authScheme.config = {
              oauth2: {
                authUrl: flow.authorizationUrl,
                tokenUrl: flow.tokenUrl,
                refreshUrl: flow.refreshUrl,
                scopes: Object.keys(flow.scopes || {}),
                clientId: ''
              }
            };
          }
        }
        authSchemes.push(authScheme);
      });
    }

    const schemas = spec?.components?.schemas || {};
    Object.entries(schemas).forEach(([name, schema]: [string, any]) => {
      entities.push({
        id: name,
        name,
        primaryKey: 'id',
        schema,
        endpoints: {},
        filters: [],
        relations: []
      });
    });

    Object.entries(paths).forEach(([path, pathItem]: [string, any]) => {
      Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) return;

        const actionId = operation.operationId || `${method}_${path.replace(/\//g, '_')}`;
        const action: Action = {
          id: actionId,
          name: operation.summary || actionId,
          method: method.toUpperCase() as any,
          endpoint: {
            path,
            method: method.toUpperCase(),
            parameters: (operation.parameters || []).map((p: any) => ({
              name: p.name,
              in: p.in,
              required: p.required,
              schema: p.schema
            }))
          },
          sideEffects: method.toLowerCase() === 'get' ? 'none' : 'write',
          semanticLabels: operation.tags || [],
          idempotent: ['get', 'put', 'delete'].includes(method.toLowerCase())
        };

        const targetEntity = entities.find(e => 
          operation.tags?.includes(e.name) || 
          operation.summary?.toLowerCase().includes(e.name.toLowerCase())
        );

        if (targetEntity) {
          action.targetEntity = targetEntity.id;
          if (method === 'get' && !path.includes('{')) targetEntity.endpoints.list = action.endpoint;
          if (method === 'get' && path.includes('{')) targetEntity.endpoints.get = action.endpoint;
          if (method === 'post') targetEntity.endpoints.create = action.endpoint;
          if (method === 'put' || method === 'patch') targetEntity.endpoints.update = action.endpoint;
          if (method === 'delete') targetEntity.endpoints.delete = action.endpoint;
        }
        actions.push(action);
      });
    });
  }

  // --- Relationship Inference Algorithm ---
  entities.forEach(fromEntity => {
    const props = fromEntity.schema?.properties || fromEntity.schema?.items?.properties || {};
    Object.entries(props).forEach(([propName, propSchema]: [string, any]) => {
      // Check 1: Foreign key heuristic (e.g. authorId, device_id, orgRef)
      const isFkMatch = propName.match(/^([a-zA-Z0-9]+)(?:Id|_id|Ref)$/);
      if (isFkMatch) {
        const targetCandidateName = isFkMatch[1];
        const toEntity = entities.find(e => 
          e.id !== fromEntity.id && 
          e.name.toLowerCase() === targetCandidateName.toLowerCase()
        );
        if (toEntity) {
          const rel: Relation = {
            fromEntity: fromEntity.id,
            toEntity: toEntity.id,
            type: 'many_to_one',
            foreignKey: propName
          };
          if (!fromEntity.relations.find(r => r.toEntity === toEntity.id && r.foreignKey === propName)) {
            fromEntity.relations.push(rel);
            relations.push(rel);
          }
          // Inverse one_to_many
          const invRel: Relation = {
            fromEntity: toEntity.id,
            toEntity: fromEntity.id,
            type: 'one_to_many',
            foreignKey: propName
          };
          if (!toEntity.relations.find(r => r.toEntity === fromEntity.id && r.foreignKey === propName)) {
            toEntity.relations.push(invRel);
            relations.push(invRel);
          }
        }
      }

      // Check 2: Array item reference heuristic
      if (propSchema.type === 'array' && propSchema.items?.$ref) {
        const refName = propSchema.items.$ref.split('/').pop();
        const toEntity = entities.find(e => e.name === refName && e.id !== fromEntity.id);
        if (toEntity) {
          // Check if target also has array pointing back -> many_to_many
          const targetProps = toEntity.schema?.properties || {};
          let isManyToMany = false;
          Object.values(targetProps).forEach((tp: any) => {
            if (tp.type === 'array' && tp.items?.$ref?.endsWith(fromEntity.name)) {
              isManyToMany = true;
            }
          });

          const relType = isManyToMany ? 'many_to_many' : 'one_to_many';
          const rel: Relation = {
            fromEntity: fromEntity.id,
            toEntity: toEntity.id,
            type: relType,
            foreignKey: propName
          };
          if (!fromEntity.relations.find(r => r.toEntity === toEntity.id)) {
            fromEntity.relations.push(rel);
            relations.push(rel);
          }
        }
      }
    });
  });

  function computeFingerprint(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `fp_${Math.abs(hash).toString(16)}_${str.length}`;
  }

  return {
    entities,
    actions,
    relations,
    authSchemes,
    fingerprint: computeFingerprint(specContent)
  };
}
