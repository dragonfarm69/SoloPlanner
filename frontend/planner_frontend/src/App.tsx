import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./Pages/main";
import UserProfile from "./Pages/Profile/UserProfileMain";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
