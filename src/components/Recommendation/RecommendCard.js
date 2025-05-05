import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions, Animated, Easing } from 'react-native';
import { colors } from "../../utils";
import { Ionicons } from '@expo/vector-icons';
import navigationService from '../../routes/navigationService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 30; // Full width minus margins

const DirectionIndicator = ({ duration, distance }) => {
    const animation = useRef(new Animated.Value(0)).current;
    const pulseAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animation, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true,
                    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                }),
                Animated.timing(animation, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnimation, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateX = animation.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, CARD_WIDTH - 60, CARD_WIDTH - 60, 0, 0],
    });

    const translateY = animation.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, 30, 60, 30, 0],
    });

    const rotate = animation.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '45deg', '90deg', '135deg', '180deg'],
    });

    const scale = pulseAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    return (
        <View style={styles.directionContainer}>
            <View style={styles.roadContainer}>
                <View style={styles.roadInner}>
                    <View style={styles.roadLine} />
                    <View style={styles.roadLine} />
                    <View style={styles.roadLine} />
                    <View style={styles.roadLine} />
                    <View style={styles.roadLine} />
                </View>
                <View style={styles.roadEdgeLeft} />
                <View style={styles.roadEdgeRight} />
                <View style={styles.distanceInfo}>
                    <Text style={styles.distanceText}>{distance}</Text>
                    <Text style={styles.durationText}>{duration}</Text>
                </View>
            </View>
            <Animated.View 
                style={[
                    styles.bikeContainer, 
                    { 
                        transform: [
                            { translateX },
                            { translateY },
                            { rotate },
                            { scale }
                        ]
                    }
                ]}
            >
                <Ionicons name="bicycle" size={32} color={colors.Zypsii_color} style={styles.bikeIcon} />
                <View style={styles.bikeShadow} />
            </Animated.View>
        </View>
    );
};

