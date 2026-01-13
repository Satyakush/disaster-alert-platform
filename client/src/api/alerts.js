import api from "./axios";

export const fetchAlerts = async () => {
  const response = await api.get("/alerts");
  return response.data;
};
