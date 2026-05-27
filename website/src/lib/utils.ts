import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR;
const WEEK = 7 * DAY, MONTH = 30 * DAY, YEAR = 365 * DAY;

export function formatRelativeTime(dateStr: string): string {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    if (elapsed < MIN) return RTF.format(-Math.round(elapsed / SEC), "seconds");
    if (elapsed < HOUR) return RTF.format(-Math.round(elapsed / MIN), "minutes");
    if (elapsed < DAY) return RTF.format(-Math.round(elapsed / HOUR), "hours");
    if (elapsed < WEEK) return RTF.format(-Math.round(elapsed / DAY), "days");
    if (elapsed < MONTH) return RTF.format(-Math.round(elapsed / WEEK), "weeks");
    if (elapsed < YEAR) return RTF.format(-Math.round(elapsed / MONTH), "months");
    return RTF.format(-Math.round(elapsed / YEAR), "years");
}
