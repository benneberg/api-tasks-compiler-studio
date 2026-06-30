import { NCG, Entity, Action } from "../../types";

export interface EntityChange {
  id: string;
  changes: string[];
}

export interface ActionChange {
  id: string;
  changes: string[];
}

export interface NcgDiffResult {
  hasDrift: boolean;
  entities: {
    added: string[];
    removed: string[];
    modified: EntityChange[];
  };
  actions: {
    added: string[];
    removed: string[];
    modified: ActionChange[];
  };
}

export function diffNcgs(oldNcg: NCG | null, newNcg: NCG | null): NcgDiffResult {
  const result: NcgDiffResult = {
    hasDrift: false,
    entities: { added: [], removed: [], modified: [] },
    actions: { added: [], removed: [], modified: [] }
  };

  if (!oldNcg || !newNcg) {
    return result;
  }

  if (oldNcg.fingerprint === newNcg.fingerprint) {
    return result;
  }

  // Diff Entities
  const oldEntitiesMap = new Map<string, Entity>(oldNcg.entities.map(e => [e.id, e]));
  const newEntitiesMap = new Map<string, Entity>(newNcg.entities.map(e => [e.id, e]));

  for (const [id, newEnt] of newEntitiesMap) {
    if (!oldEntitiesMap.has(id)) {
      result.entities.added.push(newEnt.name || id);
    } else {
      const oldEnt = oldEntitiesMap.get(id)!;
      const changes: string[] = [];

      // Check primary key
      if (oldEnt.primaryKey !== newEnt.primaryKey) {
        changes.push(`Primary key changed from '${oldEnt.primaryKey}' to '${newEnt.primaryKey}'`);
      }

      // Check schema properties
      const oldProps = oldEnt.schema?.properties || {};
      const newProps = newEnt.schema?.properties || {};

      for (const propName in newProps) {
        if (!(propName in oldProps)) {
          changes.push(`Property '${propName}' (type: ${newProps[propName]?.type || 'any'}) was added`);
        } else if (oldProps[propName]?.type !== newProps[propName]?.type) {
          changes.push(`Property '${propName}' type changed from '${oldProps[propName]?.type}' to '${newProps[propName]?.type}'`);
        }
      }

      for (const propName in oldProps) {
        if (!(propName in newProps)) {
          changes.push(`Property '${propName}' was removed`);
        }
      }

      if (changes.length > 0) {
        result.entities.modified.push({ id, changes });
      }
    }
  }

  for (const id of oldEntitiesMap.keys()) {
    if (!newEntitiesMap.has(id)) {
      const oldEnt = oldEntitiesMap.get(id)!;
      result.entities.removed.push(oldEnt.name || id);
    }
  }

  // Diff Actions
  const oldActionsMap = new Map<string, Action>(oldNcg.actions.map(a => [a.id, a]));
  const newActionsMap = new Map<string, Action>(newNcg.actions.map(a => [a.id, a]));

  for (const [id, newAct] of newActionsMap) {
    if (!oldActionsMap.has(id)) {
      result.actions.added.push(newAct.name || id);
    } else {
      const oldAct = oldActionsMap.get(id)!;
      const changes: string[] = [];

      if (oldAct.method !== newAct.method) {
        changes.push(`HTTP Method changed from ${oldAct.method} to ${newAct.method}`);
      }

      if (oldAct.endpoint?.path !== newAct.endpoint?.path) {
        changes.push(`Endpoint path changed from '${oldAct.endpoint?.path}' to '${newAct.endpoint?.path}'`);
      }

      // Parameters comparison
      const oldParams = oldAct.endpoint?.parameters || [];
      const newParams = newAct.endpoint?.parameters || [];

      const oldParamNames = oldParams.map(p => p.name);
      const newParamNames = newParams.map(p => p.name);

      newParamNames.forEach(name => {
        if (!oldParamNames.includes(name)) {
          changes.push(`Parameter '${name}' was added`);
        }
      });

      oldParamNames.forEach(name => {
        if (!newParamNames.includes(name)) {
          changes.push(`Parameter '${name}' was removed`);
        }
      });

      if (changes.length > 0) {
        result.actions.modified.push({ id, changes });
      }
    }
  }

  for (const id of oldActionsMap.keys()) {
    if (!newActionsMap.has(id)) {
      const oldAct = oldActionsMap.get(id)!;
      result.actions.removed.push(oldAct.name || id);
    }
  }

  const hasChanges = 
    result.entities.added.length > 0 ||
    result.entities.removed.length > 0 ||
    result.entities.modified.length > 0 ||
    result.actions.added.length > 0 ||
    result.actions.removed.length > 0 ||
    result.actions.modified.length > 0;

  result.hasDrift = hasChanges;

  return result;
}
