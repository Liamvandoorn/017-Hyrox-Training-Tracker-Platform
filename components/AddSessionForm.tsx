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
      className="mb-6 space-y-5 rounded-[1.7rem] border border-white/80 bg-white/80 p-5 shadow-[0_14px_38px_rgba(47,68,85,0.08)] sm:p-7"
    >
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-800">New session</h2>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-[#f7f9fb] px-3 py-2.5 text-slate-800 outline-none transition focus:border-[#527b9f]"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Exercise
          </label>
          <select
            name="exercise"
            value={formData.exercise}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-[#f7f9fb] px-3 py-2.5 text-slate-800 outline-none transition focus:border-[#527b9f]"
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
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Duration (minutes)
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-[#f7f9fb] px-3 py-2.5 text-slate-800 outline-none transition focus:border-[#527b9f]"
            min="1"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Distance (km) - Optional
          </label>
          <input
            type="number"
            name="distance"
            value={formData.distance}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-[#f7f9fb] px-3 py-2.5 text-slate-800 outline-none transition focus:border-[#527b9f]"
            step="0.1"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Notes - Optional
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-[#f7f9fb] px-3 py-2.5 text-slate-800 outline-none transition focus:border-[#527b9f]"
          placeholder="How did it feel? Any observations?"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || isLoading}
        className="w-full rounded-xl bg-[#273744] py-3 font-semibold text-white transition-colors hover:bg-[#354c5d] disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Add Session"}
      </button>
    </form>
  );
}
