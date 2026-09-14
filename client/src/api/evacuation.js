import api from "./axios";

export const fetchNearestShelters = async ({ latitude, longitude, limit = 5, maxDistance = 25000 }) => {
  const res = await api.get("/evacuation/nearest-shelters", {
    params: { latitude, longitude, limit, maxDistance },
  });
  return res.data;
};

export const fetchEvacuationGuidance = async ({ disasterType, severity }) => {
  const res = await api.get("/evacuation/guidance", {
    params: { disasterType, severity },
  });
  return res.data;
};
