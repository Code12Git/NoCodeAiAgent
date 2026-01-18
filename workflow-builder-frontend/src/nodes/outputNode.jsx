import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { calculateConfidenceScore } from '../api/output';
import { useStore } from '../store';

export const OutputNode = ({ id, data }) => {
  const label = data?.label || 'Output';
  const [confidence, setConfidence] = useState(0);

  const answer = useStore((state) => state.nodes.find((node) => node.id ===  'llm-1')?.data.llmResponse);
  const source = useStore((state) => state.nodes.find((node) => node.id ===  'llm-1')?.data.source);
  // Calculate confidence when data changes
  useEffect(() => {
    if (data?.llm_response) {
      const confidenceScore = calculateConfidenceScore(data.llm_response);
      setConfidence(confidenceScore);
    }
  }, [data?.llm_response]);

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
          <p className={data?.llm_response?.answer ? 'text-gray-800' : 'text-gray-500 italic'}>
            {answer|| 'Waiting for response...'}
          </p>
        </div>
      </div>

      {/* Source/Reference Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Sources ({data?.llm_response?.sources?.length || 0})
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
          {data?.llm_response?.sources && data.llm_response.sources.length > 0 ? (
            <ul className="space-y-1">
              {data.llm_response.sources.map((source, idx) => (
                <li key={idx} className="text-green-700">
                  • {typeof source === 'string' ? source : JSON.stringify(source)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No sources referenced</p>
          )}
        </div>
      </div>

      {/* Model Information */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-blue-700 font-medium">Model</p>
            <p className="text-gray-700">{data?.llm_response?.model || 'N/A'}</p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">Provider</p>
            <p className="text-gray-700">{data?.llm_response?.provider || 'N/A'}</p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">Temp</p>
            <p className="text-gray-700">{data?.llm_response?.temperature || '0.7'}</p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">Embedding</p>
            <p className="text-gray-700 text-xs">{data?.llm_response?.embedding_model?.split('-').slice(-1)[0] || 'N/A'}</p>
          </div>
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
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-green-700">
            {confidence}%
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-green-100/40 border border-green-200/60 rounded-lg p-3">
        <p className="text-xs text-green-800 leading-relaxed">
          <span className="font-semibold">Features:</span> Response display, source tracking, confidence scoring
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
