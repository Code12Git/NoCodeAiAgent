import axios from 'axios';
 
export const publicApi = axios.create({
  baseURL: 'http://localhost:8000',  
  headers: {
    'Content-Type': 'application/json',
  },
 });

 
 
export const privateApi = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  }
});

export const fileUploadApi = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'multipart/form-data',
    }
    });

 

 
export default { public: publicApi, private: privateApi, fileUpload: fileUploadApi };