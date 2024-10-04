import ors from "openrouteservice-js";
import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_ORS_API_KEY;

// Log API Key to ensure it's set
console.log("Using ORS API Key:", directionsAPI);

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  ) {
    console.error("Missing location data for driver time calculation.");
    return;
  }

  const client = new ors.Directions({
    api_key: directionsAPI,
  });

  try {
    const timesPromises = markers.map(async (marker) => {
      // First, calculate time from driver to user
      const responseToUser = await client.calculate({
        coordinates: [
          [marker.longitude, marker.latitude], // Driver location
          [userLongitude, userLatitude], // User location
        ],
        profile: "driving-car",
        format: "geojson",
      });

      const timeToUser =
        responseToUser.features[0]?.properties.segments[0]?.duration;

      if (!timeToUser) {
        throw new Error("Invalid ORS response for driver to user route.");
      }

      // Then, calculate time from user to destination
      const responseToDestination = await client.calculate({
        coordinates: [
          [userLongitude, userLatitude], // User location
          [destinationLongitude, destinationLatitude], // Destination location
        ],
        profile: "driving-car",
        format: "geojson",
      });

      const timeToDestination =
        responseToDestination.features[0]?.properties.segments[0]?.duration;

      if (!timeToDestination) {
        throw new Error("Invalid ORS response for user to destination route.");
      }

      // Calculate the total time in minutes
      const totalTime = (timeToUser + timeToDestination) / 60; // Total time in minutes

      // Calculate the price based on the total time (arbitrary formula)
      const price = (totalTime * 0.5).toFixed(2);

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    // Log more detailed error information
    console.error("Error calculating driver times:", error.message, error.stack);
  }
};
