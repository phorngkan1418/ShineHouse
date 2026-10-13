import React, { useEffect, useMemo, useState } from "react";
import membersJson from "../member.json";
import "./CookingCalendar.css";

const YEAR = 2026;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const ANCHOR_DATE = "2026-10-13";
const ANCHOR_MEMBER_ID = 1;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const THEME_KEY = "cooking-calendar-theme";

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function formatName(member) {
  if (!member) return "";
  return String(member.displayName || member.shortName || member.name || "").trim();
}

function countWeekdaysBetween(anchorDate, targetDate) {
  const direction = targetDate >= anchorDate ? 1 : -1;
  let count = 0;
  const current = new Date(anchorDate);

  while (dateKey(current) !== dateKey(targetDate)) {
    current.setDate(current.getDate() + direction);
    if (!isWeekend(current)) count += direction;
  }
  return count;
}

function buildAnchoredCookingMap(year, members, anchorDateString, anchorMemberId) {
  const map = {};
  if (!Array.isArray(members) || members.length === 0) return map;

  const anchorDate = parseLocalDate(anchorDateString);
  const anchorIndex = members.findIndex((member) => member.id === anchorMemberId);
  if (anchorIndex === -1) return map;

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (
    let currentDate = new Date(startDate);
    currentDate <= endDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const date = new Date(currentDate);
    if (isWeekend(date)) continue;

    const weekdayOffset = countWeekdaysBetween(anchorDate, date);
    const memberIndex =
      ((anchorIndex + weekdayOffset) % members.length + members.length) % members.length;
    const member = members[memberIndex];

    map[dateKey(date)] = {
      id: member.id,
      name: formatName(member),
      originalName: member.name || "",
    };
  }

  return map;
}

function buildMonthCalendar(year, monthIndex, cookingMap) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const calendarStartDate = new Date(firstDayOfMonth);
  calendarStartDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStartDate);
    date.setDate(calendarStartDate.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      dayNumber: date.getDate(),
      dayIndex: date.getDay(),
      isCurrentMonth: date.getMonth() === monthIndex,
      isWeekend: isWeekend(date),
      cook: cookingMap[key] || null,
    };
  });
}

