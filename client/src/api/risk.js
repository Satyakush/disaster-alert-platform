import api from "./axios";

export const analyzeRisk = async (region) => {
  const res = await api.post("/risk/analyze", region);
  return res.data;
};
