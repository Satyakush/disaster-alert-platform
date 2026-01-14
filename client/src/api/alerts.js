import api from "./axios";

export const fetchAlerts = async () => {
  const response = await api.get("/alerts");
  return response.data;
};

export const createAlert = async (data) => {
  const response = await api.post("/alerts", data);
  return response.data;
};