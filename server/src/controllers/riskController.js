import axios from "axios";

export const analyzeRisk = async (req, res) => {
  try {
    const { region, hazard } = req.body;

    if (!region || typeof region !== "object") {
      return res.status(400).json({ message: "Region data is required" });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

    const mlResponse = await axios.post(
      `${mlServiceUrl.replace(/\/$/, "")}/analyze-risk`,
      {
        region,
        hazard: hazard || {},
        meta: {
          source: "map-selection",
        },
      },
      { timeout: 5000 }
    );

    return res.status(200).json(mlResponse.data);
  } catch (error) {
    console.error("Risk analysis error:", error.message);

    if (error.response?.data) {
      return res.status(error.response.status || 502).json(error.response.data);
    }

    return res.status(502).json({ message: "Risk analysis service unavailable" });
  }
};
