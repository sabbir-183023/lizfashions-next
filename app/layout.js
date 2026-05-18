// app/layout.jsx
import "./globals.css";
import Header from "@/app/components/layout/Header";
import { CartProvider } from "@/app/context/CartContext";
import ToastProvider from "./components/ToastProvider";
import Footer from "./components/layout/Footer";
import { AuthProvider } from "@/app/context/AuthContext";

export const metadata = {
  title: "LiZ Fashions",
  description: "Welcome to Liz Fashion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <AuthProvider>
          <CartProvider>
            {/* Header with deep navy background */}
            <div className="w-full bg-[#0B1A33] px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 fixed top-0 left-0 right-0 z-50">
              <Header />
            </div>

            {/* Main content - add padding to account for fixed header */}
            <div className="w-full bg-slate-100 pt-15 md:pt-24 pb-20 md:pb-8 min-h-screen">
              {children}
              <ToastProvider />
            </div>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
