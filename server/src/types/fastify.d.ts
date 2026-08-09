import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; role: string; type: "access" };
    user: { sub: string; role: string; type: "access" };
  }
}
