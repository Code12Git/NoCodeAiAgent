import { useState, useRef, useCallback } from 'react';
import { ReactFlow, Controls, Background, MiniMap } from '@xyflow/react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import '@xyflow/react/dist/style.css';
import UserNode from './nodes/userNode';
import KnowledgeBaseNode from './nodes/knowledgeBaseNode';

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = {
  user: UserNode,
  knowledgeBase: KnowledgeBaseNode,
  llm: LLMNode,
  customOutput: OutputNode,
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const {
      nodes,
      edges,
      getNodeID,
      addNode,
      onNodesChange,
      onEdgesChange,
      onConnect
    } = useStore(selector, shallow);

    const getInitNodeData = (nodeID, type) => {
      const labels = {
        user: 'User Query',
        knowledgeBase: 'Knowledge Base',
        llm: 'LLM Engine',
        customOutput: 'Output',
        text: 'Text',
        test: 'Test',
        email: 'Email',
        vector: 'Vector',
        conditional: 'Conditional'
      };
      
      const baseData = { id: nodeID, nodeType: type, label: labels[type] || type };
      
      // Initialize type-specific fields
      if (type === 'user') {
        baseData.query = '';
      } else if (type === 'knowledgeBase') {
        baseData.fileName = '';
        baseData.embeddingModel = 'openai';
        baseData.vectorStore = 'chromadb';
      }
      
      return baseData;
    }

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();
    
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          if (event?.dataTransfer?.getData('application/reactflow')) {
            const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
            const type = appData?.nodeType;
      
            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
              return;
            }
      
            const position = reactFlowInstance.screenToFlowPosition({
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top,
            });

            const nodeID = getNodeID(type);
            const newNode = {
              id: nodeID,
              type,
              position,
              data: getInitNodeData(nodeID, type),
            };
      
            addNode(newNode);
          }
        },
        [reactFlowInstance]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    return (
        <>
        <div ref={reactFlowWrapper} style={{width: '100wv', height: '70vh'}}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                proOptions={proOptions}
                snapGrid={[gridSize, gridSize]}
                connectionLineType='smoothstep'
            >
                <Background color="#aaa" gap={gridSize} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
        </>
    )
}
