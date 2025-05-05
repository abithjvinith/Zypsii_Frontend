import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { colors } from "../../utils";
import { alignment } from "../../utils";
import { base_url } from "../../utils/base_url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';
import RecommendCard from "../../components/Recommendation/RecommendCard";
//const baseUrl = 'https://admin.zypsii.com'; // Backend API base URL



function SearchPage() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("People"); // Default tab is 'People'
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showViewMoreModal, setShowViewMoreModal] = useState(false);
  const fetchSearchResults = async (text) => {
    if (text.trim() === "") {
      setSearchResults([]); 
      return;
    }
    const accessToken = await AsyncStorage.getItem('accessToken');
    console.log('Access Token:', accessToken); // Log token for debugging

    const url = activeTab === "People"
      ? `${base_url}/user/getProfile?search=${encodeURIComponent(text)}`
      : `${base_url}/schedule/places/getNearest?searchPlaceName=${encodeURIComponent(text)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

  

      if (data.success && data.data) {
        if (activeTab === "Places") {
          // Format place data
          const formattedData = data.data.map(place => ({
            id: place._id,
            image: place.image,
            name: place.name,
            tagline: place.address,
            rating: place.rating,
            distance: place.distanceInKilometer,
            location: place.location
          }));
          setSearchResults(formattedData);
        } else {
          // Format people data (updated for array of users)
          const formattedData = data.data.map(user => ({
            id: user._id,
            image: user.profileImage || 'https://via.placeholder.com/50',
            name: user.fullName,
            tagline: user.userName,
            email: user.email,
            website: user.website,
            bio: user.bio,
            location: user.location,
            placeDetails: user.placeDetails
          }));
          setSearchResults(formattedData);
        }
      } else {
        console.log('No data found in response');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    }
  };

  // Handle search input changes
  const handleSearch = (text) => {
    setSearchText(text);
    fetchSearchResults(text); // Fetch data whenever text changes
  };

  // Render each search result item
  const renderItem = ({ item }) => (
    <>
    <TouchableOpacity
      onPress={() => {
        if (activeTab === "Places") {
          navigation.navigate('Destination', {
            product: {
              id: item.id,
              image: item.image,
              name: item.name,
              subtitle: item.tagline,
              rating: item.rating,
              distance: item.distance,
              location: item.location
            }
          });
        }
      }}
    >
      <View style={styles.personContainer}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.personDetails}>
          <Text style={styles.personName}>{item.name}</Text>
          {activeTab === "People" ?
            <Text style={styles.personTagline}>
              {item.tagline}
            </Text>
            :
            null
          }
          {activeTab === "Places" && (
            <>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={colors.Zypsii_color} />
                <Text style={styles.ratingText}>{item.rating || '0'}</Text>
                <Text style={styles.distanceText}>{item.distance}</Text>
              </View>
             
            </>
          )}
          {item.bio && <Text style={styles.bioText}>{item.bio}</Text>}
          {item.website && (
            <Text style={styles.websiteText} numberOfLines={1}>
              🌐 {item.website}
            </Text>
          )}
          
        </View>
        
      </View>
      
    </TouchableOpacity>
    {activeTab === "Places" && (
      <RecommendCard title="Suggested Itineraries"
        onSchedulePress={() => {
          setSelectedPlace(item);
          setShowScheduleModal(true);
        }}
        onViewMorePress={() => {
          setSelectedPlace(item);
          setShowViewMoreModal(true);
        }}
      />
    )}
  </>
  );

  // Display number of results
  const renderResultCount = () => {
    const count = searchResults.length;
    return (
      <Text style={styles.resultCount}>
        {count} {count === 1 ? 'result' : 'results'} found
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back button and search bar */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={22} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={`Search for ${activeTab.toLowerCase()}...`}
            placeholderTextColor="#999"
          />
          {searchText !== "" && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchText("");
                setSearchResults([]);
              }}
            >
              <Text style={styles.clearText}>✖</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>


      {/* <RecommendCard /> */}
      {/* Results count */}
      {searchResults.length > 0 && renderResultCount()}

      {/* Custom tab selector similar to image */}
      <View style={styles.tabContainer}>
        {["People", "Places"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton,
            ]}
            onPress={() => {
              setActiveTab(tab);
              setSearchResults([]); // Clear results when switching tabs
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

        ))}
      </View>

      {/* Results list */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          searchText.trim() !== "" ? (
            <Text style={styles.noResults}>No results found</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 5,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 45,
    marginLeft: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: 45,
  },
  clearButton: {
    padding: 5,
  },
  clearText: {
    fontSize: 16,
    color: "#999",
  },
  resultCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",  // Ensures the tabs are centered
    alignItems: "center",
  },
  tabButton: {
    paddingVertical: 15,
    marginRight: 30,
    position: "relative",
    alignItems: "center",
  },
  activeTabButton: {
    // Active styling handled by the indicator
  },
  tabText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
  },
  activeTabText: {
    fontSize: 16,
    color: colors.Zypsii_color,
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.Zypsii_color,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  personContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
  },
  personDetails: {
    marginLeft: 15,
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  personTagline: {
    fontSize: 14,
    color: colors.fontThirdColor || "#777",
    fontWeight: "normal",
  },
  bioText: {
    fontSize: 14,
    color: colors.fontThirdColor || "#777",
    marginTop: 4,
  },
  websiteText: {
    fontSize: 14,
    color: colors.Zypsii_color,
    marginTop: 4,
  },
  noResults: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 40,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: colors.Zypsii_color,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: colors.fontThirdColor || "#777",
    marginLeft: 4,
  },
  nearbyPlacesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nearbyPlacesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  nearbyPlacesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  nearbyPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  placeDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeDistance: {
    fontSize: 12,
    color: colors.Zypsii_color,
    marginTop: 2,
  },
  nearbyPlacesButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  nearbyPlacesButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  createScheduleButton: {
    backgroundColor: colors.Zypsii_color,
  },
  viewMoreButton: {
    backgroundColor: '#f0f0f0',
  },
  createScheduleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  viewMoreButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});

export default SearchPage;