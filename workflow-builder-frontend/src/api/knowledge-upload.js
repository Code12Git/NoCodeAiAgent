import { fileUploadApi, publicApi } from '../helpers/axiosInstance';
 
export const uploadKnowledgeFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log("[ UPLOAD] Uploading file:", file.name);
        const response = await fileUploadApi.post('/knowledge/upload', formData);
        
        console.log("[ UPLOAD] Upload successful:", response.data);
        return response.data; // { document_id, chunks_count, chunks }
    } catch (error) {
        console.error("[ UPLOAD] Error uploading knowledge file:", error);
        throw error;
    }
};

 
export const updateModelEmbedding = async (embeddingModel, documentId, embeddingProvider, chunks) => {
    try {
        const requestBody = {
            embedding_provider: embeddingProvider,
            embedding_model: embeddingModel,
            document_id: documentId,
            chunks: chunks
        };

        console.log("[ PROCESS] Enqueueing document for embedding:", documentId);
        console.log("[ PROCESS] Request body:", requestBody);
        
        const response = await publicApi.post(`/knowledge/process/${documentId}`, requestBody);
        
        console.log("[ PROCESS] Job enqueued:", response.data);
        return response.data; // { job_id, status: "queued", document_id }
    } catch (error) {
        console.error("[PROCESS] Error enqueueing document:", error);
        throw error;
    }
};

 
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
                    console.log('[ POLL] Job finished! Result:', result);
                    resolve(result); //Return result
                } else if (status === 'failed') {
                    console.error('[ POLL] Job failed:', error);
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
                console.error('[POLL] Error polling job status:', error);
                reject(error);
            }
        };
        
         poll();
    });
};