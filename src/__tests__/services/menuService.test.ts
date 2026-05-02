import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock apiClient trước khi import service
vi.mock("@/src/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "@/src/lib/api/client";
import { fetchMenuItems } from "@/src/services/menuService";
import type { MenuItem } from "@/src/lib/types/menu";

const mockDailyItem: MenuItem = {
  id: "item-1",
  name: "Matcha Latte",
  description: null,
  category: "daily",
  price_vnd: null,
  image_url: null,
  sort_order: 0,
  sizes: [
    { size: "M", price_vnd: 45000 },
    { size: "L", price_vnd: 55000 },
    { size: "XL", price_vnd: 65000 },
  ],
  addon_groups: [],
};

const mockSeasonalItem: MenuItem = {
  id: "item-2",
  name: "Hồng Trà Đặc Biệt",
  description: "Theo mùa",
  category: "seasonal",
  price_vnd: 60000,
  image_url: null,
  sort_order: 1,
  sizes: [],
  addon_groups: [],
};

describe("fetchMenuItems", () => {
  beforeEach(() => vi.clearAllMocks());

  it("flattens category-grouped response thành MenuItem[]", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: {
          daily: [mockDailyItem],
          seasonal: [mockSeasonalItem],
        },
      },
    });

    const result = await fetchMenuItems();

    expect(result).toHaveLength(2);
    expect(result[0].category).toBe("daily");
    expect(result[1].category).toBe("seasonal");
  });

  it("daily item phải có sizes array với 3 entries", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { data: { daily: [mockDailyItem] } },
    });

    const result = await fetchMenuItems();
    const daily = result.find((i) => i.category === "daily");

    expect(daily).toBeDefined();
    expect(daily!.price_vnd).toBeNull();
    expect(daily!.sizes).toHaveLength(3);
    expect(daily!.sizes.map((s) => s.size)).toEqual(["M", "L", "XL"]);
  });

  it("seasonal item phải có price_vnd non-null và sizes rỗng", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { data: { seasonal: [mockSeasonalItem] } },
    });

    const result = await fetchMenuItems();
    const seasonal = result[0];

    expect(seasonal.price_vnd).toBe(60000);
    expect(seasonal.sizes).toHaveLength(0);
  });

  it("throw error nếu API fail", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchMenuItems()).rejects.toThrow();
  });

  it("gọi đúng endpoint GET /api/menu", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { data: {} },
    });

    await fetchMenuItems();

    expect(apiClient.get).toHaveBeenCalledWith("/api/menu");
  });
});
