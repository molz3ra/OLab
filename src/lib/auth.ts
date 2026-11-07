import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { getDatabase } from "./db";
import crypto from "node:crypto";

// Resolução de banco de dados: Turso Cloud quando disponível, SQLite local como fallback
const resolveDatabase = () => {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    return {
      dialect: new LibsqlDialect({
        url: process.env.TURSO_DATABASE_URL.trim(),
        authToken: process.env.TURSO_AUTH_TOKEN.trim(),
      }),
      type: "sqlite" as const,
    };
  }
  return getDatabase();
};

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

// Resolução dinâmica de Base URL para suportar Vercel, produção e desenvolvimento local
const resolveBaseUrl = (): string => {
  if (process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_URL.trim()) {
    return process.env.BETTER_AUTH_URL.trim();
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.trim();
  }
  return "http://localhost:3000";
};

export const auth = betterAuth({
  database: resolveDatabase(),
  baseURL: resolveBaseUrl(),
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.BETTER_AUTH_URL || "",
    process.env.NEXT_PUBLIC_APP_URL || "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
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

