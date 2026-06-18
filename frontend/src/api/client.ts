import axios from "axios";

// single axios instance used everywhere in the app
// baseURL points at your Go server
const apiClient = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
});

// request interceptor — runs before every single request
// reads the token from localStorage and attaches it automatically
// this means every apiClient.get/post/etc just works, no manual headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// response interceptor — runs after every response
// if the server returns 401 (token expired or invalid),
// clear local auth state and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("player_id");
      localStorage.removeItem("username");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
