"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  onLogout: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 md:relative md:border-b md:border-t-0">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-around items-center md:justify-start md:gap-8">
          <Link
            href="/dashboard"
            className={`flex-1 md:flex-none py-4 text-center md:py-3 transition-colors font-medium ${
              isActive("/dashboard")
                ? "text-orange-500 border-t-2 md:border-t-0 md:border-b-2 border-orange-500"
                : "text-gray-400 hover:text-offwhite"
            }`}
          >
            <span className="block md:hidden text-xs">Dashboard</span>
            <span className="hidden md:block">Dashboard</span>
          </Link>

          <Link
            href="/workout"
            className={`flex-1 md:flex-none py-4 text-center md:py-3 transition-colors font-medium ${
              isActive("/workout")
                ? "text-orange-500 border-t-2 md:border-t-0 md:border-b-2 border-orange-500"
                : "text-gray-400 hover:text-offwhite"
            }`}
          >
            <span className="block md:hidden text-xs">Log</span>
            <span className="hidden md:block">Log Workout</span>
          </Link>

          <Link
            href="/settings"
            className={`flex-1 md:flex-none py-4 text-center md:py-3 transition-colors font-medium ${
              isActive("/settings")
                ? "text-orange-500 border-t-2 md:border-t-0 md:border-b-2 border-orange-500"
                : "text-gray-400 hover:text-offwhite"
            }`}
          >
            <span className="block md:hidden text-xs">Settings</span>
            <span className="hidden md:block">Settings</span>
          </Link>

          <button
            onClick={onLogout}
            className="flex-1 md:flex-none py-4 text-center md:py-3 text-red-400 hover:text-red-300 transition-colors font-medium md:ml-auto text-xs md:text-base"
          >
            <span className="block md:hidden">Logout</span>
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
