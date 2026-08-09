export type ResponseMeta = {
  request_id: string;
  next_cursor?: string | null;
  has_more?: boolean;
};

export function dataResponse<T>(data: T, requestId: string) {
  return {
    data,
    meta: {
      request_id: requestId,
    } satisfies ResponseMeta,
  };
}

export function listResponse<T>(
  data: T[],
  requestId: string,
  nextCursor: string | null,
) {
  return {
    data,
    meta: {
      next_cursor: nextCursor,
      has_more: nextCursor !== null,
      request_id: requestId,
    } satisfies ResponseMeta,
  };
}

export function enumValue(value: string): string {
  return value.toLowerCase();
}

export function encodeCursor(position: number): string {
  return Buffer.from(JSON.stringify({ position }), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined): number | undefined {
  if (!cursor) return undefined;

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { position?: unknown };

    if (!Number.isInteger(parsed.position) || Number(parsed.position) < 0) {
      return undefined;
    }
    return Number(parsed.position);
  } catch {
    return undefined;
  }
}
