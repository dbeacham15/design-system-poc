import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(__dirname, "../src/actions/waitlist.ts"),
  "utf-8"
);

describe("waitlist.ts - Server Action", () => {
  it("has 'use server' directive", () => {
    expect(src).toContain('"use server"');
  });

  it("imports Resend from 'resend'", () => {
    expect(src).toMatch(/import.*Resend.*from\s+['"]resend['"]/);
  });

  it("exports joinWaitlist function", () => {
    expect(src).toMatch(/export\s+async\s+function\s+joinWaitlist/);
  });

  it("function signature includes prevState as first arg and formData as second arg", () => {
    expect(src).toMatch(/joinWaitlist\s*\(\s*prevState/);
    expect(src).toContain("formData");
  });

  it("references process.env.RESEND_API_KEY", () => {
    expect(src).toContain("process.env.RESEND_API_KEY");
  });

  it("references WAITLIST_RECIPIENT_EMAIL or a default email", () => {
    expect(src).toMatch(/WAITLIST_RECIPIENT_EMAIL|daniel@jazlab\.llc/);
  });

  it("contains email validation (checks for @ symbol)", () => {
    expect(src).toMatch(/@|includes\(["']@["']\)|email.*@|@.*email/);
  });

  it("returns object with status field", () => {
    expect(src).toMatch(/status:\s*["'](idle|success|error)["']/);
  });

  it("calls resend.emails.send()", () => {
    expect(src).toMatch(/resend\.emails\.send\(/);
  });

  it("uses onboarding@resend.dev as from address", () => {
    expect(src).toContain("onboarding@resend.dev");
  });

  it("exports WaitlistState type", () => {
    expect(src).toMatch(/export\s+type\s+WaitlistState/);
  });
});
