import { useState, useMemo } from "react";
import "./Calendar.css";
import { LABEL_COLORS, PRIORITY_CONFIG, type Priority } from "../types";

/* ──────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────── */

export type CalendarEventType = "task" | "deadline" | "meeting" | "release";

export interface CalendarEvent {
  id: string;
  title: string;
  projectName: string;
  date: string; // ISO date string "YYYY-MM-DD"
  type: CalendarEventType;
  description?: string;
}

export interface CalendarTag {
  id: string;
  name: string;
  color: string;
}

export interface CalendarDeadline {
  id: string;
  title: string;
  priority: string;
  projectName: string;
  date: string; // ISO date string "YYYY-MM-DD"
  tags: CalendarTag[];
  description?: string;
}

export interface CalendarStats {
  completed: number;
  overdue: number;
}

export interface CalendarProps {
  events?: CalendarEvent[];
  deadlines?: CalendarDeadline[];
  stats?: CalendarStats;
  subtitle?: string;
}

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildCalendarGrid(
  year: number,
  month: number,
): { date: Date; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Next month head — fill to complete 6 rows (42 cells)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  return cells;
}

/* ──────────────────────────────────────────────────────────
   Event Badge
   ────────────────────────────────────────────────────────── */

function EventBadge({ event }: { event: CalendarEvent }) {
  const now = new Date();
  const todayISO = toISODate(now.getFullYear(), now.getMonth(), now.getDate());
  const isPast = todayISO > event.date;
  return (
    <span
      className={`cal-event-badge cal-event-${isPast ? "deadline-past" : "deadline"}`}
      title={event.title}
    >
      {event.title}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
   Deadline Card
   ────────────────────────────────────────────────────────── */

function DeadlineCard({ item }: { item: CalendarDeadline }) {
  const dateObj = new Date(item.date);
  const formatted = `${MONTH_NAMES[dateObj.getMonth()]} ${dateObj.getDate()}`;
  const priorityKey = (item.priority || "").toLowerCase() as Priority;
  const priority = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG["low"];

  function getLabelColor(label: string): string {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
  }

  return (
    <div className="cal-deadline-card">
      <div className="cal-deadline-card-top">
        <span
          className="cal-deadline-priority"
          style={{ color: priority.color, background: priority.bg }}
        >
          {item.priority.toUpperCase()}
        </span>
        <span className="cal-deadline-date">{formatted}</span>
      </div>
      <div className="cal-deadline-project">
        {item.projectName.toUpperCase()}
      </div>
      <h4 className="cal-deadline-title">{item.title}</h4>
      {item.description && (
        <p className="cal-deadline-desc">{item.description}</p>
      )}
      <div className="cal-stat-labels">
        {item.tags &&
          item.tags.map((tag) => (
            <span
              className="cal-stat-label"
              key={tag.id}
              style={{ background: getLabelColor(tag.color) }}
            >
              {tag.name}
            </span>
          ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main Calendar Component
   ────────────────────────────────────────────────────────── */

export default function Calendar({
  events = [],
  deadlines = [],
  stats = { completed: 0, overdue: 0 },
  subtitle,
}: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const todayISO = toISODate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  // Build an event lookup map: "YYYY-MM-DD" -> CalendarEvent[]
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  const goToPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const goToNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const upcomingDeadlines = deadlines
    .filter((d) => d.date >= todayISO)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="cal-wrapper">
      {/* ── Left: Calendar Grid ── */}
      <div className="cal-left">
        {/* Header */}
        <div className="cal-header">
          <div className="cal-header-left">
            <h2 className="cal-month-title">
              {MONTH_NAMES[month]} {year}
            </h2>
            {subtitle && <p className="cal-subtitle">{subtitle}</p>}
          </div>
          <div className="cal-nav">
            <button
              className="cal-nav-btn"
              onClick={goToPrev}
              aria-label="Previous month"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                width="16"
                height="16"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button className="cal-today-btn" onClick={goToToday}>
              Today
            </button>
            <button
              className="cal-nav-btn"
              onClick={goToNext}
              aria-label="Next month"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                width="16"
                height="16"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day name headers */}
        <div className="cal-day-headers">
          {DAY_NAMES.map((d) => (
            <div key={d} className="cal-day-header">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="cal-grid">
          {cells.map(({ date, isCurrentMonth }, i) => {
            const isoKey = toISODate(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            );
            const dayEvents = eventMap[isoKey] || [];
            const isToday = isoKey === todayISO;

            return (
              <div
                key={i}
                className={[
                  "cal-cell",
                  !isCurrentMonth ? "cal-cell--outside" : "",
                  isToday ? "cal-cell--today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="cal-cell-day">{date.getDate()}</span>
                <div className="cal-cell-events">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <EventBadge key={ev.id} event={ev} />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="cal-event-more">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: Side Panel ── */}
      <div className="cal-right">
        {/* Upcoming Deadlines */}
        <section className="cal-panel-section">
          <h3 className="cal-panel-title">Upcoming Deadlines</h3>
          {upcomingDeadlines.length > 0 ? (
            <div className="cal-deadlines-list">
              {upcomingDeadlines.map((d) => (
                <DeadlineCard key={d.id} item={d} />
              ))}
            </div>
          ) : (
            <p className="cal-panel-empty">No upcoming deadlines</p>
          )}
        </section>

        {/* Statistics */}
        <section className="cal-panel-section">
          <h3 className="cal-panel-title">Statistics</h3>
          <div className="cal-stats-grid">
            <div className="cal-stat-card">
              <span className="cal-stat-label">Completed</span>
              <span className="cal-stat-number">{stats.completed}</span>
            </div>
            <div className="cal-stat-card cal-stat-card--overdue">
              <span className="cal-stat-label">Overdue</span>
              <span className="cal-stat-number cal-stat-number--overdue">
                {stats.overdue}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
