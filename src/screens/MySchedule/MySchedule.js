import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import styles from "../../utils/styles";
import { BackHeader, BottomTab } from '../../components';
import { SafeAreaView } from "react-native-safe-area-context";
import Schedule from './Schedule/AllSchedule';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';


//const baseUrl = 'https://admin.zypsii.com'; // Update the base URL if necessary

function MySchedule({ navigation }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(null);
  const [all_schedule, setAll_schedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 20;

  // Fetch schedule data with pagination
  const fetch_all_schedule = async (pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    const accessToken = await AsyncStorage.getItem('accessToken');
    try {
      const response = await fetch(`${base_url}/schedule/listing/filter?page=${pageNum}&limit=${limit}`, {
        method: 'get',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }); 
      const data = await response.json();
      if (data.success && data.data) {
        const formattedData = data.data.map((item) => {
          const fromDate = new Date(item.Dates.from);
          const endDate = new Date(item.Dates.end);
          const createdAt = new Date(item.createdAt);
          
          return {
            id: item._id,
            title: item.tripName,
            from: item.locationDetails?.[0]?.address || 'Unknown location',
            to: item.locationDetails?.[1]?.address || 'Unknown location',
            date: fromDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            travelMode: item.travelMode,
            visible: item.visible,
            numberOfDays: item.numberOfDays.toString(),
            imageUrl: item.bannerImage,
            locationDetails: item.locationDetails,
            createdAt: createdAt.toISOString().split('T')[0],
            rawLocation: {
              from: {
                latitude: item.location.from.latitude,
                longitude: item.location.from.longitude
              },
              to: {
                latitude: item.location.to.latitude,
                longitude: item.location.to.longitude
              }
            }
          };
        });

        if (isLoadMore) {
          setAll_schedule(prev => [...prev, ...formattedData]);
        } else {
          setAll_schedule(formattedData);
        }

        setHasMore(formattedData.length === limit);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetch_all_schedule(1);
  }, []);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetch_all_schedule(nextPage, true);
    }
  };

  // Helper function to generate dates for the current month
  const getDatesForMonth = (year, month) => {
    const dates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      dates.push({
        day: day,
        week: date.toLocaleString("en-US", { weekday: "short" }).charAt(0),
        fullDate: date,
        dateString: date.toISOString().split('T')[0]
      });
    }
    return dates;
  };

  const year = today.getFullYear();
  const month = today.getMonth();
  const dates = getDatesForMonth(year, month);

  // Filter schedules for the selected date
  const filteredSchedules = selectedDate ? all_schedule.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const scheduleDateString = scheduleDate.toISOString().split('T')[0];
    return scheduleDateString === selectedDateString;
  }) : all_schedule; // Show all schedules when no date is selected

  // Handle navigation between months
  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setSelectedDate(newDate);
  };

  const formatMonthYear = (date) => {
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  // Back button pressed
  const backPressed = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />
      <BackHeader backPressed={backPressed} title="Schedule" />

      <View style={[styles.datecontainer, { flex: 1, width: '100%' }]}>
        <View style={[styles.dateScheduleContainer, { width: '100%' }]}>
          <View style={styles.monthNavigation}>
            <Text style={styles.monthText}>{formatMonthYear(today)}</Text>
            <TouchableOpacity onPress={handlePrevMonth}>
              <Text style={styles.navButton}>{"<"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextMonth}>
              <Text style={styles.navButton}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={dates}
            horizontal
            keyExtractor={(item) => item.dateString}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedDate(item.fullDate)}
                style={[
                  styles.dayContainer,
                  selectedDate && item.dateString === selectedDate.toISOString().split('T')[0] &&
                  styles.selectedDayContainer,
                ]}
              >
                <Text
                  style={[
                    styles.weekText,
                    selectedDate && item.dateString === selectedDate.toISOString().split('T')[0] &&
                    styles.selectedWeekText,
                  ]}
                >
                  {item.week}
                </Text>
                <Text
                  style={[
                    styles.dayText,
                    selectedDate && item.dateString === selectedDate.toISOString().split('T')[0] &&
                    styles.selectedDayText,
                  ]}
                >
                  {item.day}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        <View style={{ flex: 1, width: '100%' }}>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={{ marginTop: 10, color: '#666' }}>Loading schedules...</Text>
            </View>
          ) : (
            <FlatList
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ 
                paddingBottom: 80,
                paddingHorizontal: 10,
                width: '100%'
              }}
              vertical
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()} 
              data={filteredSchedules}
              renderItem={({ item }) => <Schedule item={item} />}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 }}>
                  <Text style={{ color: '#666', fontSize: 16 }}>
                    {selectedDate ? 'No schedules for this date' : 'No schedules available'}
                  </Text>
                </View>
              }
              ListFooterComponent={() => (
                isLoadingMore ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color="#0000ff" />
                  </View>
                ) : null
              )}
            />
          )}
        </View>
      </View>
     
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        zIndex: 100,
        elevation: 5
      }}>
        <BottomTab screen="WhereToGo" />
      </View>

    </SafeAreaView>
  );
}

export default MySchedule;
