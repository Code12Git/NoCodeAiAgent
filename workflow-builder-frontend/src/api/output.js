 

import { publicApi } from '../helpers/axiosInstance';

 
export const getChatOutput = async (chatId, includeHistory = false) => {
  try {
    console.log(`[OUTPUT API] Fetching chat output: ${chatId}`);
    
    const response = await publicApi.post(
      `/output/chat/${chatId}`,
      {},
      {
        params: {
          include_history: includeHistory
        }
      }
    );
    
    console.log(`[OUTPUT API]Chat output retrieved:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[OUTPUT API] ❌ Error fetching chat output:`, error.response?.data || error.message);
    throw error;
  }
};
 
export const getChatHistory = async (documentId, limit = 10, offset = 0) => {
  try {
    console.log(`[OUTPUT API] Fetching chat history for document: ${documentId}`);
    
    const response = await publicApi.post(
      `/output/chat-history`,
      {
        document_id: documentId,
        limit,
        offset
      }
    );
    
    console.log(`[OUTPUT API]Chat history retrieved:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[OUTPUT API] ❌ Error fetching chat history:`, error.response?.data || error.message);
    throw error;
  }
};

 
export const formatLLMResponse = (llmResponse) => {
  if (!llmResponse) return null;
  
  return {
    chat_id: llmResponse.chat_id || `chat-${Date.now()}`,
    query: llmResponse.query || 'User Query',
    answer: llmResponse.answer || 'No answer received',
    sources: llmResponse.sources ? llmResponse.sources.length : 0,
    model: llmResponse.model || 'unknown',
    temperature: String(llmResponse.temperature || '0.7'),
    provider: llmResponse.provider || 'openai',
    embedding_model: llmResponse.embedding_model || 'text-embedding-3-small',
    created_at: new Date().toISOString(),
    raw_sources: llmResponse.sources || []
  };
};

 
export const getChatHistoryPaginated = async (documentId, page = 0, pageSize = 10) => {
  const offset = page * pageSize;
  return getChatHistory(documentId, pageSize, offset);
};

 
export const processFollowUpQuestion = async (followUpData) => {
  try {
    console.log(`[OUTPUT API] Processing follow-up question for chat: ${followUpData.chat_id}`);
    
    const response = await publicApi.post(
      `/output/follow-up`,
      {
        chat_id: followUpData.chat_id,
        follow_up_query: followUpData.follow_up_query,
        document_id: followUpData.document_id,
        llm_model: followUpData.llm_model,
        temperature: followUpData.temperature || 0.7,
        provider: followUpData.provider || 'openai',
        embedding_model: followUpData.embedding_model || 'text-embedding-3-small'
      }
    );
    
    console.log(`[OUTPUT API]Follow-up processed:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[OUTPUT API] ❌ Error processing follow-up:`, error.response?.data || error.message);
    throw error;
  }
};

 
export const getDocumentStats = async (documentId) => {
  try {
    console.log(`[OUTPUT API] Fetching stats for document: ${documentId}`);
    
    const response = await publicApi.get(
      `/output/document/${documentId}/stats`
    );
    
    console.log(`[OUTPUT API]Document stats retrieved:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[OUTPUT API]  Error fetching document stats:`, error.response?.data || error.message);
    throw error;
  }
};

 
export const formatChatResponse = (chat) => {
  return {
    chatId: chat.chat_id,
    query: chat.query,
    answer: chat.answer,
    sources: chat.sources,
    model: chat.model,
    temperature: parseFloat(chat.temperature),
    provider: chat.provider,
    embeddingModel: chat.embedding_model,
    createdAt: new Date(chat.created_at),
    isFollowUp: chat.is_follow_up || false,
    followUpCount: chat.follow_up_count || 0
  };
};
 
export const extractSources = (chat) => {
  if (!chat || !chat.sources) return [];
  return Array(chat.sources).fill(null).map((_, i) => `Source ${i + 1}`);
};

 
export const calculateConfidenceScore = (chat) => {
  if (!chat) return 0;
  
  // Base confidence on sources
  const sourceConfidence = Math.min(chat.sourceResponse * 20, 80);
  
  // Boost for premium models
  const modelBoost = chat.llmModel && (chat.llmModel.includes('gpt-4') || chat.llmModel.includes('gemini')) ? 10 : 5;
  
  return Math.min(sourceConfidence + modelBoost, 100);
};

 
export const buildFollowUpPayload = ({
  originalChatId,
  followUpQuery,
  documentId,
  llmModel = 'gpt-4-turbo',
  temperature = 0.7,
  provider = 'openai',
  embeddingModel = 'text-embedding-3-small'
}) => {
  return {
    chat_id: originalChatId,
    follow_up_query: followUpQuery,
    document_id: documentId,
    llm_model: llmModel,
    temperature,
    provider,
    embedding_model: embeddingModel
  };
};

export const formatTimestamp = (timestamp) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

 
export const isRecentChat = (timestamp) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now - date;
  const diffMins = diffMs / (1000 * 60);
  return diffMins < 60;
};
 
export const groupChatsByDate = (chats) => {
  return chats.reduce((groups, chat) => {
    const date = new Date(chat.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(chat);
    return groups;
  }, {});
};
 
export const handleOutputApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      status: error.response.status,
      message: error.response.data?.detail || 'An error occurred',
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 0,
      message: 'No response from server. Check your connection.',
      data: null
    };
  } else {
    // Error in request setup
    return {
      status: 0,
      message: error.message || 'An unknown error occurred',
      data: null
    };
  }
};

export default {
  getChatOutput,
  getChatHistory,
  getChatHistoryPaginated,
  processFollowUpQuestion,
  getDocumentStats,
  formatChatResponse,
  extractSources,
  calculateConfidenceScore,
  buildFollowUpPayload,
  formatTimestamp,
  isRecentChat,
  groupChatsByDate,
  handleOutputApiError
};
