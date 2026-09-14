import api from "./axios";

export const fetchReports = async (params = {}) => {
  const res = await api.get("/reports", { params });
  return res.data;
};

export const createReport = async (data) => {
  const res = await api.post("/reports", data);
  return res.data;
};

export const updateReportStatus = async (id, data) => {
  const res = await api.patch(`/reports/${id}/status`, data);
  return res.data;
};
