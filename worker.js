import { Hono } from "hono";
import { cors } from "hono/cors";
import zipData from "./us_zip.json";

const app = new Hono();

// CORS — replaces flask_cors
app.use("*", cors());

// GET /zip-lookup/:zip
// Replaces: @app.route('/zip-lookup/<id_value>')
app.get("/zip-lookup/:zip", (c) => {
  const zip = c.req.param("zip");
  const record = zipData[zip];

  if (record) {
    return c.json(record, 200);
  } else {
    return c.json({ error: "Record not found" }, 404);
  }
});

// GET /air-quality-api/:zip
// Replaces: @app.route('/air-quality-api/<id_value>')
app.get("/air-quality-api/:zip", async (c) => {
  const zip = c.req.param("zip");
  const API_KEY = c.env.AIRNOW_API_KEY; // pulled from Worker Secret

  const params = new URLSearchParams({
    format: "application/json",
    zipCode: zip,
    distance: "25",
    API_KEY: API_KEY,
  });

  try {
    const response = await fetch(`https://www.airnowapi.org/aq/observation/zipCode/current/?${params}`);

    if (!response.ok) {
      return c.json({ error: `AirNow API error: ${response.status}` }, 500);
    }

    const data = await response.json();
    return c.json(data);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

export default app;
