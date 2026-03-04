import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(__dirname, "../src/components/WaitlistForm.tsx"),
  "utf-8"
);

describe("WaitlistForm.tsx - Client Form Component", () => {
  it("has 'use client' directive", () => {
    expect(src).toContain('"use client"');
  });

  it("imports useActionState from 'react'", () => {
    expect(src).toMatch(/import.*useActionState.*from\s+['"]react['"]/);
  });

  it("imports joinWaitlist from '@/actions/waitlist'", () => {
    expect(src).toMatch(/import.*joinWaitlist.*from\s+['"]@\/actions\/waitlist['"]/);
  });

  it("contains form element with action={formAction}", () => {
    expect(src).toContain("action={formAction}");
  });

  it("contains input with type='email' and name='email'", () => {
    expect(src).toMatch(/type=["']email["']/);
    expect(src).toMatch(/name=["']email["']/);
  });

  it("contains hidden input with name='app' for slug identification", () => {
    expect(src).toMatch(/type=["']hidden["']/);
    expect(src).toMatch(/name=["']app["']/);
  });

  it("contains a submit button", () => {
    expect(src).toMatch(/type=["']submit["']/);
  });

  it("shows success message when state.status === 'success'", () => {
    expect(src).toMatch(/state\.status\s*===?\s*["']success["']/);
  });

  it("shows error message when state.status === 'error'", () => {
    expect(src).toMatch(/state\.status\s*===?\s*["']error["']/);
  });

  it("handles isPending state (disabled attribute)", () => {
    expect(src).toContain("isPending");
    expect(src).toMatch(/disabled/);
  });
});
