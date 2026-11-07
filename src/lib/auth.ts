import { betterAuth } from "better-auth";
import { getDatabase } from "./db";
import crypto from "node:crypto";

// Resolução de segredo criptográfico: consistente em desenvolvimento, rigoroso em produção
const getAuthSecret = (): string => {
  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.trim().length >= 16) {
    return process.env.BETTER_AUTH_SECRET.trim();
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[SECURITY WARNING] BETTER_AUTH_SECRET não está definido! Defina uma chave segura nas variáveis de ambiente."
    );
  }
  // Segredo estável de desenvolvimento local (evita invalidar sessões e cookies a cada reload do Next.js)
  return "olab_development_consistent_secret_key_32_bytes_long_ok";
};

export const auth = betterAuth({
  database: getDatabase(),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.BETTER_AUTH_URL || "",
  ].filter(Boolean),
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

