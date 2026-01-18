//store.js

// store.ts (keep almost as is, just make sure addNode etc. are stable)
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
} from "@xyflow/react";
import { create } from "zustand";

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],

  // optional: if you want stable IDs across the app
  nodeIDs: {}, // ← you already have something similar

  getNodeID: (type) => {
    set((state) => {
      const newIDs = { ...state.nodeIDs };
      newIDs[type] = (newIDs[type] ?? 0) + 1;
      return { nodeIDs: newIDs };
    });
    return `${type}-${get().nodeIDs[type] ?? 1}`;
  },

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          type: "smoothstep",
          animated: true,
          markerEnd: { type: MarkerType.Arrow, height: "20px", width: "20px" },
        },
        state.edges
      ),
    })),

  updateNodeField: (nodeId, fieldName, fieldValue) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
          : node
      ),
    })),
}));