// nodes/UserNode.tsx
import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

import { useStore } from '../store'; 

const UserNode = ({ id, data }) => {
  console.log("Rendering UserNode with id:", id, "and data:", data);
  const updateNodeField = useStore((state) => state.updateNodeField);
  const queryChangeHandler = useCallback((e) => {
    updateNodeField(id, 'query', e.target.value);
  }, [id, updateNodeField]);

  const label = data?.label || 'User Query';

  return (
    <div
      className="
        bg-blue-50/70
        border-2 border-blue-400/60
        rounded-xl
        p-5
        w-80
        shadow-sm
        hover:shadow-md
        hover:border-blue-400
        transition-all
        duration-200
        backdrop-blur-sm
      "
    >
      {/* Header */}
      <div className="mb-3 font-medium text-blue-900 text-lg tracking-tight">
        {label}
      </div>

      {/* Textarea */}
      <textarea
        value={data?.query || ''}
        onChange={queryChangeHandler}
        placeholder="Enter your question, prompt or message here..."
        className="
          nodrag nopan
          w-full
          min-h-28
          px-4 py-3
          text-gray-800
          placeholder:text-gray-500
          bg-white/80
          border border-blue-200
          rounded-lg
          resize-y
          text-sm
          leading-relaxed
          shadow-inner
          focus:outline-none
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-400/40
          focus:bg-white
          transition-all
          duration-150
        "
        spellCheck={false}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="query-out"
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

    
    </div>
  );
};

export default UserNode;