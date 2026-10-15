const axios = require("axios");
const logger = require("../config/logger");

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://127.0.0.1:8080";
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000";

function forwardResponseHeadersAndStream(axiosResp, res) {
  for (const [key, val] of Object.entries(axiosResp.headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "set-cookie") {
      res.setHeader("set-cookie", val);
    } else if (
      [
        "content-type",
        "content-disposition",
        "content-length",
        "accept-ranges",
        "cache-control",
        "etag",
        "last-modified",
      ].includes(lowerKey)
    ) {
      res.setHeader(key, val);
    }
  }
  res.status(axiosResp.status);
  axiosResp.data.on("error", (err) => {
    logger.error(`Stream pipe error: ${err.message}`);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });
  return axiosResp.data.pipe(res);
}

class ProxyController {
  static async forwardRequest(req, res) {
    const rawPath = req.originalUrl.split("?")[0];
    const basePath =
      rawPath.length > 1 && rawPath.endsWith("/")
        ? rawPath.replace(/\/+$/, "")
        : rawPath;
    const isUploads = basePath.startsWith("/uploads");
    const fallbackUrl = `${BACKEND_URL}${basePath}`;
    const targetUrl = isUploads ? fallbackUrl : `${API_GATEWAY_URL}${basePath}`;

    const headers = {
      ...req.headers,
      host: undefined,
      origin: undefined,
    };

    // Always delete content-length so axios accurately sets the payload byte length
    delete headers["content-length"];

    // Forward original client IP in X-Forwarded-For so API Gateway rate limits per actual client
    if (!headers["x-forwarded-for"]) {
      headers["x-forwarded-for"] = req.ip || req.connection?.remoteAddress || "127.0.0.1";
    }

    if (req.cookies && req.cookies.access_token) {
      headers["authorization"] = `Bearer ${req.cookies.access_token}`;
    }

    const isGetOrHead = ["GET", "HEAD"].includes(req.method.toUpperCase());
    let data = undefined;
    if (!isGetOrHead) {
      if (req.headers["content-type"]?.includes("multipart/form-data")) {
        data = await new Promise((resolve, reject) => {
          const chunks = [];
          req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          req.on("end", () => resolve(Buffer.concat(chunks)));
          req.on("error", (err) => reject(err));
        });
      } else if (req.body && Object.keys(req.body).length > 0) {
        data = req.body;
      } else {
        data = undefined;
      }
    }

    try {
      logger.info(`BFF Forwarding request: ${req.method} ${targetUrl}`);
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data,
        headers,
        params: req.query,
        responseType: "stream",
        validateStatus: () => true, // Pass-through status codes from gateway
      });

      // If gateway returns 404, 403, or 500 (gateway connection reset/error), attempt direct backend fallback
      if ((response.status === 404 || response.status === 403 || response.status >= 500) && targetUrl !== fallbackUrl) {
        logger.warn(`Gateway returned ${response.status} for ${targetUrl}, trying backend fallback: ${fallbackUrl}`);
        const fallbackResp = await axios({
          method: req.method,
          url: fallbackUrl,
          data,
          headers,
          params: req.query,
          responseType: "stream",
          validateStatus: () => true,
        });
        return forwardResponseHeadersAndStream(fallbackResp, res);
      }

      return forwardResponseHeadersAndStream(response, res);
    } catch (gatewayErr) {
      // If API Gateway responded with an HTTP status code, send that back
      if (gatewayErr.response) {
        return forwardResponseHeadersAndStream(gatewayErr.response, res);
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
          responseType: "stream",
          validateStatus: () => true,
        });

        return forwardResponseHeadersAndStream(response, res);
      } catch (backendErr) {
        if (backendErr.response) {
          return forwardResponseHeadersAndStream(backendErr.response, res);
        }
        const status = backendErr.response?.status || 500;
        const respData = { status: "error", message: backendErr.message };
        return res.status(status).json(respData);
      }
    }
  }
}

module.exports = ProxyController;
