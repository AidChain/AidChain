"use client"
import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';

// Sample countries with coordinates
const COUNTRIES = [
  { name: 'United States', lat: 39.8283, lng: -98.5795 },
  { name: 'United Kingdom', lat: 55.3781, lng: -3.4360 },
  { name: 'Germany', lat: 51.1657, lng: 10.4515 },
  { name: 'France', lat: 46.2276, lng: 2.2137 },
  { name: 'Japan', lat: 36.2048, lng: 138.2529 },
  { name: 'Australia', lat: -25.2744, lng: 133.7751 },
  { name: 'Canada', lat: 56.1304, lng: -106.3468 },
  { name: 'Brazil', lat: -14.2350, lng: -51.9253 },
  { name: 'India', lat: 20.5937, lng: 78.9629 },
  { name: 'China', lat: 35.8617, lng: 104.1954 },
  { name: 'South Africa', lat: -30.5595, lng: 22.9375 },
  { name: 'Mexico', lat: 23.6345, lng: -102.5528 },
  { name: 'Argentina', lat: -38.4161, lng: -63.6167 },
  { name: 'Nigeria', lat: 9.0820, lng: 8.6753 },
  { name: 'Kenya', lat: -0.0236, lng: 37.9062 },
  { name: 'Thailand', lat: 15.8700, lng: 100.9925 },
  { name: 'Sweden', lat: 60.1282, lng: 18.6435 },
  { name: 'Norway', lat: 60.4720, lng: 8.4689 },
  { name: 'Italy', lat: 41.8719, lng: 12.5674 },
  { name: 'Spain', lat: 40.4637, lng: -3.7492 }
];

// Types
interface Activity {
  id: string;
  type: 'donation' | 'redemption';
  amount: number;
  country: string;
  timestamp: Date;
  coordinates: { lat: number, lng: number };
}

// Activity Feed Component
const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Generate random activity
  const generateActivity = (): Activity => {
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const type = Math.random() > 0.6 ? 'donation' : 'redemption';
    const amount = Math.floor(Math.random() * 10000) + 100;
    
    return {
      id: `${Date.now()}-${Math.random()}`,
      type,
      amount,
      country: country.name,
      timestamp: new Date(),
      coordinates: { lat: country.lat, lng: country.lng }
    };
  };

  // Add new activity and node
  const addActivity = () => {
    const newActivity = generateActivity();
    
    // Add to activities (keep last 50)
    setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
  };

  // Generate activities at random intervals
  useEffect(() => {
    const generateAtInterval = () => {
      addActivity();
      
      // Schedule next activity (1-4 seconds)
      const nextInterval = Math.random() * 3000 + 1000;
      setTimeout(generateAtInterval, nextInterval);
    };

    // Start after initial delay
    const initialTimeout = setTimeout(generateAtInterval, 500);
    
    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <div className="h-102 flex flex-col">
      <h3 className="text-3xl font-semibold text-gray-100">Live Activity Feed</h3>
      <p className="text-lg text-gray-400 mt-1 mb-4">Real-time donations and redemptions worldwide</p>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="p-4 space-y-3">
          {activities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Waiting for activity...</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                  activity.type === 'donation'
                    ? 'bg-green-950/30 border-green-800/50 hover:bg-green-950/50'
                    : 'bg-red-950/30 border-red-800/50 hover:bg-red-950/50'
                } animate-in slide-in-from-top-2 fade-in-0 duration-500`}
              >
                <div className={`p-2 rounded-full ${
                  activity.type === 'donation' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {activity.type === 'donation' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      activity.type === 'donation'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {activity.type.toUpperCase()}
                    </span>
                    <span className="text-gray-300 font-semibold">
                      ${activity.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mt-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {activity.country}
                  </p>
                  
                  <p className="text-gray-500 text-xs mt-1">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;