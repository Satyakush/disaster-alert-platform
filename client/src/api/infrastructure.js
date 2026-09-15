import api from "./axios";

export const fetchInfrastructure = async (params = {}) => {
  const res = await api.get("/infrastructure", { params });
  return res.data;
};

export const createInfrastructure = async (data) => {
  const res = await api.post("/infrastructure", data);
  return res.data;
};

export const updateInfrastructure = async (id, data) => {
  const res = await api.put(`/infrastructure/${id}`, data);
  return res.data;
};

export const deleteInfrastructure = async (id) => {
  const res = await api.delete(`/infrastructure/${id}`);
  return res.data;
};
