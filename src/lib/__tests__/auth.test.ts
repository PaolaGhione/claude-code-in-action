// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const { createSession, getSession, deleteSession, verifySession } =
  await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeValidToken(
  userId = "user-123",
  email = "test@example.com",
  expirationTime = "7d"
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new SignJWT({ userId, email, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

describe("createSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("sets a cookie with the correct name", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    expect(mockCookieStore.set.mock.calls[0][0]).toBe("auth-token");
  });

  test("sets cookie with httpOnly, lax sameSite, and root path", async () => {
    await createSession("user-123", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("sets secure:false outside production", async () => {
    await createSession("user-123", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.secure).toBe(false);
  });

  test("sets expiry approximately 7 days in the future", async () => {
    const before = Date.now();
    await createSession("user-123", "test@example.com");
    const after = Date.now();

    const options = mockCookieStore.set.mock.calls[0][2];
    const expiresMs = (options.expires as Date).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDays + 1000);
  });
});

describe("getSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    expect(await getSession()).toBeNull();
  });

  test("returns the session payload for a valid token", async () => {
    const token = await makeValidToken("user-123", "test@example.com");
    mockCookieStore.get.mockReturnValue({ value: token });

    const result = await getSession();
    expect(result?.userId).toBe("user-123");
    expect(result?.email).toBe("test@example.com");
  });

  test("returns null for a malformed token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not.a.valid.jwt" });

    expect(await getSession()).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const token = await makeValidToken("user-123", "test@example.com", "-1s");
    mockCookieStore.get.mockReturnValue({ value: token });

    expect(await getSession()).toBeNull();
  });
});

describe("deleteSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("deletes the auth cookie", async () => {
    await deleteSession();

    expect(mockCookieStore.delete).toHaveBeenCalledOnce();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
  });
});

describe("verifySession", () => {
  function makeRequest(cookieValue: string | undefined): NextRequest {
    return {
      cookies: {
        get: vi.fn().mockReturnValue(
          cookieValue !== undefined ? { value: cookieValue } : undefined
        ),
      },
    } as unknown as NextRequest;
  }

  test("returns null when no cookie is in the request", async () => {
    expect(await verifySession(makeRequest(undefined))).toBeNull();
  });

  test("returns the session payload for a valid token", async () => {
    const token = await makeValidToken("user-456", "other@example.com");

    const result = await verifySession(makeRequest(token));
    expect(result?.userId).toBe("user-456");
    expect(result?.email).toBe("other@example.com");
  });

  test("returns null for a malformed token", async () => {
    expect(await verifySession(makeRequest("bad.token"))).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const token = await makeValidToken("user-456", "other@example.com", "-1s");

    expect(await verifySession(makeRequest(token))).toBeNull();
  });
});
