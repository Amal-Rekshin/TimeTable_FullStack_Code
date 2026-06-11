// src/utils/storage.js

const STORAGE_KEY = "department_timetable";

export const saveToStorage = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadFromStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};
