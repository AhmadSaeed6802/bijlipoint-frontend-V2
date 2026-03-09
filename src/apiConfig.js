const API_URL =
  process.env.NODE_ENV === "development"
    ? "https://localhost:49597/api"   // backend during local dev
    : "http://156.67.29.207:5000/api";
    //: "https://bijlipoint.com";   // backend in production

export default API_URL;
