import { Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage/index.tsx";
import ContactPage from "./pages/ContactPage/index.tsx";
import RegisterPage from "./pages/RegisterPage/index.tsx";
import LoginPage from "./pages/Login/index.tsx";
import ChangePassPage from "./pages/ChangePass/index.tsx";
import ForgotPassPage from "./pages/ForgotPass/index.tsx";
import BookingPage from "./pages/Booking/index.tsx";
import StaffPage from "./pages/StaffPage/index.tsx";
import { useState, useEffect, useRef } from "react";
import PageLoader from "./component/layouts/pageLoader/index.tsx";
import MenuPage from "./pages/MenuPage/index.tsx";
import ProfilePage from "./pages/ProfilePage/index.tsx";
import { VnpayReturnPage } from "./pages/VnpayReturnPage/index.tsx";
import Chatbot from "./component/common/Chatbot/Chatbot.tsx";

function App() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      setIsLoading(true);
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/changePass" element={<ChangePassPage />} />
        <Route path="/forgotPass" element={<ForgotPassPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/vnpay-return" element={<VnpayReturnPage />} />
      </Routes>
      <Chatbot />
    </>
  );
}

export default App;
