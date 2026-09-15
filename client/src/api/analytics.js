import api from "./axios";

export const fetchAnalyticsOverview = async (days = 30) => {
  const res = await api.get("/analytics/overview", { params: { days } });
  return res.data;
};
