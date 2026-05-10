import prisma from "../config/db.js";

export const getUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
};