import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { IRGraph } from '../types';

interface GraphViewProps {
  ir: IRGraph | null;
}

export const GraphView: React.FC<GraphViewProps> = ({ ir }) => {
  const { nodes, edges } = useMemo(() => {
    if (!ir || !ir.nodes) return { nodes: [], edges: [] };

    const flowNodes: Node[] = ir.nodes.map((node, index) => ({
      id: node.id,
      data: { 
        label: (
          <div className="flex flex-col gap-1 text-left p-2">
             <div className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">{node.type}</div>
             <div className="text-[10px] font-black uppercase truncate max-w-[120px]">{node.id}</div>
             {node.config.entityId && (
               <div className="text-[8px] font-mono text-blue-600 bg-blue-50 px-1 py-0.5 inline-block w-fit">
                 ENTITY: {node.config.entityId}
               </div>
             )}
          </div>
        )
      },
      position: { x: 50, y: index * 120 },
      draggable: true,
      style: {
        background: '#fff',
        border: '2px solid #000',
        borderRadius: '0px',
        width: 150,
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
      }
    }));

    const flowEdges: Edge[] = [];
    ir.nodes.forEach((node) => {
      if (node.onSuccess && node.onSuccess !== 'END') {
        flowEdges.push({
          id: `e-${node.id}-${node.onSuccess}`,
          source: node.id,
          target: node.onSuccess,
          animated: true,
          style: { stroke: '#000', strokeWidth: 2 },
          type: 'smoothstep'
        });
      }
      if (node.onFailure && node.onFailure !== 'TRIGGER_SAGA_ROLLBACK') {
        flowEdges.push({
          id: `e-fail-${node.id}-${node.onFailure}`,
          source: node.id,
          target: node.onFailure,
          animated: true,
          style: { stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '5,5' },
          type: 'smoothstep'
        });
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [ir]);

  if (!ir) return null;

  return (
    <div className="w-full h-[400px] border-2 border-black bg-white relative">
      <div className="absolute top-2 left-2 z-10 bg-black text-white px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest uppercase shadow-[2px_2px_0px_white]">
        RUNTIME_DAG_VISUALIZER
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        colorMode="light"
      >
        <Background gap={16} size={1} color="#E2E2E2" />
        <Controls showInteractive={false} className="!bg-white !border-2 !border-black !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] !rounded-none" />
      </ReactFlow>
    </div>
  );
};
