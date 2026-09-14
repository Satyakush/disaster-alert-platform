const getRoutingServiceUrl = () => (process.env.ROUTING_SERVICE_URL || "https://router.project-osrm.org").replace(/\/$/, "");

export const getEvacuationRoute = async (req, res) => {
  try {
    const originLatitude = Number(req.query.originLatitude);
    const originLongitude = Number(req.query.originLongitude);
    const destinationLatitude = Number(req.query.destinationLatitude);
    const destinationLongitude = Number(req.query.destinationLongitude);

    const values = [originLatitude, originLongitude, destinationLatitude, destinationLongitude];
    if (values.some((value) => !Number.isFinite(value)) || originLatitude < -90 || originLatitude > 90 || destinationLatitude < -90 || destinationLatitude > 90 || originLongitude < -180 || originLongitude > 180 || destinationLongitude < -180 || destinationLongitude > 180) {
      return res.status(400).json({ message: "Valid origin and destination coordinates are required" });
    }

    const coordinates = `${originLongitude},${originLatitude};${destinationLongitude},${destinationLatitude}`;
    const url = `${getRoutingServiceUrl()}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ message: "Routing service returned an error" });
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route) {
      return res.status(404).json({ message: "No drivable route found" });
    }

    return res.status(200).json({
      provider: "OSRM",
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      geometry: route.geometry,
      steps: (route.legs?.[0]?.steps || []).map((step) => ({
        distanceMeters: Math.round(step.distance),
        durationSeconds: Math.round(step.duration),
        instruction: step.maneuver?.instruction || `${step.maneuver?.type || "Continue"} on ${step.name || "the road"}`,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: "Evacuation route service is unavailable" });
  }
};
