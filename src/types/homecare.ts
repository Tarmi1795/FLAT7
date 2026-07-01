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
  photoPath?: string;
};

export type ACUnit = {
  id: string;
  name: string;
  roomId: string;
  assignedProfileId: string;
  maintenanceEveryMonths: number;
  lastMaintainedAt: string;
};

export type ExpenseKind = "Internet" | "Rent" | "Water & Electricity";

export type BillTemplate = {
  id: string;
  name: ExpenseKind;
  defaultAmount: number;
  dueDay: number;
  startMonth: string;
  responsibleProfileId?: string;
  isActive: boolean;
};

export type BillOccurrence = {
  id: string;
  billId?: string;
  name: ExpenseKind;
  amount: number;
  dueAt: string;
  paidAt?: string;
  paidByProfileId?: string;
  responsibleProfileId?: string;
};

export type CollectionTemplate = {
  id: string;
  profileId: string;
  amount: number;
  dueDay: number;
  startMonth: string;
  isActive: boolean;
};

export type CollectionOccurrence = {
  id: string;
  templateId: string;
  profileId: string;
  billingMonth: string;
  dueAt: string;
  expectedAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  status: "unpaid" | "partial" | "paid";
  settledAt?: string;
};

export type FinanceMonthSummary = {
  month: string;
  expectedCollections: number;
  actualCollections: number;
  expectedExpenses: number;
  actualExpenses: number;
};

export type PlantInput = Pick<Plant, "name" | "species" | "roomId" | "waterEveryDays" | "trimEveryDays"> & { photo?: File };
export type ACInput = Pick<ACUnit, "name" | "roomId" | "maintenanceEveryMonths">;
export type BillInput = Pick<BillOccurrence, "name" | "amount" | "dueAt" | "responsibleProfileId">;
export type CollectionTemplateInput = Pick<CollectionTemplate, "profileId" | "amount" | "dueDay" | "startMonth" | "isActive">;
export type RoomInput = Pick<Room, "name" | "primaryProfileId">;
export type ProfileInput = Pick<Profile, "name" | "color">;

export type ActivityType = "water" | "trim" | "maintenance" | "payment" | "collection";

export type ActivityItem = {
  id: string;
  entityId?: string;
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
  amount?: number;
};

export type HouseholdData = {
  profiles: Profile[];
  rooms: Room[];
  plants: Plant[];
  acUnits: ACUnit[];
  billTemplates: BillTemplate[];
  bills: BillOccurrence[];
  collectionTemplates: CollectionTemplate[];
  collections: CollectionOccurrence[];
  financeSummaries: FinanceMonthSummary[];
  activity: ActivityItem[];
};
