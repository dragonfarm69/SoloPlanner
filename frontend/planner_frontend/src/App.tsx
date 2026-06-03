import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./Pages/main";
import UserProfile from "./Pages/Profile/UserProfileMain";
import AuthPage from "./Pages/Authorization/Auth";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
