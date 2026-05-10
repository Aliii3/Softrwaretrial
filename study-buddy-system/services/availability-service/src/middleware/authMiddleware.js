import { verifyToken } from "../utils/jwt.js";

export const getUserFromToken = (token) => {
  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    console.log("DECODED TOKEN:", decoded);
    return decoded;
  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return null;
  }
};