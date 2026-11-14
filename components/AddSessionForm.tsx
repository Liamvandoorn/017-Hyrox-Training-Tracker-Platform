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
      className="bg-gray-800 rounded-lg p-6 space-y-4 mb-6"
    >
      <h2 className="text-2xl font-bold text-offwhite mb-4">New Session</h2>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-offwhite mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-darkgrey text-offwhite border border-gray-600 rounded focus:outline-none focus:border-offwhite"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-offwhite mb-1">
            Exercise
          </label>
          <select
            name="exercise"
            value={formData.exercise}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-darkgrey text-offwhite border border-gray-600 rounded focus:outline-none focus:border-offwhite"
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
          <label className="block text-sm font-medium text-offwhite mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-darkgrey text-offwhite border border-gray-600 rounded focus:outline-none focus:border-offwhite"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-offwhite mb-1">
            Distance (km) - Optional
          </label>
          <input
            type="number"
            name="distance"
            value={formData.distance}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-darkgrey text-offwhite border border-gray-600 rounded focus:outline-none focus:border-offwhite"
            step="0.1"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-offwhite mb-1">
          Notes - Optional
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 bg-darkgrey text-offwhite border border-gray-600 rounded focus:outline-none focus:border-offwhite"
          placeholder="How did it feel? Any observations?"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || isLoading}
        className="w-full bg-offwhite text-darkgrey font-bold py-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Add Session"}
      </button>
    </form>
  );
}
