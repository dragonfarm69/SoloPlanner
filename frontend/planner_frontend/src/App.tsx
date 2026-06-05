import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./Pages/main";
import UserProfile from "./Pages/Profile/UserProfileMain";
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
          <Route path="/" element={<UserProfile />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/project" element={<MainPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
