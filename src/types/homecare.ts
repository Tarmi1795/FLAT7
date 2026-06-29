export type Profile = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type Room = {
  id: string;
  name: string;
  primaryProfileId: string;
};

export type CareStatus = "healthy" | "due" | "overdue";

export type Plant = {
  id: string;
  name: string;
  species: string;
  roomId: string;
  assignedProfileId: string;
  waterEveryDays: number;
  trimEveryDays: number;
  lastWateredAt: string;
  lastTrimmedAt: string;
  image?: string;
};

export type ACUnit = {
  id: string;
  name: string;
  roomId: string;
  assignedProfileId: string;
  maintenanceEveryMonths: number;
  lastMaintainedAt: string;
};

export type BillOccurrence = {
  id: string;
  name: "Internet" | "Rent";
  amount: number;
  dueAt: string;
  paidAt?: string;
  paidByProfileId?: string;
  responsibleProfileId?: string;
};

export type ActivityType = "water" | "trim" | "maintenance" | "payment";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  occurredAt: string;
  profileId: string;
  pending?: boolean;
};

export type QuickEntry = {
  clientMutationId: string;
  type: ActivityType;
  entityId: string;
  profileId: string;
  occurredAt: string;
  note?: string;
};

export type HouseholdData = {
  profiles: Profile[];
  rooms: Room[];
  plants: Plant[];
  acUnits: ACUnit[];
  bills: BillOccurrence[];
  activity: ActivityItem[];
};
