import { fileUploadApi, publicApi } from '../helpers/axiosInstance';

/**
 * Upload a PDF document to the backend
 * 
 * Flow:
 * 1. User selects file in KnowledgeBaseNode
 * 2. File sent to POST /knowledge/upload
 * 3. Backend extracts text and chunks it
 * 4. Returns document_id + chunks
 * 
 * @param {File} file - The PDF file to upload
 * @returns {Promise} { document_id, chunks_count, chunks }
 */
export const uploadKnowledgeFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log("[📤 UPLOAD] Uploading file:", file.name);
        const response = await fileUploadApi.post('/knowledge/upload', formData);
        
        console.log("[✅ UPLOAD] Upload successful:", response.data);
        return response.data; // { document_id, chunks_count, chunks }
    } catch (error) {
        console.error("[❌ UPLOAD] Error uploading knowledge file:", error);
        throw error;
    }
};

/**
 * Enqueue document for embedding & indexing
 * 
 * Flow:
 * 1. User selects embedding model
 * 2. Sends POST /knowledge/process/{documentId}
 * 3. Backend enqueues job to Redis queue
 * 4. Returns job_id for polling
 * 5. Frontend then polls /knowledge/status/{job_id}
 * 
 * @param {string} embeddingModel - Model name (text-embedding-3-small, etc)
 * @param {string} documentId - Document UUID from upload
 * @param {string} embeddingProvider - "openai" or "gemini"
 * @param {Array} chunks - Array of document chunks
 * @returns {Promise} { job_id, status: "queued", document_id }
 */
export const updateModelEmbedding = async (embeddingModel, documentId, embeddingProvider, chunks) => {
    try {
        const requestBody = {
            embedding_provider: embeddingProvider,
            embedding_model: embeddingModel,
            document_id: documentId,
            chunks: chunks
        };

        console.log("[⏳ PROCESS] Enqueueing document for embedding:", documentId);
        console.log("[⏳ PROCESS] Request body:", requestBody);
        
        const response = await publicApi.post(`/knowledge/process/${documentId}`, requestBody);
        
        console.log("[✅ PROCESS] Job enqueued:", response.data);
        return response.data; // { job_id, status: "queued", document_id }
    } catch (error) {
        console.error("[❌ PROCESS] Error enqueueing document:", error);
        throw error;
    }
};

/**
 * Poll job status until completion
 * Returns result when status === "finished"
 * Throws error if status === "failed"
 */
export const getKnowledgeResult = async (jobId, maxRetries = 30, pollInterval = 2000) => {
    let retries = 0;
    
    return new Promise((resolve, reject) => {
        const poll = async () => {
            try {
                console.log(`[POLL] Checking job status: ${jobId} (attempt ${retries + 1}/${maxRetries})`);
                const response = await publicApi.get(`/knowledge/status/${jobId}`);
                const { status, result, error, message } = response.data;
                
                console.log(`[POLL] Status: ${status}`);
                
                if (status === 'finished') {
                    console.log('[✅ POLL] Job finished! Result:', result);
                    resolve(result); // ✅ Return result
                } else if (status === 'failed') {
                    console.error('[❌ POLL] Job failed:', error);
                    reject(new Error(error || 'Job failed during processing'));
                } else if (status === 'queued' || status === 'started') {
                    console.log(`[POLL] Job still processing... (${message})`);
                    retries++;
                    
                    if (retries >= maxRetries) {
                        reject(new Error(`Job timeout: exceeded ${maxRetries} retries`));
                    } else {
                        // Poll again after interval
                        setTimeout(poll, pollInterval);
                    }
                }
            } catch (error) {
                console.error('[❌ POLL] Error polling job status:', error);
                reject(error);
            }
        };
        
        // Start polling
        poll();
    });
};