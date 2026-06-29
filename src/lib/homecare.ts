import { addDays, addMonths, differenceInCalendarDays, format, isAfter, isBefore } from "date-fns";
import type { ACUnit, BillOccurrence, CareStatus, Plant } from "@/types/homecare";

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("en-QA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export const formatRelativeDay = (value: string | Date) => {
  const days = differenceInCalendarDays(new Date(value), new Date());
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;
};

export const formatQar = (amount: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", maximumFractionDigits: 0 }).format(amount);

export const plantWaterDue = (plant: Plant) => addDays(new Date(plant.lastWateredAt), plant.waterEveryDays);
export const plantTrimDue = (plant: Plant) => addDays(new Date(plant.lastTrimmedAt), plant.trimEveryDays);
export const acMaintenanceDue = (unit: ACUnit) => addMonths(new Date(unit.lastMaintainedAt), unit.maintenanceEveryMonths);

export const dateStatus = (date: Date): CareStatus => {
  const now = new Date();
  const soon = addDays(now, 3);
  if (isBefore(date, now)) return "overdue";
  if (isBefore(date, soon)) return "due";
  return "healthy";
};

export const billStatus = (bill: BillOccurrence): "paid" | CareStatus => {
  if (bill.paidAt) return "paid";
  return dateStatus(new Date(bill.dueAt));
};

export const daysUntil = (date: Date) => differenceInCalendarDays(date, new Date());

export const toDateInput = (value: string | Date) => format(new Date(value), "yyyy-MM-dd'T'HH:mm");

export const isFuture = (value: string | Date) => isAfter(new Date(value), new Date());
