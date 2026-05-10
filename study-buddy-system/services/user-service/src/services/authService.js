import prisma from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { sendEvent } from "../config/kafka.js";

export const registerUser = async (data) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) throw new Error("User already exists");

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  try {
    await sendEvent("UserCreated", {
      event: "UserCreated",
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });
  } catch {
    console.log("Kafka not running, skipping event...");
  }

  return user;
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("User not found");

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new Error("Invalid password");

  const token = generateToken(user);

  return { user, token };
};