"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasscodeScreen from "@/components/PasscodeScreen";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuth = localStorage.getItem("hyrox_authenticated") === "true";
    if (isAuth) {
      setIsAuthenticated(true);
      router.push("/dashboard");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleUnlock = () => {
    setIsAuthenticated(true);
    localStorage.setItem("hyrox_authenticated", "true");
    router.push("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("hyrox_authenticated");
    setIsAuthenticated(false);
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-darkgrey flex items-center justify-center">
        <div className="animate-pulse">
          <div className="text-offwhite text-2xl font-bold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasscodeScreen onUnlock={handleUnlock} />;
  }

  return (
    <main className="min-h-screen bg-darkgrey">
      <Navbar onLogout={handleLogout} />
    </main>
  );
}