// Nearby Places Card Component
const RecommendedScheduleCard = ({ onSchedulePress, title }) => {
    const scrollViewRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const currentIndex = useRef(0);
    const autoScrollTimer = useRef(null);

    const startAutoScroll = () => {
        if (scrollViewRef.current) {
            autoScrollTimer.current = setInterval(() => {
                currentIndex.current = (currentIndex.current + 1) % suggestions[0].places.length;
                
                // Smooth scroll animation
                Animated.timing(scrollX, {
                    toValue: currentIndex.current * (CARD_WIDTH - 30),
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }).start();

                scrollViewRef.current.scrollTo({
                    x: currentIndex.current * (CARD_WIDTH - 30),
                    animated: true,
                });
            }, 3000); // Change card every 3 seconds
        }
    };

    const stopAutoScroll = () => {
        if (autoScrollTimer.current) {
            clearInterval(autoScrollTimer.current);
        }
    };

    useEffect(() => {
        startAutoScroll();
        return () => stopAutoScroll();
    }, []);

    const handleScroll = (event) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH - 30));
        if (newIndex !== currentIndex.current) {
            currentIndex.current = newIndex;
            stopAutoScroll();
            startAutoScroll();
        }
    };

    const handleViewDetails = (place) => {
        navigationService.navigate('PlaceDetails', { 
            place,
            isAllPlaces: false 
        });
    };

    const handleViewAll = (suggestion) => {
        navigationService.navigate('PlaceDetails', {
            places: suggestion.places,
            isAllPlaces: true
        });
    };

    const suggestions = [
       
        {
            title: "Cultural Heritage",
            places: [
                {
                    name: "Basilica of Bom Jesus",
                    time: "9:00 AM - 12:00 PM",
                    icon: "⛪",
                    activities: ["Historical Tour", "Photography", "Religious Visit"],
                    date: "2024-03-17",
                    rating: "4.7",
                    price: "Free",
                    duration: "3 hours",
                    distance: "12 km",
                    description: "Explore this UNESCO World Heritage Site and marvel at its Baroque architecture.",
                    vehicle: "car"
                },
                {
                    name: "Fort Aguada",
                    time: "2:00 PM - 5:00 PM",
                    icon: "🏰",
                    activities: ["Historical Tour", "Photography", "Sunset Viewing"],
                    date: "2024-03-17",
                    rating: "4.5",
                    price: "₹100",
                    duration: "3 hours",
                    distance: "15 km",
                    description: "Visit this 17th-century Portuguese fort with stunning views of the Arabian Sea.",
                    vehicle: "car"
                }
            ]
        },
        {
          title: " Heritage",
          places: [
              {
                  name: "Jesus",
                  time: "9:00 AM - 12:00 PM",
                  icon: "⛪",
                  activities: ["Historical Tour", "Photography", "Religious Visit"],
                  date: "2024-03-17",
                  rating: "4.7",
                  price: "Free",
                  duration: "3 hours",
                  distance: "12 km",
                  description: "Explore this UNESCO World Heritage Site and marvel at its Baroque architecture.",
                  vehicle: "car"
              },
              {
                  name: " Aguada",
                  time: "2:00 PM - 5:00 PM",
                  icon: "🏰",
                  activities: ["Historical Tour", "Photography", "Sunset Viewing"],
                  date: "2024-03-17",
                  rating: "4.5",
                  price: "₹100",
                  duration: "3 hours",
                  distance: "15 km",
                  description: "Visit this 17th-century Portuguese fort with stunning views of the Arabian Sea.",
                  vehicle: "car"
              }
          ]
      }
    ];
  
    const getVehicleIcon = (vehicle) => {
        switch(vehicle) {
            case 'bike':
                return '🚲';
            case 'car':
                return '🚗';
            case 'jeep':
                return '🚙';
            default:
                return '🚗';
        }
    };
  
    const renderActivities = (activities) => {
        return (
            <View style={styles.activitiesContainer}>
                {activities.slice(0, 2).map((activity, activityIndex) => (
                    <View key={activityIndex} style={styles.activityTag}>
                        <Text style={styles.activityText}>{activity}</Text>
                    </View>
                ))}
                {activities.length > 2 && (
                    <View style={styles.moreActivities}>
                        <Text style={styles.moreActivitiesText}>+{activities.length - 2} more</Text>
                    </View>
                )}
            </View>
        );
    };
  
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };
  
    const renderPlaceCard = (place, placeIndex) => (
        <View key={placeIndex} style={styles.placeCardContainer}>
            <View style={styles.placeCard}>
                <View style={styles.dayHeader}>
                    <View style={styles.dayMarker}>
                        <Text style={styles.dayText}>Day {placeIndex + 1}</Text>
                        <Text style={styles.dateText}>{formatDate(place.date)}</Text>
                    </View>
                </View>
                <View style={styles.placeContent}>
                    <View style={styles.placeHeader}>
                        <Text style={styles.placeIcon}>{place.icon}</Text>
                        <View style={styles.placeInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.placeName}>{place.name}</Text>
                                {place.vehicle && (
                                    <View style={styles.vehicleContainer}>
                                        <Text style={styles.vehicleIcon}>
                                            {place.vehicle === 'bike' ? '🚲' : place.vehicle === 'car' ? '🚗' : '🚙'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.placeTime}>{place.time}</Text>
                        </View>
                    </View>
                    <Text style={styles.placeDescription}>{place.description}</Text>
                    <View style={styles.placeMeta}>
                        <View style={styles.metaItem}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.metaText}>{place.rating}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="cash-outline" size={16} color="#666" />
                            <Text style={styles.metaText}>{place.price}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text style={styles.metaText}>{place.duration}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text style={styles.metaText}>{place.distance}</Text>
                        </View>
                    </View>
                    <View style={styles.activitiesContainer}>
                        {place.activities && place.activities.map((activity, activityIndex) => (
                            <View key={activityIndex} style={styles.activityTag}>
                                <Text style={styles.activityText}>{activity}</Text>
                            </View>
                        ))}
                    </View>
                    <TouchableOpacity 
                        style={styles.viewButton}
                        onPress={() => handleViewDetails(place)}
                    >
                        <Text style={styles.viewButtonText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.Zypsii_color} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
  
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={() => handleViewAll(suggestions[0])}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          pagingEnabled
        >
          {suggestions.map((suggestion, index) => (
            <View key={index} style={[styles.suggestionCard, { width: CARD_WIDTH }]}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => onSchedulePress(suggestion)}
                >
                  <Ionicons name="add-circle-outline" size={16} color={colors.Zypsii_color} />
                </TouchableOpacity>
              </View>

              <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                contentContainerStyle={styles.placesScrollContent}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true, listener: handleScroll }
                )}
                scrollEventThrottle={16}
              >
                {suggestion.places.map((place, placeIndex) => (
                  <View key={placeIndex} style={styles.placeCardContainer}>
                    <View style={styles.placeCard}>
                      <View style={styles.dayHeader}>
                        <View style={styles.dayMarker}>
                          <Text style={styles.dayText}>Day {placeIndex + 1}</Text>
                          <Text style={styles.dateText}>{formatDate(place.date)}</Text>
                        </View>
                      </View>
                      <View style={styles.placeContent}>
                        <View style={styles.placeHeader}>
                          <Text style={styles.placeIcon}>{place.icon}</Text>
                          <View style={styles.placeInfo}>
                            <View style={styles.nameRow}>
                              <Text style={styles.placeName}>{place.name}</Text>
                              {place.vehicle && (
                                <View style={styles.vehicleContainer}>
                                  <Text style={styles.vehicleIcon}>
                                    {place.vehicle === 'bike' ? '🚲' : place.vehicle === 'car' ? '🚗' : '🚙'}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.placeTime}>{place.time}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.placeMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.metaText}>{place.rating}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="cash-outline" size={16} color="#666" />
                            <Text style={styles.metaText}>{place.price}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text style={styles.metaText}>{place.duration}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text style={styles.metaText}>{place.distance}</Text>
                          </View>
                        </View>
                        <View style={styles.activitiesContainer}>
                          {place.activities && place.activities.map((activity, activityIndex) => (
                            <View key={activityIndex} style={styles.activityTag}>
                              <Text style={styles.activityText}>{activity}</Text>
                            </View>
                          ))}
                        </View>
                        <TouchableOpacity 
                          style={styles.viewButton}
                          onPress={() => handleViewDetails(place)}
                        >
                          <Text style={styles.viewButtonText}>View Details</Text>
                          <Ionicons name="chevron-forward" size={16} color={colors.Zypsii_color} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </Animated.ScrollView>

              <View style={styles.paginationDots}>
                {suggestion.places.map((_, index) => {
                  const inputRange = [
                    (index - 1) * (CARD_WIDTH - 30),
                    index * (CARD_WIDTH - 30),
                    (index + 1) * (CARD_WIDTH - 30),
                  ];
                  
                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.8, 1.2, 0.8],
                    extrapolate: 'clamp',
                  });

                  const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.dot,
                        {
                          transform: [{ scale }],
                          opacity,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 5,
        paddingBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 5,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.fontMainColor,
    },
    viewAllText: {
        fontSize: 14,
        color: colors.Zypsii_color,
    },
    scrollContent: {
        paddingHorizontal: 5,
        paddingBottom: 20,
    },
    suggestionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginRight: 15,
        padding: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#f8f8f8',
        padding: 6,
        borderRadius: 12,
    },
    placesScrollContent: {
        flexDirection: 'row',
        paddingRight: 15,
    },
    placeCardContainer: {
    
        marginRight: 15,
        paddingHorizontal: 5,
    },
    placeCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dayHeader: {
        backgroundColor: colors.Zypsii_color,
        padding: 12,
    },
    dayMarker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dayText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    dateText: {
        fontSize: 14,
        color: '#fff',
    },
    placeContent: {
        padding: 16,
    },
    placeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    placeIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    placeInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    placeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    placeTime: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    placeDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    placeMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    activitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 8,
    },
    activityTag: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activityText: {
        fontSize: 12,
        color: '#666',
    },
    vehicleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    vehicleIcon: {
        fontSize: 20,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.Zypsii_color,
    },
    viewButtonText: {
        color: colors.Zypsii_color,
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
    },
    directionContainer: {
        height: 120,
        marginVertical: 8,
        position: 'relative',
        paddingHorizontal: 15,
    },
    roadContainer: {
        position: 'absolute',
        top: 20,
        left: 15,
        right: 15,
        height: 80,
        backgroundColor: '#E8E8E8',
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#D0D0D0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    roadInner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    roadLine: {
        width: 20,
        height: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
        transform: [{ rotate: '45deg' }],
    },
    roadEdgeLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 8,
        backgroundColor: '#D8D8D8',
        borderTopLeftRadius: 40,
        borderBottomLeftRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    roadEdgeRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 8,
        backgroundColor: '#D8D8D8',
        borderTopRightRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: -1, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    distanceInfo: {
        position: 'absolute',
        top: 0,
        right: 10,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    distanceText: {
        fontSize: 12,
        color: colors.Zypsii_color,
        fontWeight: '600',
        marginBottom: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    durationText: {
        fontSize: 10,
        color: colors.Zypsii_color,
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    bikeContainer: {
        position: 'absolute',
        top: 40,
        left: 15,
        zIndex: 2,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    bikeIcon: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        transform: [{ scale: 1.2 }],
    },
    bikeShadow: {
        width: 30,
        height: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 3,
        marginTop: 2,
        transform: [{ scaleX: 0.8 }],
    },
    roadDetails: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    roadMarker: {
        width: 6,
        height: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.Zypsii_color,
        marginHorizontal: 4,
    },
});

export default RecommendedScheduleCard;