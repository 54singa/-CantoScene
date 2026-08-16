import { createHash, randomBytes } from "node:crypto";

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { AppConfig } from "../config/env.js";
import { ScriptPreference } from "../generated/prisma/enums.js";
import { dataResponse, enumValue } from "../lib/http.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import type { DatabaseClient } from "../lib/prisma.js";

const refreshCookie = "canto_refresh";
const refreshLifetimeSeconds = 30 * 24 * 60 * 60;

function refreshCookieOptions(config: AppConfig) {
  const crossSite = config.nodeEnv === "production";
  return {
    path: "/api/v1/auth",
    httpOnly: true,
    sameSite: crossSite ? ("none" as const) : ("lax" as const),
    secure: crossSite,
    partitioned: crossSite,
  };
}

type CredentialsBody = {
  email: string;
  password: string;
  display_name?: string;
};

type PreferencesBody = { script_preference: "simplified" | "traditional" };

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(user: {
  id: string;
  displayName: string;
  role: string;
  scriptPreference: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    display_name: user.displayName,
    avatar_url: null,
    role: enumValue(user.role),
    script_preference: enumValue(user.scriptPreference),
    created_at: user.createdAt.toISOString(),
  };
}

async function issueSession(
  app: FastifyInstance,
  reply: FastifyReply,
  database: DatabaseClient,
  config: AppConfig,
  user: { id: string; role: string },
): Promise<string> {
  const accessToken = app.jwt.sign({
    sub: user.id,
    role: enumValue(user.role),
    type: "access",
  });
  const refreshToken = randomBytes(32).toString("base64url");
  await database.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash: tokenHash(refreshToken),
      expiresAt: new Date(Date.now() + refreshLifetimeSeconds * 1000),
    },
  });
  reply.setCookie(refreshCookie, refreshToken, {
    ...refreshCookieOptions(config),
    maxAge: refreshLifetimeSeconds,
  });
  return accessToken;
}

export async function requireUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
    if (request.user.type !== "access") throw new Error("invalid token type");
  } catch {
    await reply.code(401).send({
      error: {
        code: "AUTH_REQUIRED",
        message: "请先登录",
        request_id: request.id,
      },
    });
  }
}

export async function authRoutes(
  app: FastifyInstance,
  database: DatabaseClient,
  config: AppConfig,
): Promise<void> {
  const credentialSchema = {
    type: "object",
    additionalProperties: false,
    required: ["email", "password"],
    properties: {
      email: { type: "string", minLength: 3, maxLength: 254, pattern: "^.+@.+\\..+$" },
      password: { type: "string", minLength: 8, maxLength: 128 },
      display_name: { type: "string", minLength: 1, maxLength: 80 },
    },
  } as const;

  app.post<{ Body: CredentialsBody }>(
    "/auth/register",
    { schema: { body: credentialSchema } },
    async (request, reply) => {
      const email = request.body.email.trim().toLowerCase();
      if (await database.user.findUnique({ where: { email }, select: { id: true } })) {
        return reply.code(409).send({
          error: { code: "CONFLICT", message: "该邮箱已注册", request_id: request.id },
        });
      }
      const passwordHash = await hashPassword(request.body.password);
      const user = await database.$transaction(async (transaction) => {
        const created = await transaction.user.create({
          data: {
            email,
            displayName: request.body.display_name?.trim() || email.split("@")[0] || "粤语学习者",
          },
        });
        await transaction.userCredential.create({ data: { userId: created.id, passwordHash } });
        return created;
      });
      const accessToken = await issueSession(app, reply, database, config, user);
      return reply.code(201).send(dataResponse({ user: publicUser(user), access_token: accessToken, expires_in: 900 }, request.id));
    },
  );

  app.post<{ Body: CredentialsBody }>(
    "/auth/login",
    { schema: { body: credentialSchema } },
    async (request, reply) => {
      const user = await database.user.findUnique({
        where: { email: request.body.email.trim().toLowerCase() },
        include: { credential: true },
      });
      if (!user?.credential || !(await verifyPassword(request.body.password, user.credential.passwordHash))) {
        return reply.code(401).send({
          error: { code: "INVALID_CREDENTIALS", message: "邮箱或密码错误", request_id: request.id },
        });
      }
      const accessToken = await issueSession(app, reply, database, config, user);
      return dataResponse({ user: publicUser(user), access_token: accessToken, expires_in: 900 }, request.id);
    },
  );

  app.post("/auth/refresh", async (request, reply) => {
    const rawToken = request.cookies[refreshCookie];
    if (!rawToken) return reply.code(401).send({ error: { code: "AUTH_REQUIRED", message: "登录已过期", request_id: request.id } });
    const session = await database.refreshSession.findUnique({
      where: { tokenHash: tokenHash(rawToken) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      reply.clearCookie(refreshCookie, refreshCookieOptions(config));
      return reply.code(401).send({ error: { code: "AUTH_REQUIRED", message: "登录已过期", request_id: request.id } });
    }
    await database.refreshSession.delete({ where: { id: session.id } });
    const accessToken = await issueSession(app, reply, database, config, session.user);
    return dataResponse({ access_token: accessToken, expires_in: 900 }, request.id);
  });

  app.post("/auth/logout", async (request, reply) => {
    const rawToken = request.cookies[refreshCookie];
    if (rawToken) await database.refreshSession.deleteMany({ where: { tokenHash: tokenHash(rawToken) } });
    reply.clearCookie(refreshCookie, refreshCookieOptions(config));
    return reply.code(204).send();
  });

  app.get("/me", { preHandler: requireUser }, async (request, reply) => {
    const user = await database.user.findUnique({ where: { id: request.user.sub } });
    if (!user) return reply.code(401).send({ error: { code: "AUTH_REQUIRED", message: "用户不存在", request_id: request.id } });
    return dataResponse(publicUser(user), request.id);
  });

  app.patch<{ Body: PreferencesBody }>(
    "/me/preferences",
    {
      preHandler: requireUser,
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["script_preference"],
          properties: { script_preference: { type: "string", enum: ["simplified", "traditional"] } },
        },
      },
    },
    async (request) => {
      const user = await database.user.update({
        where: { id: request.user.sub },
        data: {
          scriptPreference:
            request.body.script_preference === "traditional"
              ? ScriptPreference.TRADITIONAL
              : ScriptPreference.SIMPLIFIED,
        },
      });
      return dataResponse(publicUser(user), request.id);
    },
  );
}
