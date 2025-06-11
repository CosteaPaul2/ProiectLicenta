"use client"

import dynamic from "next/dynamic";
import { useState } from "react";
import { SignOutButton } from "./SignOutButton";
import UserCardComponent from "./UserCardComponent";
import AddLocationForm from "./AddLocationForm";

interface DashboardClientProps {
    username: string;
    email: string;
    id: string;
}

const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => <p>Loading CO2 monitoring map...</p>,
});

export function DashboardClient({ email }: DashboardClientProps) {
    const [isAddingLocation, setIsAddingLocation] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [mapKey, setMapKey] = useState(0); // Force map refresh after adding location

    const handleLocationSelect = (lat: number, lng: number) => {
        setSelectedCoords({ lat, lng });
        setIsAddingLocation(true);
    };

    const handleAddSuccess = () => {
        setIsAddingLocation(false);
        setSelectedCoords(undefined);
        setMapKey(prev => prev + 1); // Refresh map to show new location
    };

    const handleAddCancel = () => {
        setIsAddingLocation(false);
        setSelectedCoords(undefined);
    };

    return (
        <>
            {/* Header Section */}
            <div className="bg-white shadow-sm border-b mb-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                CO2 Monitoring Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Track and monitor CO2 emission levels across different locations
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <UserCardComponent email={email} />
                            <SignOutButton />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Controls Section */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">Normal (≤450 ppm)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">Medium (451-500 ppm)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">High (&gt;500 ppm)</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAddingLocation(!isAddingLocation)}
                        disabled={isAddingLocation}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        {isAddingLocation ? "Click on map to select location" : "Add New Location"}
                    </button>
                </div>

                {/* Content Layout */}
                <div className={`grid gap-6 ${isAddingLocation ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Map Section */}
                    <div className="bg-white rounded-lg shadow-lg p-4">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            CO2 Emission Locations
                        </h2>
                        <Map
                            key={mapKey}
                            onLocationSelect={handleLocationSelect}
                            showClickToAdd={isAddingLocation}
                        />
                    </div>

                    {/* Add Location Form */}
                    {isAddingLocation && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <AddLocationForm
                                selectedCoords={selectedCoords}
                                onSuccess={handleAddSuccess}
                                onCancel={handleAddCancel}
                            />
                        </div>
                    )}
                </div>

                {/* Info Section */}
                {!isAddingLocation && (
                    <div className="mt-8 bg-blue-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">
                            About CO2 Monitoring
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4 text-blue-800">
                            <div>
                                <h4 className="font-medium mb-2">Understanding CO2 Levels:</h4>
                                <ul className="text-sm space-y-1">
                                    <li>• <strong>350-400 ppm:</strong> Pre-industrial levels</li>
                                    <li>• <strong>400-450 ppm:</strong> Current normal range</li>
                                    <li>• <strong>450-500 ppm:</strong> Elevated levels</li>
                                    <li>• <strong>500+ ppm:</strong> High concentration areas</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">How to Use:</h4>
                                <ul className="text-sm space-y-1">
                                    <li>• Click markers to view detailed information</li>
                                    <li>• Use "Add New Location" to add monitoring points</li>
                                    <li>• Colors indicate CO2 concentration levels</li>
                                    <li>• Numbers show exact ppm readings</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}