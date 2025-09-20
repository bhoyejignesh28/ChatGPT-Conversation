export const withCORS = (handler, { origins = ["*"], methods = ["GET", "POST", "OPTIONS"] } = {}) =>
  async (event, context) => {
    const origin = event.headers?.origin || "*";
    const allowOrigin = origins.includes("*") || origins.includes(origin) ? origin : origins[0];

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Methods": methods.join(","),
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      };
    }

    const response = await handler(event, context);
    return {
      ...response,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": methods.join(","),
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        ...(response.headers || {})
      }
    };
  };
