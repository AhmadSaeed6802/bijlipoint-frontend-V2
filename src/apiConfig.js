const API_URL =
  process.env.NODE_ENV === "development"
    ? "https://localhost:49597/api"   // backend during local dev
    : "https://api.bijlipoint.com/api";
    //: "https://bijlipoint.com";   // backend in production

export default API_URL;
