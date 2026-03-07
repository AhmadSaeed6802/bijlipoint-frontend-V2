const API_URL =
  process.env.NODE_ENV === "development"
    ? "https://localhost:49597"   // backend during local dev
    : "https://bijlipoint.com";   // backend in production

export default API_URL;
