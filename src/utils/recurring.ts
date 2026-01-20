import { RecurringScheduleType } from "@prisma/client";

export function calculateNextRunAt(
  scheduleType: RecurringScheduleType,
  scheduleValue: string,
  fromDate: Date = new Date()
): Date {
  const nextDate = new Date(fromDate);

  switch (scheduleType) {
    case RecurringScheduleType.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case RecurringScheduleType.WEEKLY:
      // scheduleValue: "MON", "TUE", etc.
      const dayMap: Record<string, number> = {
        SUN: 0,
        MON: 1,
        TUE: 2,
        WED: 3,
        THU: 4,
        FRI: 5,
        SAT: 6,
      };
      const targetDay = dayMap[scheduleValue.toUpperCase()];
      if (targetDay === undefined) {
        throw new Error(`Invalid day value: ${scheduleValue}`);
      }

      const currentDay = nextDate.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Next week
      }
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      break;

    case RecurringScheduleType.MONTHLY:
      // scheduleValue: day of month (1-31), e.g. "25"
      const dayOfMonth = parseInt(scheduleValue, 10);
      if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error(`Invalid day of month: ${scheduleValue}`);
      }

      nextDate.setMonth(nextDate.getMonth() + 1);
      // Handle months with fewer days (e.g., Feb 31 -> Feb 28/29)
      const lastDayOfMonth = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth() + 1,
        0
      ).getDate();
      nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      break;

    case RecurringScheduleType.YEARLY:
      // scheduleValue: "MM-DD" or "DD", e.g. "01-15" or "15"
      let month: number;
      let day: number;

      if (scheduleValue.includes("-")) {
        const [m, d] = scheduleValue.split("-").map(Number);
        month = m - 1; // JavaScript months are 0-indexed
        day = d;
      } else {
        // Assume same month, just day
        month = nextDate.getMonth();
        day = parseInt(scheduleValue, 10);
      }

      if (isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) {
        throw new Error(`Invalid date value: ${scheduleValue}`);
      }

      nextDate.setFullYear(nextDate.getFullYear() + 1);
      nextDate.setMonth(month);
      const lastDay = new Date(nextDate.getFullYear(), month + 1, 0).getDate();
      nextDate.setDate(Math.min(day, lastDay));
      break;

    default:
      throw new Error(`Unsupported schedule type: ${scheduleType}`);
  }

  // Set time to midnight
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function validateScheduleValue(
  scheduleType: RecurringScheduleType,
  scheduleValue: string
): boolean {
  try {
    switch (scheduleType) {
      case RecurringScheduleType.DAILY:
        return true; // No validation needed

      case RecurringScheduleType.WEEKLY:
        const dayMap: Record<string, number> = {
          SUN: 0,
          MON: 1,
          TUE: 2,
          WED: 3,
          THU: 4,
          FRI: 5,
          SAT: 6,
        };
        return dayMap[scheduleValue.toUpperCase()] !== undefined;

      case RecurringScheduleType.MONTHLY:
        const day = parseInt(scheduleValue, 10);
        return !isNaN(day) && day >= 1 && day <= 31;

      case RecurringScheduleType.YEARLY:
        if (scheduleValue.includes("-")) {
          const [m, d] = scheduleValue.split("-").map(Number);
          return (
            !isNaN(m) &&
            !isNaN(d) &&
            m >= 1 &&
            m <= 12 &&
            d >= 1 &&
            d <= 31
          );
        } else {
          const day = parseInt(scheduleValue, 10);
          return !isNaN(day) && day >= 1 && day <= 31;
        }

      default:
        return false;
    }
  } catch {
    return false;
  }
}
