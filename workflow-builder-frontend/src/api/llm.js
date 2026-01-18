import { publicApi } from '../helpers/axiosInstance';

 
export const llmResponseApi = async (data) => {
    try {
        console.log("LLM request data:", data);
        const response = await publicApi.post('/llm/process', data);
        
        console.log("LLM response data:", response.data);
        return response.data; // { answer, sources }
    } catch (error) {
        console.error("Error in LLM response API:", error);
        throw error;
    }
};
 
