import { describe, it, expect } from "vitest";

// ── Step transition logic mirroring StaffOrderForm ───────────────────────────

type Step = "phone" | "confirm-found" | "nickname" | "confirm-new";

function validatePhone(phone: string): boolean {
  return /^(0|\+84)\d{9}$/.test(phone.trim());
}

function afterLookup(found: boolean): Step {
  return found ? "confirm-found" : "nickname";
}

function afterNickname(nickname: string): Step | null {
  return nickname.trim().length > 0 ? "confirm-new" : null;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("phone validation", () => {
  it("số bắt đầu 0 hợp lệ", () => {
    expect(validatePhone("0912345678")).toBe(true);
  });

  it("số bắt đầu +84 hợp lệ", () => {
    expect(validatePhone("+84912345678")).toBe(true);
  });

  it("số thiếu chữ số → không hợp lệ", () => {
    expect(validatePhone("091234")).toBe(false);
  });

  it("chuỗi rỗng → không hợp lệ", () => {
    expect(validatePhone("")).toBe(false);
  });

  it("có ký tự chữ → không hợp lệ", () => {
    expect(validatePhone("091234abcd")).toBe(false);
  });
});

describe("step transitions", () => {
  it("found = true → confirm-found", () => {
    expect(afterLookup(true)).toBe("confirm-found");
  });

  it("found = false → nickname", () => {
    expect(afterLookup(false)).toBe("nickname");
  });

  it("nickname có nội dung → confirm-new", () => {
    expect(afterNickname("Linh Cá Heo")).toBe("confirm-new");
  });

  it("nickname rỗng → không đi tiếp", () => {
    expect(afterNickname("")).toBeNull();
    expect(afterNickname("   ")).toBeNull();
  });
});
