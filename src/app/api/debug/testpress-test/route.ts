import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

const TESTPRESS_BASE = "https://login.higeducampus.in";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const username = process.env.TESTPRESS_ADMIN_USERNAME;
  const password = process.env.TESTPRESS_ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse(
      "Missing TESTPRESS_ADMIN_USERNAME / TESTPRESS_ADMIN_PASSWORD env vars in Vercel.",
      { status: 500 }
    );
  }

  const output: string[] = [];

  // Step 1: get auth token
  let token: string | null = null;
  try {
    const tokenRes = await fetch(`${TESTPRESS_BASE}/api/v2.5/auth-token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const tokenText = await tokenRes.text();
    output.push("=== AUTH TOKEN RESPONSE ===");
    output.push(`Status: ${tokenRes.status}`);
    output.push(tokenText);
    output.push("");

    try {
      const parsed = JSON.parse(tokenText);
      token = parsed.token ?? null;
    } catch {
      // ignore, token stays null
    }
  } catch (err) {
    output.push("=== AUTH TOKEN FETCH FAILED ===");
    output.push(String(err));
    return new NextResponse(output.join("\n"), {
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (!token) {
    output.push("Could not find a 'token' field in the auth response above.");
    return new NextResponse(output.join("\n"), {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Step 2: sample exams
  try {
    const examsRes = await fetch(`${TESTPRESS_BASE}/api/v2.5/admin/exams/`, {
      headers: { Authorization: `JWT ${token}` },
    });
    const examsText = await examsRes.text();
    output.push("=== EXAMS API RESPONSE (first 3000 chars) ===");
    output.push(`Status: ${examsRes.status}`);
    output.push(examsText.slice(0, 3000));
    output.push("");
  } catch (err) {
    output.push("=== EXAMS API FETCH FAILED ===");
    output.push(String(err));
  }

  // Step 3: sample attempts
  try {
    const attemptsRes = await fetch(`${TESTPRESS_BASE}/api/v2.5/admin/attempts/`, {
      headers: { Authorization: `JWT ${token}` },
    });
    const attemptsText = await attemptsRes.text();
    output.push("=== ATTEMPTS API RESPONSE (first 3000 chars) ===");
    output.push(`Status: ${attemptsRes.status}`);
    output.push(attemptsText.slice(0, 3000));
  } catch (err) {
    output.push("=== ATTEMPTS API FETCH FAILED ===");
    output.push(String(err));
  }

  return new NextResponse(output.join("\n"), {
    headers: { "Content-Type": "text/plain" },
  });
}
