import { describe, expect, it, vi } from "vitest";
import { acMaintenanceDue, billStatus, dateStatus, formatQar, plantTrimDue, plantWaterDue, qatarDateWithCurrentTime } from "@/lib/homecare";
import type { ACUnit, BillOccurrence, Plant } from "@/types/homecare";

const plant: Plant = { id: "1", name: "Fern", species: "Fern", roomId: "r", assignedProfileId: "p", waterEveryDays: 7, trimEveryDays: 30, lastWateredAt: "2026-06-01T08:00:00.000Z", lastTrimmedAt: "2026-06-01T08:00:00.000Z" };
const ac: ACUnit = { id: "1", name: "AC", roomId: "r", assignedProfileId: "p", maintenanceEveryMonths: 3, lastMaintainedAt: "2026-01-31T09:00:00.000Z" };

describe("homecare scheduling", () => {
  it("calculates independent watering and trimming due dates", () => {
    expect(plantWaterDue(plant).toISOString().slice(0, 10)).toBe("2026-06-08");
    expect(plantTrimDue(plant).toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("rolls month-based AC maintenance dates safely", () => {
    expect(acMaintenanceDue(ac).toISOString().slice(0, 10)).toBe("2026-04-30");
  });

  it("reports overdue, due-soon, and healthy states", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T08:00:00Z"));
    expect(dateStatus(new Date("2026-06-28T08:00:00Z"))).toBe("overdue");
    expect(dateStatus(new Date("2026-06-30T08:00:00Z"))).toBe("due");
    expect(dateStatus(new Date("2026-07-10T08:00:00Z"))).toBe("healthy");
    vi.useRealTimers();
  });

  it("treats a paid bill as paid regardless of due date", () => {
    const bill: BillOccurrence = { id: "b", name: "Rent", amount: 6200, dueAt: "2026-01-01", paidAt: "2025-12-30", paidByProfileId: "p" };
    expect(billStatus(bill)).toBe("paid");
  });

  it("formats QAR amounts", () => {
    expect(formatQar(6200)).toContain("6,200");
  });

  it("combines a retroactive date with the current Qatar time", () => {
    expect(qatarDateWithCurrentTime("2026-06-30", new Date("2026-07-01T09:34:56Z"))).toBe("2026-06-30T09:34:56.000Z");
  });

  it("rejects future transaction dates", () => {
    expect(() => qatarDateWithCurrentTime("2026-07-02", new Date("2026-07-01T09:34:56Z"))).toThrow("Future dates");
  });
});
