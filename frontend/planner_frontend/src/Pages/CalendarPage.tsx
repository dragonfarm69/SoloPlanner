import { useEffect, useState } from "react";
import Calendar from "../components/Calendar";
import type {
  CalendarEvent,
  CalendarDeadline,
  CalendarStats,
} from "../components/Calendar";
import "./CalendarPage.css";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [deadline, setDeadline] = useState<CalendarDeadline[]>([]);
  const [stats, setStats] = useState<CalendarStats>({
    completed: 0,
    overdue: 0,
  });

  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:8081/user/me/tasks", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const fetchedEvents: CalendarEvent[] = data.map((g: any) => ({
          id: g.id,
          title: g.title,
          date: g.deadline ? g.deadline.split("T")[0] : "",
          type: "task",
        }));

        setEvents(fetchedEvents);

        const fetchedDeadlines: CalendarDeadline[] = data.map((g: any) => ({
          id: g.id,
          title: g.title,
          date: g.deadline ? g.deadline.split("T")[0] : "",
          tag: "TASK",
        }));
        setDeadline(fetchedDeadlines);

        console.log("FETCHED: ", fetchedEvents);
      }
    } catch (e) {
      console.error("Error fetching groups:", e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);
  return (
    <div className="calendar-page">
      {/* Header bar */}
      <header className="calendar-page-header">
        <div className="calendar-page-title-block">
          <h1 className="calendar-page-title">Calendar</h1>
          <p className="calendar-page-subtitle">
            Track deadlines and upcoming events across your projects
          </p>
        </div>
      </header>

      {/* Calendar content */}
      <main className="calendar-page-content">
        <Calendar
          events={[...events]}
          deadlines={[...deadline]}
          stats={stats}
        />
      </main>
    </div>
  );
}
