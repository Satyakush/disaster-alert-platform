import api from "./axios";

export const fetchResources = async (params = {}) => {
  const res = await api.get("/resources", { params });
  return res.data;
};

export const createResource = async (data) => {
  const res = await api.post("/resources", data);
  return res.data;
};

export const updateResource = async (id, data) => {
  const res = await api.put(`/resources/${id}`, data);
  return res.data;
};

export const deleteResource = async (id) => {
  const res = await api.delete(`/resources/${id}`);
  return res.data;
};
