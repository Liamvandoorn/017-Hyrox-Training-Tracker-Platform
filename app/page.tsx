"use client";

import { useAuth } from "@/components/AuthProvider";
import PasscodeScreen from "@/components/PasscodeScreen";

export default function Home() {
  const { setupRequired, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-pulse">
          <div className="text-white text-2xl font-bold">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-[#ffa8a4]" role="alert">
        {error}. Check the database configuration and refresh.
      </div>
    );
  }

  return <PasscodeScreen setupRequired={setupRequired} />;
}
