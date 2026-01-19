import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { calculateConfidenceScore, processFollowUpQuestion } from '../api/output';
import { useStore } from '../store';
import toast from 'react-hot-toast';

export const OutputNode = ({ id, data }) => {
  const label = data?.label || 'Output';
  const [confidence, setConfidence] = useState(0);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState(null);
  
  console.log("Rendering OutputNode with id:", id, "and data:", data);
  const llmData = useStore((state) => {
    const llmNode = state.nodes.find((n) => n.id === 'llm-1');
    console.log("OutputNode reading from llm-1 data:", llmNode?.data); 
    return llmNode?.data || {};
  });
  console.log("LLM Data:", llmData);

  // Get Knowledge Base data for document ID
  const knowledgeBaseNode = useStore((state) => state.nodes.find((n) => n.id === 'knowledgeBase-1'));
  const documentId = knowledgeBaseNode?.data?.documentId;

  // Calculate confidence when data changes
  useEffect(() => {
    if (llmData?.llmResponse) {
      const confidenceScore = calculateConfidenceScore(llmData);
      setConfidence(confidenceScore);
    }
  }, [llmData?.llmResponse, llmData?.chatId]);

  // Handle follow-up question submission
  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    
    if (!followUpQuestion.trim()) {
      toast.error('Please enter a follow-up question');
      return;
    }

    if (!llmData?.chatId) {
      toast.error('No active chat session. Please submit a query first.');
      return;
    }

    if (!documentId) {
      toast.error('No document connected. Please check Knowledge Base node.');
      return;
    }

    setIsSubmittingFollowUp(true);
    
    try {
      console.log('[OUTPUT] Submitting follow-up question:', followUpQuestion);
      
      const response = await processFollowUpQuestion({
        chat_id: llmData.chatId,
        follow_up_query: followUpQuestion,
        document_id: documentId,
        llm_model: llmData.llmModel || 'gpt-4',
        temperature: llmData.temperature || 0.7,
        provider: llmData.provider || 'openai',
        embedding_model: llmData.model || 'text-embedding-3-small'
      });

      console.log('[OUTPUT] Follow-up response received:', response);
      setFollowUpResponse(response);
      setFollowUpQuestion('');
      toast.success('Follow-up question processed successfully!');
    } catch (error) {
      console.error('[OUTPUT] Error processing follow-up:', error);
      toast.error('Failed to process follow-up question');
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  

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
            {llmData?.llmResponse|| 'Waiting for response...'}
          </p>
        </div>
      </div>

      

      {/* Model Information */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-blue-700 font-medium">Model</p>
            <p className="text-gray-700">{llmData?.llmModel || 'N/A'}</p>
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

      {/* Follow-Up Question Section */}
      {llmData?.llmResponse && (
        <div className="mb-4 border-t-2 border-green-200 pt-4">
          <label className="block text-sm font-medium text-green-800 mb-2">
            ❓ Follow-up Question
          </label>
          
          {/* Follow-up Question Input */}
          <form onSubmit={handleFollowUpSubmit} className="space-y-2">
            <div>
              <textarea
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="Ask a follow-up question..."
                disabled={isSubmittingFollowUp}
                className="
                  nodrag nopan
                  w-full
                  px-3 py-2
                  text-xs
                  text-gray-800
                  bg-white/90
                  border border-green-200
                  rounded-lg
                  shadow-sm
                  focus:outline-none
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-400/50
                  focus:bg-white
                  transition-all
                  duration-150
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  hover:border-green-300
                  resize-none
                  max-h-20
                "
                rows="3"
              />
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingFollowUp || !followUpQuestion.trim()}
              className="
                nodrag nopan
                w-full
                px-3 py-2
                text-xs
                font-medium
                text-white
                bg-green-600
                hover:bg-green-700
                border border-green-700
                rounded-lg
                shadow-sm
                transition-all
                duration-200
                disabled:opacity-50
                disabled:cursor-not-allowed
                disabled:hover:bg-green-600
              "
            >
              {isSubmittingFollowUp ? '⏳ Processing...' : '✉️ Send Follow-up'}
            </button>
          </form>

          {/* Follow-up Response Display */}
          {followUpResponse && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-2">Follow-up Response:</p>
              <p className="text-xs text-gray-800 leading-relaxed">
                {followUpResponse?.output || followUpResponse?.answer || 'Response received'}
              </p>
            </div>
          )}
        </div>
      )}

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
