import axios, { AxiosInstance } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"; //"http://162.255.117.211/api" //
const apiService = axios.create({
  baseURL,
  withCredentials: true
});

export default apiService;