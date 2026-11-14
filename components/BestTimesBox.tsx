"use client";

interface BestTimesBoxProps {
  times?: {
    running?: string;
    skiing?: string;
    rowing?: string;
    sledPull?: string;
    sledPush?: string;
    burpeeBroad?: string;
    sandbagLunges?: string;
    wallBalls?: string;
  };
}

export default function BestTimesBox({ times }: BestTimesBoxProps) {
  const exercises = [
    { label: "Running", value: times?.running || "—" },
    { label: "SkiErg", value: times?.skiing || "—" },
    { label: "Rowing", value: times?.rowing || "—" },
    { label: "Sled Pull", value: times?.sledPull || "—" },
    { label: "Sled Push", value: times?.sledPush || "—" },
    { label: "Burpee Broad", value: times?.burpeeBroad || "—" },
    { label: "Sandbag Lunges", value: times?.sandbagLunges || "—" },
    { label: "Wall Balls", value: times?.wallBalls || "—" },
  ];

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <h3 className="text-lg font-bold text-offwhite mb-6">Best Personal Times</h3>
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {exercises.map((exercise, idx) => (
          <div key={idx} className="bg-gray-900 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              {exercise.label}
            </p>
            <p className="text-lg font-bold text-orange-500 mt-2">
              {exercise.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
