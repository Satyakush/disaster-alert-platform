import Shelter from "../models/shelter.js";

const hazardInstructions = {
  flood: [
    "Move to higher ground and avoid walking or driving through floodwater.",
    "Disconnect electricity if water is entering the building and it is safe to do so.",
    "Follow official evacuation routes and shelter instructions.",
  ],
  cyclone: [
    "Stay indoors away from windows and exterior doors.",
    "Secure loose objects and keep emergency supplies ready.",
    "Evacuate immediately if local authorities issue an evacuation order.",
  ],
  earthquake: [
    "Drop, cover, and hold on during shaking.",
    "After shaking stops, move away from damaged structures and utility lines.",
    "Use designated emergency routes and avoid elevators in damaged buildings.",
  ],
  wildfire: [
    "Leave early when evacuation is ordered or fire conditions deteriorate.",
    "Close windows and doors while preparing to leave.",
    "Avoid smoke-heavy roads and follow official evacuation directions.",
  ],
  heatwave: [
    "Move to a cool or air-conditioned location.",
    "Drink water regularly and avoid strenuous outdoor activity.",
    "Check on children, older adults, and people who may need assistance.",
  ],
  storm: [
    "Stay indoors and away from windows during severe conditions.",
    "Avoid exposed roads, trees, and flooded areas.",
    "Follow local emergency instructions.",
  ],
  landslide: [
    "Move away from steep slopes and the path of moving debris.",
    "Do not cross active landslide areas or unstable roads.",
    "Follow evacuation orders from local authorities.",
  ],
  tsunami: [
    "Move immediately to higher ground or inland after a warning or strong coastal earthquake.",
    "Do not return to the coast until authorities declare it safe.",
    "Follow marked tsunami evacuation routes.",
  ],
  industrial: [
    "Follow official shelter-in-place or evacuation instructions.",
    "Avoid smoke, fumes, spills, and visibly contaminated areas.",
    "If instructed to shelter indoors, close windows and ventilation openings.",
  ],
  other: [
    "Follow instructions from emergency authorities.",
    "Move away from the immediate hazard area and avoid unnecessary travel.",
    "Keep emergency communication channels available.",
  ],
};

export const getNearestShelters = async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
    const maxDistance = Math.min(Math.max(Number(req.query.maxDistance) || 25000, 100), 100000);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "Valid latitude and longitude are required" });
    }

    const shelters = await Shelter.find({
      status: { $in: ["open", "limited"] },
      availableCapacity: { $gt: 0 },
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
    })
      .limit(limit)
      .select("name location coordinates capacity availableCapacity status facilities contact");

    const results = shelters.map((shelter) => ({
      ...shelter.toObject(),
      distanceMeters: calculateDistance(
        latitude,
        longitude,
        shelter.coordinates.coordinates[1],
        shelter.coordinates.coordinates[0]
      ),
    }));

    return res.status(200).json({ count: results.length, shelters: results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to find nearby shelters" });
  }
};

export const getEvacuationGuidance = async (req, res) => {
  const disasterType = req.query.disasterType || "other";
  const severity = req.query.severity || "medium";
  const instructions = hazardInstructions[disasterType] || hazardInstructions.other;

  const priorityInstruction = severity === "critical" || severity === "high"
    ? "Treat this as a high-priority situation and follow official evacuation orders immediately."
    : "Keep monitoring official emergency updates and be prepared to evacuate if conditions worsen.";

  return res.status(200).json({
    disasterType,
    severity,
    priorityInstruction,
    instructions,
  });
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
