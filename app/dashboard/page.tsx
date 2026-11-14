"use client";

import { useEffect, useState } from "react";
import DayCarousel from "@/components/DayCarousel";
import BestTimesBox from "@/components/BestTimesBox";
import ChartContainer from "@/components/ChartContainer";
import TotalTimeBox from "@/components/TotalTimeBox";
import AITrainingSummary from "@/components/AITrainingSummary";
import SimpleChart from "@/components/SimpleChart";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsSummaryLoading(false);
    }, 1500);
  };

  // Sample data - will be replaced with real data from API
  const weeklyRunningData = [15, 18, 22, 19, 25, 28, 20];
  const weeklyRunningLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const totalTimeData = [45, 52, 58, 65, 72, 85, 98];
  const totalTimeLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"];

  return (
    <div className="min-h-screen bg-darkgrey pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-offwhite mb-2">
            Good Morning! 🔥
          </h1>
          <p className="text-gray-400">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Day Carousel */}
        <DayCarousel onDaySelect={setSelectedDate} />

        {/* Best Times & Total Time Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BestTimesBox />
          </div>
          <div>
            <TotalTimeBox totalTime="1:58:20" lastUpdated="Last updated today" />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartContainer
            title="Weekly Running Mileage"
            subtitle="Current: 20 km"
            isLoading={isLoading}
          >
            <SimpleChart
              type="line"
              data={weeklyRunningData}
              labels={weeklyRunningLabels}
              color="blue"
            />
          </ChartContainer>

          <ChartContainer
            title="Total Hyrox Simulation Time"
            subtitle="Current: 1:58:20"
            isLoading={isLoading}
          >
            <SimpleChart
              type="line"
              data={totalTimeData}
              labels={totalTimeLabels}
              color="orange"
            />
          </ChartContainer>
        </div>

        {/* AI Summary Section */}
        <AITrainingSummary
          summary="Great week! You've completed 7 workouts with a total of 6 hours 48 minutes of training. Your running mileage increased by 15% compared to last week. Keep up the momentum—you're on track for your Hyrox goals!"
          isLoading={isSummaryLoading}
          onGenerateSummary={handleGenerateSummary}
        />
      </div>
    </div>
  );
}
