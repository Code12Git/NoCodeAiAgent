import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { llmResponseApi } from '../api/llm';
export const LLMNode = ({ id, data }) => {
  const label = data?.label || 'LLM Engine';
// knowledgeBase-1
  const updateNodeField = useStore((state) => state.updateNodeField);
  const promptNode = useStore((state) => state.nodes.find((n) => n.id === 'user-1')?.data?.query);
  const llmModel = useStore((state) => state.nodes.find((n) => n.id === id)?.data?.llmModel);
  const documentId = useStore((state) => state.nodes.find((n) => n.id === 'knowledgeBase-1')?.data?.documentId);
  const temperature = useStore((state) => state.nodes.find((n) => n.id === id)?.data?.temperature);
  const enableWebSearch = useStore((state) => state.nodes.find((n) => n.id === id)?.data?.enableWebSearch);
  const customPrompt = useStore((state) => state.nodes.find((n) => n.id === id)?.data?.customPrompt);
  const model = useStore((state) => state.nodes.find((n) => n.id === 'knowledgeBase-1')?.data?.embeddingModel);
  const provider = useStore((state) => state.nodes.find((n) => n.id === 'knowledgeBase-1')?.data?.embeddingProvider);
  console.log("Prompt Node query:", promptNode);
  console.log("LLM Node current model:", llmModel);
  console.log("LLM Node current temperature:", temperature);
  console.log("LLM Node current web search status:", enableWebSearch);
  console.log("LLM Node current custom prompt:", customPrompt);
  console.log("Provider",provider)
  console.log("Id",id)

  const llmModelUpdate = (e) => {
    const selectedModel = e.target.value;
    updateNodeField(id, 'llmModel', selectedModel);
  }

  const handleTemperatureChange = (e) => {
    const tempValue = parseFloat(e.target.value);
    updateNodeField(id, 'temperature', tempValue);
  }

  const handleWebSearchToggle = (e) => {
    const isEnabled = e.target.checked;
    console.log("Web Search toggled to:", isEnabled);
    updateNodeField(id, 'enableWebSearch', isEnabled);
  }

  const handleCustomPrompt = (e) => {
    const promptText = e.target.value;
    updateNodeField(id, 'customPrompt', promptText);
  }

  const handleSubmitLLMRequest = async (e) => {
    // Logic to submit LLM request
    e.preventDefault();
    console.log("Submitting LLM request with settings:");
    console.log("Model:", llmModel);
    console.log("Temperature:", temperature);
    console.log("Web Search Enabled:", enableWebSearch);
    console.log("Custom Prompt:", customPrompt);
    console.log("PromptNode",promptNode)
    console.log("Model from Knowledge Base Node:",model)
    console.log("Provider from Knowledge Base Node:",provider)

    // Here you would typically trigger the LLM processing logic
    if(!promptNode || !llmModel  ) {
      toast.error("All fields are required and must be valid.");
      return;
    }

    if (!documentId) {
      toast.error("Knowledge Base document is not connected or uploaded.");
      return;
    }

    const res = await llmResponseApi({query: promptNode, llmModel, temperature, enable_web_search:enableWebSearch, customPrompt, model, provider,document_id:documentId})
    console.log("LLM Response:", res?.answer);
    console.log("LLM Response Sources:", res?.sources);
    console.log("LLM Response Chat ID:", res?.chatId);
    updateNodeField(id, 'llmResponse', res?.answer);
    updateNodeField(id,'sourceResponse',res?.sources);
    updateNodeField(id,'chatId',res?.chat_id);
    toast.success("LLM request processed successfully.");
  }


   return (
    <div
      className="
        bg-linear-to-br from-purple-50/80 to-purple-50/40
        border-2 border-purple-400/60
        rounded-xl
        p-5
        w-full
        max-w-md
        shadow-md
        hover:shadow-lg
        hover:border-purple-400
        transition-all
        duration-200
        backdrop-blur-sm
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-purple-900 text-lg tracking-tight">
          {label}
        </div>
        <div className="text-xs font-medium text-purple-600 bg-purple-100/60 px-2 py-1 rounded">
          RAG Engine
        </div>
      </div>

      {/* Status Indicators */}

      {/* LLM Model Selection */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-purple-800 mb-2">
          LLM Model
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          onChange={llmModelUpdate}
          value={llmModel ?? 'gpt-4'}
          disabled={false}
          className="
            nodrag nopan
            w-full
            px-3 py-2
            text-sm
            text-gray-800
            bg-white/90
            border border-purple-200/80
            rounded-lg
            shadow-sm
            focus:outline-none
            focus:border-purple-500
            focus:ring-2
            focus:ring-purple-400/50
            focus:bg-white
            transition-all
            duration-150
            disabled:opacity-50
            disabled:cursor-not-allowed
            hover:border-purple-300
          "
        >
          <optgroup label="OpenAI">
            <option value="gpt-4">GPT-4 (Advanced)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo (Fast)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
          </optgroup>
          <optgroup label="Google">
            <option value="gemini-pro">Gemini Pro</option>
            <option value="gemini-1.5">Gemini 1.5</option>
          </optgroup>
         
        </select>
      </div>

      {/* Temperature Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-purple-800">
            Temperature
          </label>
          <span className="text-xs font-mono bg-purple-100/60 px-2 py-1 rounded text-purple-700">
            {temperature !== undefined ? temperature.toFixed(1) : '0.7'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature ?? 0.7}
            onChange={handleTemperatureChange}
            disabled={false}
            className="
              nodrag nopan
              flex-1
              h-2
              bg-linear-to-r from-blue-200 to-purple-200
              rounded-lg
              appearance-none
              cursor-pointer
              accent-purple-600
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            title="Lower = more deterministic, Higher = more creative"
          />
        </div>
        <p className="text-xs text-purple-600 mt-1">
          ⚖️ Balanced
        </p>
      </div>

      {/* Enable Web Search */}
      <div className="mb-4 p-3 bg-amber-50/50 border border-amber-100/60 rounded-lg">
        <label className="flex items-center cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={enableWebSearch ?? false}
            onChange={handleWebSearchToggle}
            disabled={false}
            className="
              nodrag nopan
              w-4 h-4
              text-purple-600
              rounded
              border-purple-300
              focus:ring-2
              focus:ring-purple-400
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          />
          <span className="text-sm font-medium text-purple-800">
            Enable Web Search
          </span>
          <span className="text-xs text-amber-600 font-medium">(Fallback)</span>
        </label>
        <p className="text-xs text-amber-700 mt-1">
          Falls back to web search if no knowledge base results found
        </p>
      </div>

      {/* Custom Prompt */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-purple-800 mb-2">
          Custom Prompt (Optional)
        </label>
        <textarea
          defaultValue=""
          onChange={handleCustomPrompt}
          value={customPrompt || 'You are a helpful AI Assistant who answers user queries based only on the available context retrieved from a PDF file. Make sure to reference the page number for navigation.'}
          disabled={false}
          placeholder="Add custom system prompt or instructions..."
          maxLength={500}
          className="
            nodrag nopan
            w-full
            min-h-20
            max-h-32
            px-3 py-2
            text-sm
            text-gray-800
            placeholder:text-gray-500
            bg-white/90
            border border-purple-200/80
            rounded-lg
            resize-y
            shadow-sm
            focus:outline-none
            focus:border-purple-500
            focus:ring-2
            focus:ring-purple-400/50
            focus:bg-white
            transition-all
            duration-150
            disabled:opacity-50
            disabled:cursor-not-allowed
            hover:border-purple-300
          "
        />
        <p className="text-xs text-gray-600 mt-1">
          0/500 characters
        </p>
      </div>

      {/* Response Output */}

      {/* Info & Features Section */}
      <div className="bg-purple-100/40 border border-purple-200/60 rounded-lg p-3 mb-4">
        <p className="text-xs text-purple-800 leading-relaxed">
          <span className="font-semibold block mb-1">Features:</span>
          <span className="block">• RAG with vector search</span>
          <span className="block">• Web search fallback</span>
          <span className="block">• Custom system prompts</span>
          <span className="block">• Temperature control</span>
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmitLLMRequest}
        disabled={false}
        className="
          w-full
          py-2
          px-3
          mb-4
          text-sm
          font-semibold
          text-white
          bg-linear-to-r from-purple-600 to-purple-700
          hover:from-purple-700 hover:to-purple-800
          rounded-lg
          shadow-md
          hover:shadow-lg
          transition-all
          duration-200
          disabled:from-gray-400 disabled:to-gray-500
          disabled:cursor-not-allowed
          disabled:shadow-none
          active:scale-95
        "
        title="Process LLM request"
      >
        ▶️ Process Query
      </button>

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
          shadow-md!
          transition-all!
          hover:scale-125!
          hover:shadow-lg!
        "
        title="Connect query input"
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
          shadow-md!
          transition-all!
          hover:scale-125!
          hover:shadow-lg!
        "
        title="Connect knowledge/document source"
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
          shadow-md!
          transition-all!
          hover:scale-125!
          hover:shadow-lg!
        "
        title="LLM response output"
      />
    </div>
  );
};
