import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const OutputNode = ({ id, data }) => {
  const label = data?.label || 'Output';

  return (
    <div
      className="
        bg-green-50/70
        border-2 border-green-400/60
        rounded-xl
        p-5
        w-96
        shadow-sm
        hover:shadow-md
        hover:border-green-400
        transition-all
        duration-200
        backdrop-blur-sm
      "
    >
      {/* Header */}
      <div className="mb-4 font-medium text-green-900 text-lg tracking-tight flex items-center gap-2">
        <span className="text-xl">💬</span>
        {label}
      </div>

      {/* Response Display Area */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Response
        </label>
        <div
          className="
            nodrag nopan
            w-full
            min-h-32
            max-h-48
            px-4 py-3
            text-sm
            text-gray-800
            bg-white/80
            border border-green-200
            rounded-lg
            shadow-inner
            overflow-y-auto
            leading-relaxed
          "
        >
          <p className="text-gray-500 italic">
            {data?.response || 'Waiting for response...'}
          </p>
        </div>
      </div>

      {/* Source/Reference Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Sources
        </label>
        <div
          className="
            nodrag nopan
            w-full
            px-3 py-2
            text-xs
            text-gray-700
            bg-green-100/30
            border border-green-200
            rounded-lg
            max-h-20
            overflow-y-auto
          "
        >
          {data?.sources ? (
            <ul className="space-y-1">
              {data.sources.map((source, idx) => (
                <li key={idx} className="text-green-700">
                  • {source}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No sources referenced</p>
          )}
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Confidence
        </label>
        <div className="flex items-center gap-2">
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${data?.confidence || 0}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-green-700">
            {data?.confidence || 0}%
          </span>
        </div>
      </div>

      {/* Follow-up Question Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Follow-up Question (Optional)
        </label>
        <textarea
          placeholder="Ask a follow-up question to re-run the workflow..."
          className="
            nodrag nopan
            w-full
            min-h-16
            px-3 py-2
            text-sm
            text-gray-800
            placeholder:text-gray-500
            bg-white/80
            border border-green-200
            rounded-lg
            resize-y
            shadow-inner
            focus:outline-none
            focus:border-green-500
            focus:ring-2
            focus:ring-green-400/40
            focus:bg-white
            transition-all
            duration-150
          "
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          className="
            flex-1
            px-3 py-2
            text-sm
            font-medium
            text-white
            bg-green-600
            hover:bg-green-700
            rounded-lg
            transition-colors
            duration-150
            cursor-pointer
          "
        >
          Copy
        </button>
        <button
          className="
            flex-1
            px-3 py-2
            text-sm
            font-medium
            text-green-700
            bg-green-100
            hover:bg-green-200
            rounded-lg
            transition-colors
            duration-150
            cursor-pointer
          "
        >
          Export
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-green-100/40 border border-green-200/60 rounded-lg p-3">
        <p className="text-xs text-green-800 leading-relaxed">
          <span className="font-semibold">Features:</span> Response display, source tracking, confidence scoring, follow-up questions
        </p>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="response-in"
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
