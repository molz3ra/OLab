import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import { createClient, type Client } from "@libsql/client";
import type { Report, Persona } from "./lab";

// 1. Cliente Turso Cloud (para produção na Vercel e persistência em nuvem)
let _tursoClient: Client | null = null;

export function getTursoClient(): Client | null {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    if (!_tursoClient) {
      _tursoClient = createClient({
        url: process.env.TURSO_DATABASE_URL.trim(),
        authToken: process.env.TURSO_AUTH_TOKEN.trim(),
      });
    }
    return _tursoClient;
  }
  return null;
}

// 2. Fallback SQLite local (para desenvolvimento offline quando Turso não estiver configurado)
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY ||
  process.env.LAMBDA_TASK_ROOT
);

function resolveDatabasePath(): string {
  if (isServerless) {
    return path.resolve(os.tmpdir(), "olab.db");
  }
  return path.resolve(process.cwd(), "olab.db");
}

let _db: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(resolveDatabasePath());
    try {
      _db.exec("PRAGMA busy_timeout = 5000;");
      try {
        _db.exec("PRAGMA journal_mode = WAL;");
      } catch {
        _db.exec("PRAGMA journal_mode = DELETE;");
      }
      initTables(_db);
    } catch (err) {
      console.warn("[db.ts] Aviso durante inicialização:", err);
    }
  }
  return _db;
}

function initTables(db: DatabaseSync) {
  // 1. Better Auth Core Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt INTEGER,
      refreshTokenExpiresAt INTEGER,
      scope TEXT,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
    CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
    CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);

    -- 2. OLAB Application User Data
    CREATE TABLE IF NOT EXISTS user_reports (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      target TEXT NOT NULL,
      sourceType TEXT NOT NULL,
      summary TEXT NOT NULL,
      score INTEGER NOT NULL,
      dataJson TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_personas (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      focus TEXT NOT NULL,
      skepticism INTEGER NOT NULL,
      icon TEXT NOT NULL,
      isDefault INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      userId TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      geminiApiKey TEXT,
      preferredModel TEXT,
      theme TEXT,
      updatedAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_reports_userId ON user_reports(userId);
    CREATE INDEX IF NOT EXISTS idx_user_personas_userId ON user_personas(userId);
  `);
}

// Métodos de persistência de dados do usuário (Compatíveis com Turso Cloud e SQLite local)
export async function getUserReports(userId: string): Promise<Report[]> {
  const turso = getTursoClient();
  if (turso) {
    const res = await turso.execute({
      sql: "SELECT dataJson FROM user_reports WHERE userId = ? ORDER BY createdAt DESC LIMIT 50",
      args: [userId],
    });
    return res.rows.map((r) => JSON.parse(r.dataJson as string) as Report);
  }

  const db = getDatabase();
  const stmt = db.prepare("SELECT dataJson FROM user_reports WHERE userId = ? ORDER BY createdAt DESC LIMIT 50");
  const rows = stmt.all(userId) as { dataJson: string }[];
  return rows.map((r) => JSON.parse(r.dataJson) as Report);
}

export async function saveUserReport(userId: string, report: Report): Promise<void> {
  const turso = getTursoClient();
  const createdAt = new Date(report.createdAt).getTime() || Date.now();
  const dataJson = JSON.stringify(report);

  if (turso) {
    await turso.execute({
      sql: `
        INSERT INTO user_reports (id, userId, target, sourceType, summary, score, dataJson, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          target = excluded.target,
          sourceType = excluded.sourceType,
          summary = excluded.summary,
          score = excluded.score,
          dataJson = excluded.dataJson,
          createdAt = excluded.createdAt
      `,
      args: [report.id, userId, report.target, report.sourceType, report.summary, report.score, dataJson, createdAt],
    });
    return;
  }

  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO user_reports (id, userId, target, sourceType, summary, score, dataJson, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      target = excluded.target,
      sourceType = excluded.sourceType,
      summary = excluded.summary,
      score = excluded.score,
      dataJson = excluded.dataJson,
      createdAt = excluded.createdAt
  `);
  stmt.run(report.id, userId, report.target, report.sourceType, report.summary, report.score, dataJson, createdAt);
}

export async function deleteUserReport(userId: string, reportId: string): Promise<void> {
  const turso = getTursoClient();
  if (turso) {
    await turso.execute({
      sql: "DELETE FROM user_reports WHERE id = ? AND userId = ?",
      args: [reportId, userId],
    });
    return;
  }
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM user_reports WHERE id = ? AND userId = ?");
  stmt.run(reportId, userId);
}

export async function getUserPersonas(userId: string): Promise<Persona[]> {
  const turso = getTursoClient();
  if (turso) {
    const res = await turso.execute({
      sql: "SELECT id, name, role, focus, skepticism, icon FROM user_personas WHERE userId = ? ORDER BY createdAt ASC",
      args: [userId],
    });
    return res.rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      role: r.role as string,
      focus: r.focus as string,
      skepticism: Number(r.skepticism),
      icon: r.icon as Persona["icon"],
    }));
  }

  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM user_personas WHERE userId = ? ORDER BY createdAt ASC");
  const rows = stmt.all(userId) as {
    id: string;
    name: string;
    role: string;
    focus: string;
    skepticism: number;
    icon: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    focus: r.focus,
    skepticism: r.skepticism,
    icon: r.icon as Persona["icon"],
  }));
}

export async function saveUserPersona(userId: string, persona: Persona): Promise<void> {
  const turso = getTursoClient();
  const createdAt = Date.now();

  if (turso) {
    await turso.execute({
      sql: `
        INSERT INTO user_personas (id, userId, name, role, focus, skepticism, icon, isDefault, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          role = excluded.role,
          focus = excluded.focus,
          skepticism = excluded.skepticism,
          icon = excluded.icon
      `,
      args: [persona.id, userId, persona.name, persona.role, persona.focus, persona.skepticism, persona.icon, 0, createdAt],
    });
    return;
  }

  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO user_personas (id, userId, name, role, focus, skepticism, icon, isDefault, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      role = excluded.role,
      focus = excluded.focus,
      skepticism = excluded.skepticism,
      icon = excluded.icon
  `);
  stmt.run(
    persona.id,
    userId,
    persona.name,
    persona.role,
    persona.focus,
    persona.skepticism,
    persona.icon,
    0,
    createdAt
  );
}

export async function deleteUserPersona(userId: string, personaId: string): Promise<void> {
  const turso = getTursoClient();
  if (turso) {
    await turso.execute({
      sql: "DELETE FROM user_personas WHERE id = ? AND userId = ?",
      args: [personaId, userId],
    });
    return;
  }
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM user_personas WHERE id = ? AND userId = ?");
  stmt.run(personaId, userId);
}

export async function resetUserPersonas(userId: string): Promise<void> {
  const turso = getTursoClient();
  if (turso) {
    await turso.execute({
      sql: "DELETE FROM user_personas WHERE userId = ?",
      args: [userId],
    });
    return;
  }
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM user_personas WHERE userId = ?");
  stmt.run(userId);
}
