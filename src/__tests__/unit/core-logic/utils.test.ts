import { describe, it, expect } from "vitest";

import { cn } from "@/lib/utils";

describe("lib/utils - cn", () => {
  it("menggabungkan class biasa", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("mengabaikan nilai falsy", () => {
    expect(cn("btn", false, undefined, null, "active")).toBe("btn active");
  });

  it("mendukung object syntax clsx", () => {
    expect(cn("base", { open: true, closed: false })).toBe("base open");
  });

  it("melakukan merge tailwind conflict (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("mendukung array class", () => {
    expect(cn(["w-full", "rounded"], "shadow")).toBe("w-full rounded shadow");
  });
});
