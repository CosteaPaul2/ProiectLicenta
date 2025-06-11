"use client";

import { useState } from "react";
import { createCO2Location } from "@/app/actions/location-actions";

interface AddLocationFormProps {
  selectedCoords?: { lat: number; lng: number };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddLocationForm({ 
  selectedCoords, 
  onSuccess, 
  onCancel 
}: AddLocationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    latitude: selectedCoords?.lat?.toString() || "",
    longitude: selectedCoords?.lng?.toString() || "",
    co2Level: "",
    description: "",
    source: "Manual Entry"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createCO2Location({
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        co2Level: parseFloat(formData.co2Level),
        description: formData.description,
        source: formData.source
      });

      if (result.success) {
        // Reset form
        setFormData({
          name: "",
          latitude: "",
          longitude: "",
          co2Level: "",
          description: "",
          source: "Manual Entry"
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || "Failed to create location");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Add CO2 Monitoring Location
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Location Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., City Center Station"
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
              Latitude *
            </label>
            <input
              type="number"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              required
              step="any"
              min="-90"
              max="90"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="51.505"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
              Longitude *
            </label>
            <input
              type="number"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              required
              step="any"
              min="-180"
              max="180"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="-0.09"
            />
          </div>
        </div>

        {/* CO2 Level */}
        <div>
          <label htmlFor="co2Level" className="block text-sm font-medium text-gray-700 mb-1">
            CO2 Level (ppm) *
          </label>
          <input
            type="number"
            id="co2Level"
            name="co2Level"
            value={formData.co2Level}
            onChange={handleInputChange}
            required
            min="0"
            max="10000"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="420.5"
          />
          <p className="text-xs text-gray-500 mt-1">
            Normal atmospheric CO2: ~400-420 ppm
          </p>
        </div>

        {/* Source */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Data Source
          </label>
          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Manual Entry">Manual Entry</option>
            <option value="Sensor Reading">Sensor Reading</option>
            <option value="Government Data">Government Data</option>
            <option value="Research Study">Research Study</option>
            <option value="Third Party">Third Party</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional description or notes about this location..."
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Adding..." : "Add Location"}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {selectedCoords && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            📍 Selected coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
} 