function Icon({ name, className = "" }) {
  const common = {
    className,
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  switch (name) {
    case "chevron-left": return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
    case "chevron-right": return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
    case "sun": return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>;
    case "moon": return <svg {...common}><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /></svg>;
    case "calendar": return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>;
    case "users": return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "coffee": return <svg {...common}><path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" /><path d="M17 10h1a3 3 0 1 1 0 6h-1M8 3v2m5-2v2" /></svg>;
    case "chef": return <svg {...common}><path d="M6 10a4 4 0 1 1 7-2 4 4 0 1 1 5 4v7H6v-7a4 4 0 0 1 0-2Z" /><path d="M6 15h12M9 19v2h6v-2" /></svg>;
    case "house": return <svg {...common}><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></svg>;
    default: return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
  }
}

export default function ShineHouseCookingCalendar() {
  const [now, setNow] = useState(() => new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem(THEME_KEY) === "dark";
    } catch {
      return false;
    }
  });
  const [monthIndex, setMonthIndex] = useState(() => {
    const current = new Date();
    return current.getFullYear() === YEAR ? current.getMonth() : 9;
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), SIX_HOURS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const todayKey = useMemo(() => dateKey(now), [now]);
  const todayMonthIndex = now.getMonth();
  const todayYear = now.getFullYear();
  const isViewingCurrentMonth = todayYear === YEAR && monthIndex === todayMonthIndex;
  const todayDayIndex = now.getDay();

  const members = Array.isArray(membersJson) ? membersJson : [];
  const cookingMap = useMemo(
    () => buildAnchoredCookingMap(YEAR, members, ANCHOR_DATE, ANCHOR_MEMBER_ID),
    [members],
  );
  const calendarCells = useMemo(
    () => buildMonthCalendar(YEAR, monthIndex, cookingMap),
    [monthIndex, cookingMap],
  );
  const todayCook = cookingMap[todayKey];

  const monthAssignments = useMemo(
    () => Object.entries(cookingMap).filter(([key]) => key.startsWith(`${YEAR}-${String(monthIndex + 1).padStart(2, "0")}-`)),
    [cookingMap, monthIndex],
  );
  const nextCookEntry = useMemo(
    () => Object.entries(cookingMap).filter(([key]) => key >= todayKey).sort(([a], [b]) => a.localeCompare(b))[0],
    [cookingMap, todayKey],
  );

  function previousMonth() {
    setMonthIndex((current) => (current === 0 ? 11 : current - 1));
  }
  function nextMonth() {
    setMonthIndex((current) => (current === 11 ? 0 : current + 1));
  }
  function goToToday() {
    if (todayYear === YEAR) setMonthIndex(todayMonthIndex);
  }

  const pageBg = isDarkMode ? "bg-[#0b1120] text-slate-100" : "bg-[#f4f7fb] text-slate-900";
  const panel = isDarkMode ? "border-slate-800 bg-[#111a2c]" : "border-slate-200/80 bg-white";
  const muted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const monthTitle = `${MONTH_NAMES[monthIndex]} ${YEAR}`;

  return (
    <main className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Top navigation */}
        <header className={`mb-5 flex flex-col gap-4 rounded-[28px] border p-4 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between ${panel}`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white shadow-lg shadow-blue-900/20 sm:h-14 sm:w-14">
              <Icon name="house" className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>Shine House · Shared living</p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">Cooking Schedule</h1>
              <p className={`mt-0.5 text-xs sm:text-sm ${muted}`}>A simple way to keep dinner organized.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className={`flex items-center rounded-2xl border p-1 ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
              <button type="button" onClick={previousMonth} aria-label="Previous month" className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-blue-500/10 ${muted}`}>
                <Icon name="chevron-left" />
              </button>
              <div className="min-w-[128px] px-2 text-center text-sm font-bold sm:min-w-[150px] sm:text-base">{monthTitle}</div>
              <button type="button" onClick={nextMonth} aria-label="Next month" className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-blue-500/10 ${muted}`}>
                <Icon name="chevron-right" />
              </button>
            </div>
            <button type="button" onClick={goToToday} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0">
              <Icon name="calendar" className="h-4 w-4" /> Today
            </button>
            <button type="button" onClick={() => setIsDarkMode((current) => !current)} aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"} className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition hover:-translate-y-0.5 ${isDarkMode ? "border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
              <Icon name={isDarkMode ? "sun" : "moon"} className="h-4 w-4" />
              <span className="hidden sm:inline">{isDarkMode ? "Light mode" : "Dark mode"}</span>
            </button>
          </div>
        </header>

        {/* Summary cards */}
        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className={`relative overflow-hidden rounded-[26px] border p-5 shadow-sm ${panel}`}>
            <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-blue-500/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${muted}`}>Cooking days this month</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">{monthAssignments.length}<span className={`ml-2 text-sm font-semibold ${muted}`}>days</span></p>
                <p className={`mt-1 text-xs ${muted}`}>Weekdays assigned for dinner</p>
              </div>
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500"><Icon name="calendar" className="h-6 w-6" /></div>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-[26px] border p-5 shadow-sm ${panel}`}>
            <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-emerald-500/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${muted}`}>Household members</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">{members.length}<span className={`ml-2 text-sm font-semibold ${muted}`}>people</span></p>
                <p className={`mt-1 text-xs ${muted}`}>Taking turns in the rotation</p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500"><Icon name="users" className="h-6 w-6" /></div>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-[26px] border p-5 shadow-sm sm:col-span-2 xl:col-span-1 ${panel}`}>
            <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-violet-500/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${muted}`}>Next cooking turn</p>
                <p className="mt-2 truncate text-2xl font-extrabold tracking-tight">{nextCookEntry?.[1]?.name || "Not assigned"}</p>
                <p className={`mt-1 text-xs ${muted}`}>{nextCookEntry ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(parseLocalDate(nextCookEntry[0])) : "No upcoming weekday"}</p>
              </div>
              <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-500"><Icon name="chef" className="h-6 w-6" /></div>
            </div>
          </div>
        </section>

        {/* Today's banner */}
        {isViewingCurrentMonth && todayCook && (
          <section className="mb-5 overflow-hidden rounded-[26px] bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-900/15 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Icon name="chef" className="h-6 w-6" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Today&apos;s cooking turn</p>
                  <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">{todayCook.name}</h2>
                  <p className="mt-1 text-sm text-blue-100">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now)}</p>
                </div>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Scheduled for dinner</div>
            </div>
          </section>
        )}

        {/* Calendar */}
        <section className={`overflow-hidden rounded-[28px] border shadow-sm ${panel}`}>
          <div className={`flex flex-col gap-3 border-b px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">{monthTitle} overview</h2>
              <p className={`mt-1 text-xs sm:text-sm ${muted}`}>Each weekday has one assigned cook. Weekends are free days.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Cooking day</span>
              <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? "bg-slate-600" : "bg-slate-300"}`} /> Weekend off</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Today</span>
            </div>
          </div>

          <div className="calendar-weekdays grid grid-cols-7">
            {DAY_HEADERS.map((day, index) => {
              const isTodayHeader = isViewingCurrentMonth && index === todayDayIndex;
              return (
                <div key={day} className={`border-b px-0.5 py-3 text-center text-[9px] font-extrabold tracking-wide sm:px-2 sm:py-4 sm:text-xs sm:tracking-[0.16em] ${isDarkMode ? "border-slate-800 bg-slate-900/70" : "border-slate-100 bg-slate-50/90"} ${isTodayHeader ? (isDarkMode ? "text-amber-300" : "text-blue-700") : muted}`}>
                  <span className="sm:hidden">{day.slice(0, 1)}</span><span className="hidden sm:inline">{day}</span>
                </div>
              );
            })}
          </div>

          <div className="calendar-days-grid grid grid-cols-7">
            {calendarCells.map((cell, index) => {
              const isToday = todayYear === YEAR && isViewingCurrentMonth && cell.key === todayKey;
              const isTodayColumn = isViewingCurrentMonth && cell.dayIndex === todayDayIndex;
              const isLastColumn = (index + 1) % 7 === 0;
              const isLastRow = index >= 35;
              const assigned = !cell.isWeekend && cell.cook && cell.isCurrentMonth;

              return (
                <div key={cell.key} className={`group relative min-h-[94px] border-b p-1.5 transition-colors sm:min-h-[132px] sm:p-2.5 lg:min-h-[150px] lg:p-3 ${isLastColumn ? "border-r-0" : "border-r"} ${isLastRow ? "border-b-0" : ""} ${isDarkMode ? "border-slate-800" : "border-slate-100"} ${!cell.isCurrentMonth ? (isDarkMode ? "bg-slate-950/60" : "bg-slate-50/70") : isDarkMode ? "bg-[#111a2c] hover:bg-slate-800/70" : "bg-white hover:bg-blue-50/50"} ${isTodayColumn && !isToday ? (isDarkMode ? "!bg-amber-950/10" : "!bg-blue-50/40") : ""} ${isToday ? (isDarkMode ? "!bg-amber-400/10" : "!bg-amber-50") : ""}`}>
                  <div className="flex items-start justify-between gap-1">
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-lg px-1 text-[10px] font-bold sm:h-8 sm:min-w-8 sm:text-sm ${!cell.isCurrentMonth ? (isDarkMode ? "text-slate-700" : "text-slate-300") : isToday ? "bg-amber-400 text-slate-950 shadow-sm" : cell.isWeekend ? (isDarkMode ? "text-slate-500" : "text-slate-400") : (isDarkMode ? "text-slate-200" : "text-slate-700")}`}>{cell.dayNumber}</span>
                    {isToday && <span className="rounded-md bg-amber-400 px-1 py-0.5 text-[7px] font-black uppercase tracking-wide text-slate-950 sm:rounded-full sm:px-2 sm:text-[9px]">Today</span>}
                  </div>

                  {assigned && (
                    <div className={`mt-3 rounded-xl border p-1.5 sm:mt-4 sm:p-2.5 ${isToday ? "border-amber-300 bg-amber-100/90" : isDarkMode ? "border-blue-400/15 bg-blue-500/10 group-hover:bg-blue-500/15" : "border-blue-100 bg-blue-50 group-hover:border-blue-200"}`}>
                      <div className="mb-1 hidden items-center gap-1 text-[8px] font-extrabold uppercase tracking-wider text-blue-500 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Dinner duty</div>
                      <p className={`break-words text-[10px] font-extrabold leading-tight sm:text-xs lg:text-sm ${isToday ? "text-amber-950" : isDarkMode ? "text-blue-100" : "text-slate-800"}`}>{cell.cook?.name || ""}</p>
                    </div>
                  )}

                  {cell.isWeekend && cell.isCurrentMonth && (
                    <div className="mt-3 flex flex-col items-center justify-center gap-1 py-1 sm:mt-5">
                      <Icon name="coffee" className={`h-4 w-4 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`} />
                      <span className={`text-[7px] font-bold uppercase tracking-wider sm:text-[9px] ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>Day off</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile agenda: easier to read than a 7-column calendar on a phone */}
          <div className={`mobile-agenda ${isDarkMode ? "is-dark" : "is-light"}`} aria-label={`${monthTitle} cooking schedule`}>
            {calendarCells.filter((cell) => cell.isCurrentMonth).map((cell) => {
              const isToday = todayYear === YEAR && isViewingCurrentMonth && cell.key === todayKey;
              const isAssigned = !cell.isWeekend && Boolean(cell.cook);
              const weekdayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][cell.dayIndex];
              return (
                <article
                  key={cell.key}
                  className={`mobile-agenda-item ${cell.isWeekend ? "is-weekend" : "is-cooking-day"} ${isToday ? "is-today" : ""}`}
                >
                  <div className="mobile-agenda-date" aria-label={`${weekdayName}, ${cell.dayNumber}`}>
                    <span className="mobile-agenda-weekday">{weekdayName.slice(0, 3)}</span>
                    <span className="mobile-agenda-day-number">{cell.dayNumber}</span>
                  </div>
                  <div className="mobile-agenda-content">
                    <div className="mobile-agenda-label-row">
                      <span className="mobile-agenda-label">{cell.isWeekend ? "Rest day" : "Dinner duty"}</span>
                      {isToday && <span className="mobile-today-pill">Today</span>}
                    </div>
                    <p className="mobile-agenda-name">
                      {cell.isWeekend ? "No cooking assigned" : isAssigned ? cell.cook.name : "Not assigned"}
                    </p>
                    <p className="mobile-agenda-subtitle">
                      {cell.isWeekend ? "Enjoy your weekend" : "Please prepare dinner for the house"}
                    </p>
                  </div>
                  <span className={`mobile-agenda-status ${cell.isWeekend ? "status-off" : "status-on"}`} aria-hidden="true">
                    {cell.isWeekend ? "–" : "•"}
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        {/* Rules and rotation */}
        <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={`rounded-[26px] border p-5 shadow-sm sm:p-6 ${panel}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500"><Icon name="chef" className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-extrabold sm:text-lg">House cooking rules</h3>
                <p className={`mt-1 text-sm ${muted}`}>A little planning makes shared living easier.</p>
              </div>
            </div>
            <div className={`mt-5 rounded-2xl border p-4 sm:p-5 ${isDarkMode ? "border-blue-400/15 bg-blue-500/10" : "border-blue-100 bg-blue-50/80"}`}>
              <p className={`text-sm font-bold leading-6 ${isDarkMode ? "text-blue-100" : "text-blue-950"}`}>Each member takes turns being responsible for preparing dinner on their assigned weekday.</p>
              <p className={`mt-2 text-sm leading-6 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Please check the schedule, prepare dinner on your turn, and cooperate with everyone in the house. Thank you!</p>
            </div>
            <div className={`mt-4 flex items-center gap-2 text-xs ${muted}`}><Icon name="coffee" className="h-4 w-4" /> Saturday and Sunday are not assigned cooking days.</div>
          </div>

          <div className={`rounded-[26px] border p-5 shadow-sm sm:p-6 ${panel}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500"><Icon name="users" className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-extrabold sm:text-lg">Member rotation</h3>
                <p className={`mt-1 text-sm ${muted}`}>The turn order repeats on each weekday.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {members.map((member, index) => (
                <div key={member.id} className={`inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 ${isDarkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-[10px] font-extrabold text-white">{index + 1}</span>
                  <span className="max-w-[180px] truncate text-xs font-bold sm:text-sm">{formatName(member) || `Member ${member.id}`}</span>
                </div>
              ))}
            </div>
            <p className={`mt-5 border-t pt-4 text-xs leading-5 ${isDarkMode ? "border-slate-800 text-slate-500" : "border-slate-100 text-slate-500"}`}>Schedule reference date: October 13, 2026. Member 1 is assigned on that date; the schedule rotates through weekdays and skips weekends.</p>
          </div>
        </section>

        <footer className={`px-2 py-6 text-center text-xs ${muted}`}>
          <p className="font-semibold">Shine House Cooking Schedule <span className="mx-1 opacity-50">·</span> {YEAR}</p>
          <p className="mt-1 opacity-80">Made for a happier, more organized home.</p>
        </footer>
      </div>
    </main>
  );
}
