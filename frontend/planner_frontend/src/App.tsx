import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./Pages/main";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
