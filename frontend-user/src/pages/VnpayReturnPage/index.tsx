import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../component/layouts/Header/Header";
import Footer from "../../component/layouts/Footer/footer";

export const VnpayReturnPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [invoiceId, setInvoiceId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isSuccess = params.get("success") === "true";
    const msg = params.get("message") || "";
    const invId = params.get("invoiceId") || "";

    setSuccess(isSuccess);
    setMessage(msg);
    setInvoiceId(invId);
    setLoading(false);
  }, [location.search]);

  if (loading) return <div className="p-8 text-center text-white">Đang xử lý kết quả thanh toán...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16 w-full flex flex-col items-center justify-center">
        <div className={`p-8 rounded-2xl w-full max-w-md text-center border shadow-xl ${success ? "bg-green-900/20 border-green-500/30" : "bg-red-900/20 border-red-500/30"}`}>
          <div className="mb-6 flex justify-center">
            {success ? (
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            )}
          </div>
          
          <h2 className={`text-2xl font-bold mb-4 ${success ? "text-green-400" : "text-red-400"}`}>
            {success ? "Thanh toán thành công" : "Thanh toán thất bại"}
          </h2>
          
          <p className="text-gray-300 mb-2">{message}</p>
          {invoiceId && success && (
            <p className="text-gray-400 text-sm mb-8">Mã hoá đơn: {invoiceId}</p>
          )}

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate("/staff")} 
              className="py-3 px-6 rounded-xl font-medium transition-colors bg-white/10 hover:bg-white/20 text-white"
            >
              Trở về Trang Quản lý
            </button>
            <button 
              onClick={() => navigate("/")} 
              className="py-3 px-6 rounded-xl font-medium transition-colors bg-transparent border border-white/20 text-white hover:bg-white/5"
            >
              Về Trang chủ
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
