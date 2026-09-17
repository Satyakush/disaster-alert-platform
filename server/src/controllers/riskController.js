import axios from "axios";

export const analyzeRisk = async (req, res) => {
  try {
    const { region, hazard } = req.body;

    if (!region || typeof region !== "object") {
      return res.status(400).json({ message: "Region data is required" });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const endpoint = `${mlServiceUrl.replace(/\/$/, "")}/analyze-risk`;
    const payload = {
      region,
      hazard: hazard || {},
      meta: {
        source: "map-selection",
      },
    };

    let lastError;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const mlResponse = await axios.post(endpoint, payload, {
          timeout: 15000,
        });

        return res.status(200).json(mlResponse.data);
      } catch (error) {
        lastError = error;

        const status = error.response?.status;
        const retryable =
          !status ||
          status === 502 ||
          status === 503 ||
          status === 504;

        if (!retryable || attempt === 3) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    console.error("Risk analysis error:", lastError?.message);

    if (lastError?.response?.data) {
      return res
        .status(lastError.response.status || 502)
        .json(lastError.response.data);
    }

    return res.status(502).json({
      message: "Risk analysis service unavailable",
    });
  } catch (error) {
    console.error("Risk analysis error:", error.message);
    return res.status(502).json({
      message: "Risk analysis service unavailable",
    });
  }
};
