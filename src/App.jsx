import React, { useEffect, useMemo, useState } from "react";
import membersJson from "../member.json";

const YEAR = 2026;

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const ANCHOR_DATE = "2026-08-03";
const ANCHOR_MEMBER_ID = 1;
const SIX_HOURS = 6 * 60 * 60 * 1000;

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatName(member) {
  if (!member) return "";

  const name = member.displayName || member.shortName || member.name || "";

  return String(name).trim();
}

function formatTodayLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function countWeekdaysBetween(anchorDate, targetDate) {
  const direction = targetDate >= anchorDate ? 1 : -1;
  let count = 0;

  const current = new Date(anchorDate);

  while (dateKey(current) !== dateKey(targetDate)) {
    current.setDate(current.getDate() + direction);

    if (!isWeekend(current)) {
      count += direction;
    }
  }

  return count;
}

function buildAnchoredCookingMap(year, members, anchorDateString, anchorMemberId) {
  const map = {};

  if (!Array.isArray(members) || members.length === 0) {
    return map;
  }

  const anchorDate = parseLocalDate(anchorDateString);
  const anchorIndex = members.findIndex((member) => member.id === anchorMemberId);

  if (anchorIndex === -1) {
    return map;
  }

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (
    let currentDate = new Date(startDate);
    currentDate <= endDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const date = new Date(currentDate);

    if (isWeekend(date)) {
      continue;
    }

    const weekdayOffset = countWeekdaysBetween(anchorDate, date);

    const memberIndex =
      ((anchorIndex + weekdayOffset) % members.length + members.length) %
      members.length;

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

  calendarStartDate.setDate(
    firstDayOfMonth.getDate() - firstDayOfMonth.getDay()
  );

  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStartDate);
    date.setDate(calendarStartDate.getDate() + index);

    const key = dateKey(date);

    cells.push({
      key,
      dayNumber: date.getDate(),
      dayIndex: date.getDay(),
      isCurrentMonth: date.getMonth() === monthIndex,
      isWeekend: isWeekend(date),
      cook: cookingMap[key] || null,
    });
  }

  return cells;
}

