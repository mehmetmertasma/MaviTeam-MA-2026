import type { ScheduleEvent } from "@/types/teamSync";
import type { CalendarCell } from "../types/schedule.types";

export function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return getMonthStart(new Date(date.getFullYear(), date.getMonth() + amount, 1));
}

export function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateFromValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDateKeyFromValue(value: string) {
  const date = getDateFromValue(value);
  return date === null ? "" : toDateKey(date);
}

export function isEventInMonth(event: ScheduleEvent, visibleMonth: Date) {
  const date = getDateFromValue(event.startsAt);
  return date !== null && date.getFullYear() === visibleMonth.getFullYear() && date.getMonth() === visibleMonth.getMonth();
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

export function formatEventDate(value: string) {
  const date = getDateFromValue(value);
  return date === null ? "Tarih yok" : date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatEventTime(value: string) {
  const date = getDateFromValue(value);
  return date === null ? "Saat yok" : date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function buildStartsAt(year: number, monthIndex: number, dayNumber: number, timeValue: string) {
  const [hourText, minuteText] = timeValue.trim().split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const startsAt = new Date(year, monthIndex, dayNumber, hour, minute, 0);
  if (startsAt.getFullYear() !== year || startsAt.getMonth() !== monthIndex || startsAt.getDate() !== dayNumber) {
    return null;
  }

  return startsAt.toISOString();
}

export function buildCalendarCells(visibleMonth: Date): CalendarCell[] {
  const year = visibleMonth.getFullYear();
  const monthIndex = visibleMonth.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const leadingEmptyDays = firstDay === 0 ? 6 : firstDay - 1;
  const todayKey = toDateKey(new Date());
  const cells: CalendarCell[] = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({ key: `empty-start-${index}`, dayNumber: null });
  }

  for (let dayNumber = 1; dayNumber <= getDaysInMonth(year, monthIndex); dayNumber += 1) {
    const dateKey = toDateKey(new Date(year, monthIndex, dayNumber));
    cells.push({ key: dateKey, dayNumber, dateKey, isToday: dateKey === todayKey });
  }

  const trailingEmptyDays = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let index = 0; index < trailingEmptyDays; index += 1) {
    cells.push({ key: `empty-end-${index}`, dayNumber: null });
  }

  return cells;
}
