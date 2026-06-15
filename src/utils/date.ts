import holidayJp from "@holiday-jp/holiday_jp";

export function getTodayDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCurrentMonth(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function addMonths(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");

  return `${nextYear}-${nextMonth}`;
}

export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-");
  return `${year}年${Number(monthNumber)}月`;
}

export function formatDate(date: string): string {
  if (!date) {
    return "";
  }

  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function getActualClosingDate(month: string, closingDay: number): string {
  const [year, monthNumber] = parseMonth(month);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const baseDay = Math.min(normalizeClosingDay(closingDay), lastDay);
  const date = new Date(year, monthNumber - 1, baseDay);

  while (isWeekend(date) || holidayJp.isHoliday(formatLocalDate(date))) {
    date.setDate(date.getDate() - 1);
  }

  return formatLocalDate(date);
}

export function getDisplayMonthForDate(
  date: string,
  closingDay: number,
): string {
  const currentMonth = parseDate(date).slice(0, 2).join("-");
  const nextMonth = addMonths(currentMonth, 1);

  if (date >= getActualClosingDate(nextMonth, closingDay)) {
    return nextMonth;
  }

  if (date >= getActualClosingDate(currentMonth, closingDay)) {
    return currentMonth;
  }

  return addMonths(currentMonth, -1);
}

function parseMonth(month: string): [number, number] {
  const match = /^(\d{4})-(\d{2})$/.exec(month);

  if (!match) {
    throw new Error(`Invalid month: ${month}`);
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);

  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(`Invalid month: ${month}`);
  }

  return [year, monthNumber];
}

function parseDate(date: string): [string, string, string] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error(`Invalid date: ${date}`);
  }

  const [, year, month, day] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

  if (formatLocalDate(parsedDate) !== date) {
    throw new Error(`Invalid date: ${date}`);
  }

  return [year, month, day];
}

function normalizeClosingDay(closingDay: number): number {
  if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31) {
    throw new Error(`Invalid closing day: ${closingDay}`);
  }

  return closingDay;
}

function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
