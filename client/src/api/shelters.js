import api from "./axios";

export const fetchShelters = async (params = {}) => {
  const res = await api.get("/shelters", { params });
  return res.data;
};

export const createShelter = async (data) => {
  const res = await api.post("/shelters", data);
  return res.data;
};

export const updateShelter = async (id, data) => {
  const res = await api.put(`/shelters/${id}`, data);
  return res.data;
};

export const deleteShelter = async (id) => {
  const res = await api.delete(`/shelters/${id}`);
  return res.data;
};
