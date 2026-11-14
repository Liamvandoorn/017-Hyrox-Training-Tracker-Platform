"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasscodeScreen from "@/components/PasscodeScreen";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuth = localStorage.getItem("hyrox_authenticated") === "true";
    if (isAuth) {
      router.replace("/dashboard");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleUnlock = () => {
    localStorage.setItem("hyrox_authenticated", "true");
    router.replace("/dashboard");
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

  return <PasscodeScreen onUnlock={handleUnlock} />;
}
