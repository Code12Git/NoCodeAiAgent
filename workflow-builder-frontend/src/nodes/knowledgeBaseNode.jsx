// KnowledgeBaseNode.jsx

import { Handle, Position } from '@xyflow/react';
import { useState } from 'react';
import { getKnowledgeResult, updateModelEmbedding, uploadKnowledgeFile } from '../api/knowledge-upload';
import { useStore } from '../store';

const KnowledgeBaseNode = ({ id, data }) => {

  const [documentUploadId, setDocumentUploadId] = useState('')
  const [chunks, setChunks] = useState(data?.chunks || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const label = data?.label || 'Knowledge Base';

  const updateNodeField = useStore((state) => state.updateNodeField);
  console.log("Rendering KnowledgeBaseNode with id:", id, "and data:", data);

  const uploadDocsHandler = async (e) => {
    const file = e.target.files[0];
    console.log("Uploaded file:", file);
    if (file) {
      try {
        setProcessStatus(' Uploading document...');
        await updateNodeField(id, 'fileName', file.name);
        console.log("Calling uploadKnowledgeFile with file:", file);

        const res = await uploadKnowledgeFile(file);
        console.log("Upload response:", res);

        setDocumentUploadId(res.document_id);
        await updateNodeField(id, 'documentId', res.document_id);
        await updateNodeField(id, 'chunksCount', res.chunks_count);
        setChunks(res.chunks);

        setProcessStatus(`Document uploaded! (${res.chunks_count} chunks)`);
        setTimeout(() => setProcessStatus(''), 3000);
      } catch (error) {
        console.error("Upload handler error:", error);
        setProcessStatus('Upload failed');
        alert("Failed to upload document. Please try again.");
      }
    }
  }

  const embeddingModelSelector = async (e) => {
    const selectedModel = e.target.value;

    if (!documentUploadId) {
      console.error("No document uploaded yet. Please upload a document first.");
      alert("Please upload a document first before selecting an embedding model.");
      return;
    }

    if (!selectedModel) {
      console.error("No embedding model selected.");
      return;
    }

    let embedding_provider = '';
    if (selectedModel === 'text-embedding-3-large' || selectedModel === 'text-embedding-3-small') {
      embedding_provider = 'openai';
    } else {
      embedding_provider = 'gemini';
    }

    try {
      setIsProcessing(true);
      setProcessStatus(' Enqueueing document for processing...');

      console.log("Selected embedding model:", selectedModel);
      await updateNodeField(id, 'embeddingModel', selectedModel);
      await updateNodeField(id, 'embeddingProvider', embedding_provider);

      // ===== STEP 1: Enqueue Job =====
      const enqueueRes = await updateModelEmbedding(selectedModel, documentUploadId, embedding_provider, chunks);
      console.log("Job enqueued:", enqueueRes);

      const jobId = enqueueRes.job_id;
      setProcessStatus(` Processing job: ${jobId}`);

      // ===== STEP 2: Poll for Results =====
      try {
        const result = await getKnowledgeResult(jobId);

        //JOB FINISHED - WE GOT THE RESULT!
        console.log("[SUCCESS] Indexing complete! Result:", result);

        await updateNodeField(id, 'indexingResult', result);
        await updateNodeField(id, 'indexingStatus', 'indexed');

        setProcessStatus(`Document indexed successfully! (${result.chunks_indexed} chunks with ${embedding_provider})`);
        setIsProcessing(false);

        alert(`Document indexed successfully!\n\n📊 Details:\n- Chunks: ${result.chunks_indexed}\n- Provider: ${embedding_provider}\n- Model: ${selectedModel}`);

      } catch (pollError) {
        console.error("[ POLLING] Error polling job result:", pollError);
        setProcessStatus(` Processing failed: ${pollError.message}`);
        setIsProcessing(false);
        alert(`Processing failed: ${pollError.message}`);
      }

    } catch (error) {
      console.error("Embedding model selector error:", error);
      setProcessStatus(' Enqueueing failed');
      setIsProcessing(false);
      alert("Failed to process document. Please try again.");
    }
  }


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
            onChange={uploadDocsHandler}
            className="nodrag nopan text-sm text-gray-600 cursor-pointer"
            accept=".pdf,.doc,.docx,.txt"
            disabled={isProcessing}
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
          onChange={embeddingModelSelector}
          value={data?.embeddingModel || 'text-embedding-3-large'}
          disabled={!documentUploadId || isProcessing}
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
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
        >
          {/* OpenAI Embeddings */}
          <optgroup label="OpenAI">
            <option value="text-embedding-3-large">
              text-embedding-3-large (3072 dims)
            </option>
            <option value="text-embedding-3-small">
              text-embedding-3-small (1536 dims)
            </option>
          </optgroup>

          {/* Gemini Embeddings */}
          <optgroup label="Google Gemini">
            <option value="models/embedding-001">
              embedding-001 (768 dims)
            </option>
            <option value="models/text-embedding-004">
              text-embedding-004
            </option>
          </optgroup>
        </select>
      </div>

      {/* Status Message */}
      {processStatus && (
        <div className="mb-4 p-3 bg-amber-100/60 border border-amber-300 rounded-lg text-xs text-amber-900">
          <p className="font-medium">{processStatus}</p>
          {isProcessing && (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-600 rounded-full animate-pulse"></div>
              <span>Processing in progress...</span>
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {data?.indexingStatus === 'indexed' && data?.indexingResult && (
        <div className="mb-4 p-3 bg-green-100/60 border border-green-400 rounded-lg text-xs text-green-900">
          <p className="font-bold mb-2">Indexing Complete!</p>
          <p>• Chunks indexed: {data.indexingResult.chunks_indexed}</p>
          <p>• Provider: {data.indexingResult.embedding_provider}</p>
          <p>• Model: {data.indexingResult.embedding_model}</p>
          <p>• Status: {data.indexingResult.status}</p>
        </div>
      )}

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