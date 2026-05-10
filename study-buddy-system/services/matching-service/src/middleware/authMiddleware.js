import { verifyToken } from "../utils/jwt.js";

export const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    return verifyToken(token.replace("Bearer ", ""));
  } catch {
    return null;
  }
};
