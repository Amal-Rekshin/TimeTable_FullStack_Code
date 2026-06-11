import axios from "axios";

const API_BASE_URL = "https://timetable-fullstack-code.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const fetchDepartments = () => api.get("/departments").then((res) => res.data);
export const addDepartment = (data) => api.post("/departments", data).then((res) => res.data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data).then((res) => res.data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`).then((res) => res.data);

export const fetchStaff = () => api.get("/staff").then((res) => res.data);
export const addStaff = (data) => api.post("/staff", data).then((res) => res.data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data).then((res) => res.data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`).then((res) => res.data);

export const fetchRooms = () => api.get("/rooms").then((res) => res.data);
export const addRoom = (data) => api.post("/rooms", data).then((res) => res.data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data).then((res) => res.data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`).then((res) => res.data);

export const fetchSubjects = () => api.get("/subjects").then((res) => res.data);
export const addSubject = (data) => api.post("/subjects", data).then((res) => res.data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data).then((res) => res.data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`).then((res) => res.data);

export const generateTimetableAPI = (data) => api.post("/timetable/generate", data).then((res) => res.data);
export const generateStrictTimetableAPI = (data) => api.post("/timetable/generate-strict", data).then((res) => res.data);
export const archiveTimetableAPI = (data) => api.post("/timetable/archive", data).then((res) => res.data);
export const fetchArchives = () => api.get("/timetable/archive").then((res) => res.data);
export const fetchArchivesByDept = (dept) => api.get(`/timetable/archive/${dept}`).then((res) => res.data);
export const deleteArchive = (id) => api.delete(`/timetable/archive/${id}`).then((res) => res.data);

// User Auth Endpoints
export const signup = (data) => api.post("/users/signup", data).then((res) => res.data);
export const login = (data) => api.post("/users/login", data).then((res) => res.data);
export const fetchUsers = () => api.get("/users").then((res) => res.data);
export const updateRole = (id, role) => api.put(`/users/${id}/role`, role).then((res) => res.data);
export const fetchConfigs = () => api.get("/config").then((res) => res.data);
export const updateConfig = (key, value) => api.put(`/config/${key}`, value).then((res) => res.data);

export default api;
