import React from 'react';
import { Handle, Position } from '@xyflow/react';

const KnowledgeBaseNode = ({ id, data }) => {
  const label = data?.label || 'Knowledge Base';

  return (
    <div
      className="
        bg-amber-50/70
        border-2 border-amber-400/60
        rounded-xl
        p-5
        w-96
        shadow-sm
        hover:shadow-md
        hover:border-amber-400
        transition-all
        duration-200
        backdrop-blur-sm
      "
    >
      {/* Header */}
      <div className="mb-4 font-medium text-amber-900 text-lg tracking-tight">
        {label}
      </div>

      {/* File Upload Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-amber-800 mb-2">
          Upload Document
        </label>
        <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg bg-white/50 hover:bg-white/70 transition-colors">
          <input
            type="file"
            className="nodrag nopan text-sm text-gray-600 cursor-pointer"
            accept=".pdf,.doc,.docx,.txt"
          />
        </div>
        {data?.fileName && (
          <p className="mt-2 text-xs text-amber-700 font-medium">
            📄 {data.fileName}
          </p>
        )}
      </div>

      {/* Embedding Model Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-amber-800 mb-2">
          Embedding Model
        </label>
        <select
          className="
            nodrag nopan
            w-full
            px-3 py-2
            text-sm
            text-gray-800
            bg-white/80
            border border-amber-200
            rounded-lg
            shadow-inner
            focus:outline-none
            focus:border-amber-500
            focus:ring-2
            focus:ring-amber-400/40
            focus:bg-white
            transition-all
            duration-150
          "
        >
          <option value="openai">OpenAI Embeddings</option>
          <option value="gemini">Gemini Embeddings</option>
          <option value="cohere">Cohere Embeddings</option>
          <option value="local">Local Embeddings</option>
        </select>
      </div>

      {/* Vector Store Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-amber-800 mb-2">
          Vector Store
        </label>
        <select
          className="
            nodrag nopan
            w-full
            px-3 py-2
            text-sm
            text-gray-800
            bg-white/80
            border border-amber-200
            rounded-lg
            shadow-inner
            focus:outline-none
            focus:border-amber-500
            focus:ring-2
            focus:ring-amber-400/40
            focus:bg-white
            transition-all
            duration-150
          "
        >
          <option value="chromadb">ChromaDB</option>
          <option value="pinecone">Pinecone</option>
          <option value="weaviate">Weaviate</option>
          <option value="milvus">Milvus</option>
        </select>
      </div>

      {/* Info Section */}
      <div className="bg-amber-100/40 border border-amber-200/60 rounded-lg p-3 mb-4">
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Features:</span> Document processing, text extraction, embeddings generation, vector storage & retrieval
        </p>
      </div>

      {/* Input Handle - from User Query */}
      <Handle
        type="target"
        position={Position.Left}
        id="query-in"
        className="
          bg-blue-600!
          w-4!
          h-4!
          border-2!
          border-white!
          shadow-sm!
          transition-transform!
          hover:scale-110!
        "
      />

      {/* Output Handle - to LLM */}
      <Handle
        type="source"
        position={Position.Right}
        id="context-out"
        className="
          bg-amber-600!
          w-4!
          h-4!
          border-2!
          border-white!
          shadow-sm!
          transition-transform!
          hover:scale-110!
        "
      />
    </div>
  );
};

export default KnowledgeBaseNode;
