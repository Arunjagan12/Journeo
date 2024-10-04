import React, { useState } from "react";
import { View, Image, TextInput, FlatList, Text, TouchableOpacity } from "react-native";
import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);

  const searchPlaces = async (input: string) => {
    if (input.length < 3) {
      setPlaces([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${input}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setPlaces(data);
    } catch (error) {
      console.error("Error fetching places:", error);
    }
  };

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff", // Background for the container
          borderRadius: 50, // Circular corners
          paddingHorizontal: 10,
          paddingVertical: 8,
          shadowColor: "#000", // Adding shadow for better elevation
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 5,
          zIndex: 50,
        },
        containerStyle,
      ]}
    >
      <View style={{ flex: 1 }}>
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            searchPlaces(text);
          }}
          placeholder={initialLocation ?? "Where do you want to go?"}
          placeholderTextColor="#a9a9a9" // Lighter gray for better contrast
          style={{
            backgroundColor: textInputBackgroundColor || "#f3f4f6", // Light gray background
            fontSize: 16,
            fontWeight: "500",
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 50,
            color: "#333", // Darker text color for readability
          }}
        />
      </View>

      <TouchableOpacity style={{ justifyContent: "center", alignItems: "center" }}>
        <Image
          source={icon || icons.search}
          style={{ width: 24, height: 24 }} // Adjusted size for better visibility
          resizeMode="contain"
        />
      </TouchableOpacity>

      {places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item) => item.place_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                handlePress({
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon),
                  address: item.display_name,
                });
                setPlaces([]);
              }}
              style={{
                backgroundColor: "#fff",
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#eaeaea",
              }}
            >
              <Text style={{ color: "#333", fontSize: 14 }}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
          style={{
            position: "absolute",
            top: 55, // Adjust based on the input height
            width: "100%",
            backgroundColor: "white",
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 10,
            elevation: 5,
            maxHeight: 200, // Limit the dropdown height
            zIndex: 99,
          }}
        />
      )}
    </View>
  );
};

export default GoogleTextInput;
