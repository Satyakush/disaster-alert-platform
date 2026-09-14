import api from "./axios";

export const analyzeRisk = async (region, hazard = {}) => {
  const res = await api.post("/risk/analyze", { region, hazard });
  return res.data;
};
