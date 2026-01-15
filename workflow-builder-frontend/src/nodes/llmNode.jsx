import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const LLMNode = ({ id, data }) => {
  const label = data?.label || 'LLM Engine';

  return (
    <div
      className="
        bg-purple-50/70
        border-2 border-purple-400/60
        rounded-xl
        p-5
        w-96
        shadow-sm
        hover:shadow-md
        hover:border-purple-400
        transition-all
        duration-200
        backdrop-blur-sm
      "
    >
      {/* Header */}
      <div className="mb-4 font-medium text-purple-900 text-lg tracking-tight">
        {label}
      </div>

      {/* LLM Model Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-purple-800 mb-2">
          LLM Model
        </label>
        <select
          className="
            nodrag nopan
            w-full
            px-3 py-2
            text-sm
            text-gray-800
            bg-white/80
            border border-purple-200
            rounded-lg
            shadow-inner
            focus:outline-none
            focus:border-purple-500
            focus:ring-2
            focus:ring-purple-400/40
            focus:bg-white
            transition-all
            duration-150
          "
        >
          <option value="gpt4">OpenAI GPT-4</option>
          <option value="gpt35">OpenAI GPT-3.5 Turbo</option>
          <option value="gemini">Google Gemini</option>
          <option value="claude">Claude</option>
          <option value="llama">Llama 2</option>
        </select>
      </div>

      {/* Temperature Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-purple-800 mb-2">
          Temperature: <span className="text-purple-600 font-semibold">0.7</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          defaultValue="0.7"
          className="
            nodrag nopan
            w-full
            h-2
            bg-purple-200
            rounded-lg
            appearance-none
            cursor-pointer
            accent-purple-600
          "
        />
      </div>

      {/* Enable Web Search */}
      <div className="mb-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="
              nodrag nopan
              w-4 h-4
              text-purple-600
              rounded
              border-purple-300
              focus:ring-2
              focus:ring-purple-400
            "
          />
          <span className="ml-2 text-sm font-medium text-purple-800">
            Enable Web Search (SerpAPI)
          </span>
        </label>
      </div>

      {/* Custom Prompt */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-purple-800 mb-2">
          Custom Prompt (Optional)
        </label>
        <textarea
          placeholder="Add custom instructions or system prompt..."
          className="
            nodrag nopan
            w-full
            min-h-20
            px-3 py-2
            text-sm
            text-gray-800
            placeholder:text-gray-500
            bg-white/80
            border border-purple-200
            rounded-lg
            resize-y
            shadow-inner
            focus:outline-none
            focus:border-purple-500
            focus:ring-2
            focus:ring-purple-400/40
            focus:bg-white
            transition-all
            duration-150
          "
        />
      </div>

      {/* Info Section */}
      <div className="bg-purple-100/40 border border-purple-200/60 rounded-lg p-3 mb-4">
        <p className="text-xs text-purple-800 leading-relaxed">
          <span className="font-semibold">Features:</span> Query processing, context integration, web search, response generation
        </p>
      </div>

      {/* Input Handles */}
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

      <Handle
        type="target"
        position={Position.Left}
        id="context-in"
        style={{ top: '60%' }}
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

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="response-out"
        className="
          bg-purple-600!
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
