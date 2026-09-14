import api from "./axios";

export const fetchResponseTeam = async () => {
  const res = await api.get("/admin/response-team");
  return res.data;
};

export const assignResponderRole = async (id) => {
  const res = await api.patch(`/admin/response-team/${id}/assign`);
  return res.data;
};

export const revokeResponderRole = async (id) => {
  const res = await api.patch(`/admin/response-team/${id}/revoke`);
  return res.data;
};
