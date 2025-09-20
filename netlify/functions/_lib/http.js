export const json = (statusCode, data, extraHeaders = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...extraHeaders },
  body: JSON.stringify(data)
});

export const bodyJSON = (event) => {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    console.error("Failed to parse JSON body", error);
    return {};
  }
};
