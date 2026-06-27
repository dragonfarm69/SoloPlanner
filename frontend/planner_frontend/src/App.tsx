import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./Pages/AppLayout";
import ProjectsView from "./Pages/Profile/ProjectsView";
import CalendarPage from "./Pages/CalendarPage";
import MainPage from "./Pages/main";
import AuthPage from "./Pages/Authorization/Auth";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch("http://localhost:8081/user/me", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        const data = await res.json();

        localStorage.clear();
        localStorage.setItem("user_id", data.id);
        localStorage.setItem("email", data.email);
        localStorage.setItem("firstName", data.firstName);
        localStorage.setItem("lastName", data.lastName);
        localStorage.setItem("username", data.username);
      } catch (e) {
        console.error("Error: ", e);
      }
    }
    fetchInfo();
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Standalone routes — no AppSidebar */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/projects/:projectId" element={<MainPage />} />

          {/* Layout route — AppSidebar always mounted, child renders in Outlet */}
          <Route element={<AppLayout />}>
            <Route index element={<ProjectsView />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
