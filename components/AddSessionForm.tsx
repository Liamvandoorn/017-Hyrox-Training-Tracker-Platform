"use client";

import { useState } from "react";
import { TrainingSession } from "@/lib/types";

interface AddSessionFormProps {
  onSessionAdded: (session: TrainingSession) => void;
  isLoading: boolean;
}

export default function AddSessionForm({
  onSessionAdded,
  isLoading,
}: AddSessionFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    exercise: "",
    duration: "",
    distance: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!formData.exercise || !formData.duration) {
        setError("Exercise and duration are required");
        setSubmitting(false);
        return;
      }

      const response = await fetch("/api/training", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add training session");
      }

      const newSession = await response.json();
      onSessionAdded(newSession);

      setFormData({
        date: new Date().toISOString().split("T")[0],
        exercise: "",
        duration: "",
        distance: "",
        notes: "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-5 rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-[0_14px_38px_rgba(47,68,85,0.08)] sm:p-7"
    >
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-[#f3f2f4]">New session</h2>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#cbc7cd]">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-2.5 text-[#f3f2f4] outline-none transition focus:border-[#ef7890]"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#cbc7cd]">
            Exercise
          </label>
          <select
            name="exercise"
            value={formData.exercise}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-2.5 text-[#f3f2f4] outline-none transition focus:border-[#ef7890]"
            required
          >
            <option value="">Select an exercise</option>
            <option value="Run">Run</option>
            <option value="Sled Push">Sled Push</option>
            <option value="Sled Pull">Sled Pull</option>
            <option value="Wall Balls">Wall Balls</option>
            <option value="Rowing">Rowing</option>
            <option value="Burpee Broad Jumps">Burpee Broad Jumps</option>
            <option value="Sandbag Lunges">Sandbag Lunges</option>
            <option value="Rope Climb">Rope Climb</option>
            <option value="Monkey Bars">Monkey Bars</option>
            <option value="SkiErg">SkiErg</option>
            <option value="Tire Flip">Tire Flip</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#cbc7cd]">
            Duration (minutes)
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-2.5 text-[#f3f2f4] outline-none transition focus:border-[#ef7890]"
            min="1"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#cbc7cd]">
            Distance (km) - Optional
          </label>
          <input
            type="number"
            name="distance"
            value={formData.distance}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-2.5 text-[#f3f2f4] outline-none transition focus:border-[#ef7890]"
            step="0.1"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#cbc7cd]">
          Notes - Optional
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-2.5 text-[#f3f2f4] outline-none transition focus:border-[#ef7890]"
          placeholder="How did it feel? Any observations?"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || isLoading}
        className="w-full rounded-xl bg-[#f16b84] py-3 font-semibold text-[#290f18] transition-colors hover:bg-[#ff91a5] disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Add Session"}
      </button>
    </form>
  );
}
