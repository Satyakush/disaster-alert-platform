import api from "./axios";

export const fetchResponseTasks = async (all = false) => {
  const res = await api.get("/response-tasks", {
    params: all ? { all: "true" } : {},
  });
  return res.data;
};

export const createResponseTask = async (data) => {
  const res = await api.post("/response-tasks", data);
  return res.data;
};

export const updateResponseTask = async (id, data) => {
  const res = await api.patch(`/response-tasks/${id}`, data);
  return res.data;
};
