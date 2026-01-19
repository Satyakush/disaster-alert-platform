import axios from "axios";

export const analyzeRisk = async (req, res) => {
  try {
    const region = req.body;

    if (!region) {
      return res.status(400).json({
        message: "Region data is required",
      });
    }

    const mlResponse = await axios.post(
      "http://localhost:8000/analyze-risk",
      {
        region,
        meta: {
          source: "map-selection",
        },
      },
      { timeout: 5000 }
    );

    return res.status(200).json(mlResponse.data);
  } catch (error) {
    console.error("Risk analysis error:", error.message);

    return res.status(500).json({
      message: "Risk analysis failed",
    });
  }
};
