import type { HouseholdData } from "@/types/homecare";

const today = new Date();
today.setUTCHours(12, 0, 0, 0);
const daysAgo = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
const daysAhead = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const demoData: HouseholdData = {
  profiles: [
    { id: "p1", name: "Tariq", initials: "TA", color: "#34D399" },
    { id: "p2", name: "Nora", initials: "NO", color: "#FBBF24" },
    { id: "p3", name: "Omar", initials: "OM", color: "#60A5FA" },
  ],
  rooms: [
    { id: "r1", name: "Living room", primaryProfileId: "p1" },
    { id: "r2", name: "Main bedroom", primaryProfileId: "p2" },
    { id: "r3", name: "Office", primaryProfileId: "p3" },
  ],
  plants: [
    {
      id: "plant-1",
      name: "Monstera",
      species: "Monstera deliciosa",
      roomId: "r1",
      assignedProfileId: "p1",
      waterEveryDays: 7,
      trimEveryDays: 60,
      lastWateredAt: daysAgo(8),
      lastTrimmedAt: daysAgo(42),
    },
    {
      id: "plant-2",
      name: "Snake plant",
      species: "Dracaena trifasciata",
      roomId: "r2",
      assignedProfileId: "p2",
      waterEveryDays: 14,
      trimEveryDays: 90,
      lastWateredAt: daysAgo(5),
      lastTrimmedAt: daysAgo(34),
    },
    {
      id: "plant-3",
      name: "Pothos",
      species: "Epipremnum aureum",
      roomId: "r3",
      assignedProfileId: "p3",
      waterEveryDays: 8,
      trimEveryDays: 45,
      lastWateredAt: daysAgo(7),
      lastTrimmedAt: daysAgo(49),
    },
  ],
  acUnits: [
    {
      id: "ac-1",
      name: "Living room AC",
      roomId: "r1",
      assignedProfileId: "p1",
      maintenanceEveryMonths: 3,
      lastMaintainedAt: daysAgo(86),
    },
    {
      id: "ac-2",
      name: "Bedroom AC",
      roomId: "r2",
      assignedProfileId: "p2",
      maintenanceEveryMonths: 3,
      lastMaintainedAt: daysAgo(38),
    },
  ],
  billTemplates: [
    { id: "template-internet", name: "Internet", defaultAmount: 365, dueDay: 3, startMonth: today.toISOString().slice(0, 7) + "-01", responsibleProfileId: "p1", isActive: true },
    { id: "template-rent", name: "Rent", defaultAmount: 6200, dueDay: 8, startMonth: today.toISOString().slice(0, 7) + "-01", responsibleProfileId: "p1", isActive: true },
  ],
  bills: [
    {
      id: "bill-1",
      name: "Internet",
      amount: 365,
      dueAt: daysAhead(2),
      responsibleProfileId: "p1",
    },
    {
      id: "bill-2",
      name: "Rent",
      amount: 6200,
      dueAt: daysAhead(7),
      responsibleProfileId: "p2",
    },
  ],
  collectionTemplates: [
    { id: "ct-p1", profileId: "p1", amount: 0, dueDay: 1, startMonth: today.toISOString().slice(0, 7) + "-01", isActive: false },
    { id: "ct-p2", profileId: "p2", amount: 2200, dueDay: 1, startMonth: today.toISOString().slice(0, 7) + "-01", isActive: true },
    { id: "ct-p3", profileId: "p3", amount: 2200, dueDay: 1, startMonth: today.toISOString().slice(0, 7) + "-01", isActive: true },
  ],
  collections: [
    { id: "collection-p2", templateId: "ct-p2", profileId: "p2", billingMonth: today.toISOString().slice(0, 7) + "-01", dueAt: today.toISOString().slice(0, 7) + "-01", expectedAmount: 2200, receivedAmount: 1000, remainingAmount: 1200, status: "partial" },
    { id: "collection-p3", templateId: "ct-p3", profileId: "p3", billingMonth: today.toISOString().slice(0, 7) + "-01", dueAt: today.toISOString().slice(0, 7) + "-01", expectedAmount: 2200, receivedAmount: 0, remainingAmount: 2200, status: "unpaid" },
  ],
  financeSummaries: [
    { month: today.toISOString().slice(0, 7) + "-01", expectedCollections: 4400, actualCollections: 1000, expectedExpenses: 6565, actualExpenses: 0 },
  ],
  activity: [
    {
      id: "a1",
      entityId: "plant-2",
      type: "water",
      title: "Snake plant watered",
      detail: "Main bedroom",
      occurredAt: daysAgo(5),
      profileId: "p2",
    },
    {
      id: "a2",
      entityId: "ac-2",
      type: "maintenance",
      title: "Bedroom AC maintained",
      detail: "Routine service",
      occurredAt: daysAgo(38),
      profileId: "p2",
    },
    {
      id: "a3",
      entityId: "plant-1",
      type: "trim",
      title: "Monstera trimmed",
      detail: "Living room",
      occurredAt: daysAgo(42),
      profileId: "p1",
    },
  ],
};
