import { betterAuth } from "better-auth";
import { getDatabase } from "./db";
import crypto from "node:crypto";

// Resolução de segredo criptográfico com fallback randômico efêmero em memória
const getAuthSecret = (): string => {
  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.trim().length >= 16) {
    return process.env.BETTER_AUTH_SECRET.trim();
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[SECURITY WARNING] BETTER_AUTH_SECRET não está definido! Defina uma chave segura nas variáveis de ambiente."
    );
  }
  // Chave criptograficamente forte gerada em tempo de execução
  return crypto.randomBytes(32).toString("hex");
};

export const auth = betterAuth({
  database: getDatabase(),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: getAuthSecret(),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
});

export type Auth = typeof auth;