export default function May2026CookingCalendar() {
  const [now, setNow] = useState(() => new Date());

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("cooking-calendar-theme") === "dark";
  });

  const [monthIndex, setMonthIndex] = useState(() => {
    const today = new Date();

    if (today.getFullYear() === YEAR) {
      return today.getMonth();
    }

    return 4;
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, SIX_HOURS);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "cooking-calendar-theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);

  const todayKey = useMemo(() => dateKey(now), [now]);
  const todayDayIndex = now.getDay();
  const todayMonthIndex = now.getMonth();
  const todayYear = now.getFullYear();

  const cookingMap = useMemo(() => {
    return buildAnchoredCookingMap(
      YEAR,
      membersJson,
      ANCHOR_DATE,
      ANCHOR_MEMBER_ID
    );
  }, []);

  const calendarCells = useMemo(() => {
    return buildMonthCalendar(YEAR, monthIndex, cookingMap);
  }, [monthIndex, cookingMap]);

  const todayCook = cookingMap[todayKey];

  const isViewingCurrentMonth =
    todayYear === YEAR && monthIndex === todayMonthIndex;

  function previousMonth() {
    setMonthIndex((currentMonth) =>
      currentMonth === 0 ? 11 : currentMonth - 1
    );
  }

  function nextMonth() {
    setMonthIndex((currentMonth) =>
      currentMonth === 11 ? 0 : currentMonth + 1
    );
  }

  function goToToday() {
    if (todayYear === YEAR) {
      setMonthIndex(todayMonthIndex);
    }
  }

  function toggleDarkMode() {
    setIsDarkMode((current) => !current);
  }

 return (
  <main
    className={`min-h-screen p-2 transition-colors duration-300 sm:p-4 md:p-8 ${
      isDarkMode
        ? "bg-slate-950 text-slate-100"
        : "bg-slate-100 text-slate-950"
    }`}
  >
    <section className="mx-auto max-w-7xl">
      {/* HEADER SECTION */}
      <header
        className={`mb-3 rounded-2xl p-3 shadow-sm transition-colors duration-300 sm:mb-6 sm:rounded-3xl sm:p-6 ${
          isDarkMode ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Top Control Bar on Mobile (Month Nav + Title) */}
          <div className="flex items-center justify-between gap-2 sm:contents">
            <button
              type="button"
              onClick={previousMonth}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xl leading-none transition active:scale-95 sm:h-12 sm:w-12 sm:text-3xl ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              aria-label="Previous month"
            >
              ‹
            </button>

            <div className="text-center sm:hidden">
              <h1
                className={`text-xl font-bold tracking-wide ${
                  isDarkMode ? "text-white" : "text-slate-950"
                }`}
              >
                {MONTH_NAMES[monthIndex]} {YEAR}
              </h1>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xl leading-none transition active:scale-95 sm:h-12 sm:w-12 sm:text-3xl ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Center Details */}
          <div className="text-center">
            <p
              className={`mb-1 text-[9px] font-bold uppercase tracking-wider sm:text-sm sm:tracking-[0.25em] ${
                isDarkMode ? "text-blue-300" : "text-blue-700"
              }`}
            >
              Shine House Cooking Turn Schedule
            </p>

            <h1
              className={`hidden text-3xl font-semibold tracking-wide sm:block sm:text-5xl md:text-6xl ${
                isDarkMode ? "text-white" : "text-slate-950"
              }`}
            >
              {MONTH_NAMES[monthIndex]} {YEAR}
            </h1>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:mt-3 sm:gap-2">
              <button
                type="button"
                onClick={goToToday}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition active:scale-95 sm:px-4 sm:py-1.5 sm:text-sm ${
                  isDarkMode
                    ? "bg-white text-slate-950 hover:bg-slate-200"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                Go to Today
              </button>

              <button
                type="button"
                onClick={toggleDarkMode}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition active:scale-95 sm:px-4 sm:py-1.5 sm:text-sm ${
                  isDarkMode
                    ? "bg-yellow-300 text-slate-950 hover:bg-yellow-200"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
              </button>
            </div>

            {todayCook && isViewingCurrentMonth && (
              <p className="mx-auto mt-2 inline-flex rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-red-300 sm:mt-3 sm:px-4 sm:py-1.5 sm:text-sm">
                Today: {formatTodayLabel(now)} — {todayCook.name}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* CALENDAR GRID CONTAINER */}
      <div
        className={`w-full overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 sm:rounded-3xl ${
          isDarkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-300 bg-white"
        }`}
      >
        <div className="w-full">
          {/* DAY HEADERS */}
          <div
            className={`grid grid-cols-7 border-b transition-colors duration-300 ${
              isDarkMode
                ? "border-slate-700 bg-slate-800"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            {DAY_HEADERS.map((day, index) => {
              const isTodayHeader =
                isViewingCurrentMonth && index === todayDayIndex;

              return (
                <div
                  key={day}
                  className={`border-r py-1.5 text-center text-[11px] font-black tracking-tighter sm:py-3 sm:text-lg sm:tracking-wide last:border-r-0 ${
                    isDarkMode ? "border-slate-700" : "border-slate-300"
                  } ${
                    isTodayHeader
                      ? "bg-yellow-300 text-slate-950"
                      : isDarkMode
                      ? "text-slate-200"
                      : "text-slate-700"
                  }`}
                >
                  {/* Shows short 3-letter day on mobile */}
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                  <span className="hidden sm:inline">{day}</span>
                </div>
              );
            })}
          </div>

          {/* CALENDAR CELLS */}
          <div className="grid grid-cols-7">
            {calendarCells.map((cell, index) => {
              const isToday =
                todayYear === YEAR &&
                isViewingCurrentMonth &&
                cell.key === todayKey;

              const isTodayColumn =
                isViewingCurrentMonth && cell.dayIndex === todayDayIndex;

              const isLastColumn = (index + 1) % 7 === 0;
              const isLastRow = index >= 35;

              return (
                <div
                  key={cell.key}
                  className={`relative min-h-[68px] border-b p-1 transition-colors duration-300 sm:min-h-32 sm:p-3 ${
                    isDarkMode ? "border-slate-700" : "border-slate-300"
                  } ${isLastColumn ? "" : "border-r"} ${
                    isLastRow ? "border-b-0" : ""
                  } ${
                    !cell.isCurrentMonth
                      ? isDarkMode
                        ? "bg-slate-950 text-slate-600"
                        : "bg-slate-50 text-slate-300"
                      : isDarkMode
                      ? "bg-slate-900 text-slate-100"
                      : "bg-white text-slate-950"
                  } ${
                    isTodayColumn
                      ? isDarkMode
                        ? "bg-yellow-950/50"
                        : "bg-yellow-50"
                      : ""
                  } ${
                    isToday
                      ? "bg-yellow-300 text-slate-950 ring-2 ring-inset ring-yellow-500 sm:ring-4"
                      : ""
                  }`}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-[11px] font-bold sm:text-base ${
                          cell.isWeekend && !isToday
                            ? isDarkMode
                              ? "text-slate-500"
                              : "text-slate-400"
                            : ""
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {isToday && (
                        <span className="rounded bg-slate-950 px-1 py-0.2 text-[8px] font-black uppercase text-white sm:rounded-full sm:px-2 sm:py-0.5 sm:text-[10px]">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="my-auto flex items-center justify-center text-center">
                      {!cell.isWeekend &&
                        cell.cook &&
                        cell.isCurrentMonth && (
                          <p
                            className={`break-all text-[10px] font-black leading-tight sm:break-normal sm:text-2xl ${
                              isToday
                                ? "text-slate-950"
                                : isDarkMode
                                ? "text-white"
                                : "text-slate-950"
                            }`}
                          >
                            {cell.cook.name}
                          </p>
                        )}

                      {cell.isWeekend && cell.isCurrentMonth && (
                        <p
                          className={`text-[8px] font-medium uppercase sm:text-xs sm:font-semibold ${
                            isDarkMode ? "text-slate-600" : "text-slate-300"
                          }`}
                        >
                          Off
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER SECTION */}
      <footer
        className={`mt-4 rounded-2xl border p-3 text-xs shadow-sm transition-colors duration-300 sm:mt-6 sm:rounded-3xl sm:p-5 sm:text-sm ${
          isDarkMode
            ? "border-slate-700 bg-slate-900 text-slate-300"
            : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        <p className={`font-bold ${isDarkMode ? "text-white" : "text-slate-950"}`}>
          Start rule:
        </p>

        <div className="mt-2 rounded-xl bg-red-500 p-3 text-xs font-semibold leading-snug text-white sm:p-4 sm:text-xl sm:leading-7">
          <p>
            To make things organized, each member will take turns being
            responsible for cooking dinner.
          </p>
          <p className="mt-2">
            Please follow the assigned schedule and make sure dinner is
            prepared on your turn. Thank you everyone for cooperating!
          </p>
        </div>

        <p
          className={`mt-3 font-bold sm:mt-4 ${
            isDarkMode ? "text-white" : "text-slate-950"
          }`}
        >
          Rotation:
        </p>

        <p className="mt-1 break-words text-xs leading-relaxed sm:text-sm sm:leading-7">
          {membersJson.map((member) => formatName(member)).join(" → ")}
        </p>

        <p className={`mt-2 text-[10px] sm:mt-4 sm:text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
          Weekends are not assigned cooking turns.
        </p>
      </footer>
    </section>
  </main>
);
}