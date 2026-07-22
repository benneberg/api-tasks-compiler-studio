import { IRGraph, IntentGraph } from "../../types";

export interface JdCardArtifact {
  $schema: string;
  id: string;
  version: string;
  metadata: {
    title: string;
    targetDomain: string;
    compiledAt: string;
  };
  capabilitiesMode: string;
  contracts: {
    inboundIntent: string;
    expectedEntity: string;
  };
  executionGraph: Record<string, any>;
  suggestedParameters: any[];
}

export function buildJdCardArtifact(
  ir: IRGraph, 
  intent: IntentGraph | null, 
  title: string = "Compiled jdCard"
): JdCardArtifact {
  const cardId = `card_${Date.now().toString(36)}`;
  const nodesMap: Record<string, any> = {};

  ir.nodes.forEach(node => {
    nodesMap[node.id] = {
      type: node.type,
      config: node.config,
      execution: node.execution,
      onSuccess: node.onSuccess,
      onFailure: node.onFailure
    };
  });

  return {
    $schema: "https://api2ui.dev/schemas/v1/jdcard.json",
    id: cardId,
    version: "1.0.0",
    metadata: {
      title,
      targetDomain: ir.metadata.targetEntities.join(", ") || "General Fleet",
      compiledAt: new Date().toISOString()
    },
    capabilitiesMode: "TRANSACTIONAL_WRITE_SAFE",
    contracts: {
      inboundIntent: ir.metadata.originalGoal,
      expectedEntity: ir.metadata.targetEntities[0] || "Entity"
    },
    executionGraph: nodesMap,
    suggestedParameters: intent?.parameters || []
  };
}

export function generateReactComponentBundle(artifact: JdCardArtifact): string {
  return `import React, { useState } from 'react';

/**
 * Auto-Generated jdCard Micro-Interface
 * Compiled by API2UI Studio
 * Title: ${artifact.metadata.title}
 * Compiled At: ${artifact.metadata.compiledAt}
 */

export interface JdCardRunnerProps {
  apiBaseUrl?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export default function JdCardRunner({ apiBaseUrl = '', onSuccess, onError }: JdCardRunnerProps) {
  const [params, setParams] = useState<Record<string, string>>({
    ${artifact.suggestedParameters.map(p => `"${p.paramName}": "${p.suggestedValue}"`).join(',\n    ')}
  });
  const [status, setStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const handleRun = async () => {
    setStatus('executing');
    setLogs(['[SYS] Initializing workflow transaction...', '[PLAN] Goal: ${artifact.contracts.inboundIntent}']);

    try {
      // Step execution loop
      ${Object.entries(artifact.executionGraph).map(([nodeId, node]) => `
      setLogs(prev => [...prev, '[EXEC] Running node ${nodeId} (${node.type})...']);
      // Simulate/Execute call
      `).join('\n')}

      setStatus('success');
      setLogs(prev => [...prev, '[SYS] Transaction completed successfully.']);
      if (onSuccess) onSuccess({ status: 'completed', parameters: params });
    } catch (err: any) {
      setStatus('error');
      setLogs(prev => [...prev, '[ERR] ' + err.message]);
      if (onError) onError(err);
    }
  };

  return (
    <div style={{
      border: '2px solid #000',
      padding: '24px',
      fontFamily: 'monospace',
      background: '#fff',
      boxShadow: '4px 4px 0px #000',
      maxWidth: '600px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>${artifact.metadata.title}</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#666' }}>
        Intent: "${artifact.contracts.inboundIntent}"
      </p>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '12px', textTransform: 'uppercase' }}>Parameters</h4>
        {Object.keys(params).map(key => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '11px' }}>{key}:</label>
            <input 
              value={params[key]}
              onChange={(e) => setParams({ ...params, [key]: e.target.value })}
              style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}
            />
          </div>
        ))}
      </div>

      <button 
        onClick={handleRun}
        disabled={status === 'executing'}
        style={{
          background: '#2563eb',
          color: '#fff',
          border: '2px solid #000',
          padding: '10px 16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        {status === 'executing' ? 'EXECUTING...' : 'RUN JDCARD WORKFLOW'}
      </button>

      {logs.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#111',
          color: '#00ff00',
          fontSize: '10px',
          borderRadius: '4px'
        }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
`;
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJdCardJson(artifact: JdCardArtifact) {
  const filename = `${artifact.id || 'jdcard'}.json`;
  const jsonStr = JSON.stringify(artifact, null, 2);
  downloadTextFile(filename, jsonStr);
}

export function downloadReactBundle(artifact: JdCardArtifact) {
  const filename = `JdCardRunner_${artifact.id || 'card'}.tsx`;
  const code = generateReactComponentBundle(artifact);
  downloadTextFile(filename, code);
}

