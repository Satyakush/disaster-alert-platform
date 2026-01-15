import api from "./axios";

export const fetchAlerts = async () => {
  const res = await api.get("/alerts");
  return res.data;
};

export const createAlert = async (data) => {
  const res = await api.post("/alerts", data);
  return res.data;
};

export const updateAlert = async (id, data) => {
  const res = await api.put(`/alerts/${id}`, data);
  return res.data;
};

export const deleteAlert = async (id) => {
  const res = await api.delete(`/alerts/${id}`);
  return res.data;
};
