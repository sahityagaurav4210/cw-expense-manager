const axios = require("axios");
const logger = require("../config/logger");

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://127.0.0.1:8080";
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000";

class ProxyController {
  static async forwardRequest(req, res) {
    const basePath = req.originalUrl.split("?")[0];
    const targetUrl = `${API_GATEWAY_URL}${basePath}`;
    const fallbackUrl = `${BACKEND_URL}${basePath}`;

    const headers = {
      ...req.headers,
      host: undefined,
    };

    if (req.cookies && req.cookies.access_token) {
      headers["authorization"] = `Bearer ${req.cookies.access_token}`;
    }

    const data = req.headers["content-type"]?.includes("multipart/form-data") ? req : req.body;

    try {
      logger.info(`BFF Forwarding request: ${req.method} ${targetUrl}`);
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data,
        headers,
        params: req.query,
        validateStatus: () => true, // Pass-through all status codes (2xx, 4xx, 5xx) from API Gateway
      });

      if (response.headers["set-cookie"]) {
        res.setHeader("set-cookie", response.headers["set-cookie"]);
      }
      return res.status(response.status).json(response.data);
    } catch (gatewayErr) {
      // If API Gateway responded with an HTTP status code, send that back
      if (gatewayErr.response) {
        return res.status(gatewayErr.response.status).json(gatewayErr.response.data);
      }

      // API Gateway server connection completely refused/failed
      logger.warn(`API Gateway unreachable (${gatewayErr.message}), attempting direct Backend fallback: ${fallbackUrl}`);
      try {
        const response = await axios({
          method: req.method,
          url: fallbackUrl,
          data,
          headers,
          params: req.query,
          validateStatus: () => true,
        });
        if (response.headers["set-cookie"]) {
          res.setHeader("set-cookie", response.headers["set-cookie"]);
        }
        return res.status(response.status).json(response.data);
      } catch (backendErr) {
        const status = backendErr.response?.status || 500;
        const respData = backendErr.response?.data || { status: "error", message: backendErr.message };
        return res.status(status).json(respData);
      }
    }
  }
}

module.exports = ProxyController;
