import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Linking,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps"; // MapView for location selection
import Icon from "react-native-vector-icons/Ionicons"; // Import Icon library
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // Image picker for cover image
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { updateSchedule, updateDayLocation, setSubmitted } from '../../redux/slices/scheduleSlice';
import styles from "./styles";
import { base_url } from "../../utils/base_url";
import { colors } from '../../utils/colors';
import CustomLoader from '../../components/Loader/CustomLoader';
import { BackHeader } from '../../components';

const { width } = Dimensions.get('window');

function MakeSchedule() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const schedule = useSelector(state => state.schedule);
  
  const {
    bannerImage,
    tripName,
    travelMode,
    visible,
    locationFrom,
    locationTo,
    fromDate,
    toDate,
    days,
    isSubmitted
  } = schedule;

  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeType, setTimeType] = useState('start'); // 'start' or 'end'

  // Function to update schedule state
  const updateScheduleState = (updates) => {
    dispatch(updateSchedule(updates));
  };

  // Function to calculate the number of days between two dates
  const calculateNumberOfDays = (fromDate, toDate) => {
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Adding 1 for inclusive date range
  };

  // Function to handle the form submission
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!bannerImage) {
        Alert.alert('Error', 'Banner image is required');
        return;
      }

      // Check image size before sending
      const imageResponse = await fetch(bannerImage);
      const blob = await imageResponse.blob();
      const fileSizeInMB = blob.size / (1024 * 1024);
      
      if (fileSizeInMB > 10) {
        Alert.alert(
          'Error',
          'Image size exceeds 10MB limit. Please select a smaller image.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!tripName || tripName.length < 3) {
        Alert.alert('Error', 'Trip name is required and must be at least 3 characters long');
        return;
      }
      if (!days || days.length === 0) {
        Alert.alert('Error', 'At least one day plan is required');
        return;
      }
      if (!fromDate || !toDate) {
        Alert.alert('Error', 'Date range is required');
        return;
      }

      // Ensure dates are valid Date objects
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        Alert.alert('Error', 'Invalid date format');
        return;
      }

      // Get location from first and last day's map coordinates
      const firstDay = days[0];
      const lastDay = days[days.length - 1];

      if (!firstDay.latitude || !firstDay.longitude || !lastDay.latitude || !lastDay.longitude) {
        Alert.alert('Error', 'Please select locations for all days');
        return;
      }

      // Format location data using map coordinates
      const locationData = {
        from: {
          latitude: parseFloat(firstDay.latitude),
          longitude: parseFloat(firstDay.longitude)
        },
        to: {
          latitude: parseFloat(lastDay.latitude),
          longitude: parseFloat(lastDay.longitude)
        }
      };

      // Validate location coordinates
      if (!locationData.from.latitude || !locationData.from.longitude) {
        Alert.alert('Error', 'From location coordinates are required');
        return;
      }
      if (!locationData.to.latitude || !locationData.to.longitude) {
        Alert.alert('Error', 'To location coordinates are required');
        return;
      }

      // Format dates
      const datesData = {
        from: formatDate(fromDate),
        end: formatDate(toDate)
      };

      // Format plan description with validation
      const formattedPlanDescription = days.map(day => {
        if (!day.description || !day.latitude || !day.longitude) {
          throw new Error('Invalid day plan data');
        }
        return {
          Description: day.description.trim(),
          date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          location: {
            latitude: parseFloat(day.latitude),
            longitude: parseFloat(day.longitude)
          }
        };
      });

      // Calculate number of days between dates
      const diffTime = Math.abs(endDate - startDate);
      const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Create form data for multipart/form-data
      const formData = new FormData();
      
      // Add banner image with size check
      if (bannerImage) {
        const imageUri = bannerImage.startsWith('file://') ? bannerImage : `file://${bannerImage}`;
        formData.append('bannerImage', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'banner.jpg'
        });
      }

      // Add all fields individually to formData with size optimization
      formData.append('tripName', tripName.trim());
      formData.append('travelMode', "Bike");
      formData.append('visible', "Public");
      formData.append('location[from][latitude]', locationData.from.latitude.toString());
      formData.append('location[from][longitude]', locationData.from.longitude.toString());
      formData.append('location[to][latitude]', locationData.to.latitude.toString());
      formData.append('location[to][longitude]', locationData.to.longitude.toString());
      formData.append('dates[from]', startDate.toISOString().split('T')[0]);
      formData.append('dates[end]', endDate.toISOString().split('T')[0]);
      formData.append('numberOfDays', numberOfDays.toString());

      // Optimize plan description data
      const optimizedPlanDescription = formattedPlanDescription.map(plan => ({
        Description: plan.Description.trim(),
        date: plan.date,
        startTime: plan.startTime || "09:00",
        endTime: plan.endTime || "17:00",
        location: {
          latitude: parseFloat(plan.location.latitude),
          longitude: parseFloat(plan.location.longitude)
        }
      }));

      // Add each plan item individually in array format
      optimizedPlanDescription.forEach((plan, index) => {
        formData.append(`planDescription[${index}][Description]`, plan.Description);
        formData.append(`planDescription[${index}][date]`, plan.date);
        formData.append(`planDescription[${index}][startTime]`, plan.startTime);
        formData.append(`planDescription[${index}][endTime]`, plan.endTime);
        formData.append(`planDescription[${index}][location][latitude]`, plan.location.latitude.toString());
        formData.append(`planDescription[${index}][location][longitude]`, plan.location.longitude.toString());
      });

      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Log the size of the form data
      console.log('Form data size:', formData._parts.length);
      console.log('Base URL:', base_url);

      const response = await fetch(`${base_url}/schedule/create`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      let data;
      try {
        // Check if response is HTML
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          throw new Error('Server returned HTML instead of JSON. Please check the endpoint URL.');
        }
        
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        if (response.status === 413) {
          throw new Error('The data being sent is too large. Please reduce the size of your images or data.');
        } else if (response.status === 404) {
          throw new Error('Schedule creation endpoint not found. Please check the URL.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Server returned an invalid response. Status: ${response.status}`);
        }
      }

      if (response.ok) {
        dispatch(setSubmitted(true));
        Alert.alert('Success', data.message || 'Schedule created successfully!');
        navigation.navigate('MySchedule');
      } else {
        if (data.errors) {
          console.log('Validation errors:', data.errors);
          const errorMessages = Object.values(data.errors).flat();
          Alert.alert('Validation Error', errorMessages.join('\n'));
        } else {
          throw new Error(data.message || `Server error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save schedule. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => console.log('Error acknowledged')
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a day to the trip plan
  const addDay = () => {
    const newDay = { 
      id: days.length + 1, 
      description: "", 
      latitude: "", 
      longitude: "" 
    };
    updateScheduleState({ days: [...days, newDay] });
  };

  // Function to remove a day from the trip plan
  const removeDay = (id) => {
    if (!isSubmitted) {
    const updatedDays = days.filter((day) => day.id !== id);
      updateScheduleState({ days: updatedDays });
    } else {
      Alert.alert('Cannot Remove', 'Schedule has already been submitted and cannot be modified.');
    }
  };

  // Function to update a day's description or location
  const updateDayDetails = (id, field, value) => {
    if (!isSubmitted) {
    const updatedDays = days.map((day) =>
      day.id === id ? { ...day, [field]: value } : day
    );
      updateScheduleState({ days: updatedDays });
    } else {
      Alert.alert('Cannot Update', 'Schedule has already been submitted and cannot be modified.');
    }
  };

  // Open map for location selection for a specific day
  const openMapForDay = (dayId) => {
    if (!isSubmitted) {
    navigation.navigate('MapScreen', { dayId });
    } else {
      Alert.alert('Cannot Modify', 'Schedule has already been submitted and cannot be modified.');
    }
  };

  // Handle location update from map screen
  useEffect(() => {
    if (route.params?.latitude && route.params?.longitude && !isSubmitted) {
      const { latitude, longitude, dayId } = route.params;
      dispatch(updateDayLocation({ dayId, latitude, longitude }));
    }
  }, [route.params]);

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to select an image.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        maxWidth: 1200,
        maxHeight: 1200,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        base64: false,
        exif: false,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No image was selected');
        return;
      }

      const selectedImage = result.assets[0];
      
      // Check file size
      const imageResponse = await fetch(selectedImage.uri);
      const blob = await imageResponse.blob();
      const fileSizeInMB = blob.size / (1024 * 1024);
      
      if (fileSizeInMB > 10) {
        Alert.alert(
          'Image Too Large',
          'Please select an image smaller than 10MB',
          [{ text: 'OK' }]
        );
        return;
      }

      updateScheduleState({ bannerImage: selectedImage.uri });
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const onFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateScheduleState({ fromDate: selectedDate.toISOString() });
    }
  };

  const onToDateChange = (event, selectedDate) => {
    setShowToDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateScheduleState({ toDate: selectedDate.toISOString() });
    }
  };

  const backPressed = () => {
    Alert.alert(
      'Leave Form',
      'Are you sure you want to leave? Your changes will not be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: true }
    );
  };

  // Function to handle time selection
  const handleTimeSelect = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      
      const updatedDays = days.map((day, index) => {
        if (index === selectedDayIndex) {
          return {
            ...day,
            [timeType === 'start' ? 'startTime' : 'endTime']: formattedTime
          };
        }
        return day;
      });
      
      updateScheduleState({ days: updatedDays });
    }
  };

  // Function to open time picker
  const openTimePicker = (index, type) => {
    setSelectedDayIndex(index);
    setTimeType(type);
    setShowTimePicker(true);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <LinearGradient
        colors={['#A60F93', '#8B0B7D', '#6D0861']}
        style={styles.headerGradient}
      >
        <BackHeader 
        title="Schedule"
        backPressed={backPressed}
        style={{ marginRight: 10 }} 
      />
      </LinearGradient>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tripContainer}>
          {/* Banner Image Section */}
          <TouchableOpacity 
            style={styles.bannerContainer}
            onPress={pickImage}
          >
            {bannerImage ? (
              <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Icon name="camera" size={40} color="#666" />
                <Text style={styles.bannerPlaceholderText}>Add Cover Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Trip Name */}
          <View style={styles.formGroupRow}>
            <Text style={styles.labelRow}>Trip Name</Text>
            <View style={styles.inputContainer}>
              <Icon name="airplane" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.underlineInput}
              value={tripName}
                onChangeText={(text) => updateScheduleState({ tripName: text })}
              placeholder="Enter trip name"
                placeholderTextColor="#999"
            />
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>LOCATION</Text>
          <View style={styles.row}>
            <View style={styles.formGroup}>
                <View style={styles.inputContainer}>
                  <Icon name="location" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={locationFrom}
                    onChangeText={(text) => updateScheduleState({ locationFrom: text })}
                placeholder="From location"
                    placeholderTextColor="#999"
              />
                </View>
            </View>
            <View style={styles.formGroup}>
                <View style={styles.inputContainer}>
                  <Icon name="location" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={locationTo}
                    onChangeText={(text) => updateScheduleState({ locationTo: text })}
                placeholder="To location"
                    placeholderTextColor="#999"
              />
                </View>
              </View>
            </View>
          </View>

          {/* Dates Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>DATES</Text>
            <View style={styles.row}>
              <View style={styles.formGroup}>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowFromDatePicker(true)}
                >
                  <Text style={[styles.dateText, !fromDate && styles.datePlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Start date'}
                  </Text>
                  <Icon name="calendar" size={20} color="#A60F93" />
                </TouchableOpacity>
                {showFromDatePicker && (
                  <DateTimePicker
                    value={fromDate ? new Date(fromDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onFromDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              <View style={styles.formGroup}>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowToDatePicker(true)}
                >
                  <Text style={[styles.dateText, !toDate && styles.datePlaceholder]}>
                    {toDate ? formatDate(toDate) : 'End date'}
                  </Text>
                  <Icon name="calendar" size={20} color="#A60F93" />
                </TouchableOpacity>
                {showToDatePicker && (
                  <DateTimePicker
                    value={toDate ? new Date(toDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onToDateChange}
                    minimumDate={fromDate ? new Date(fromDate) : new Date()}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Plan Description Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>PLAN DESCRIPTION</Text>
            {days.map((day, index) => (
              <View key={day.id} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{`Day ${day.id}`}</Text>
                  <TouchableOpacity
                    style={styles.removeDayButton}
                    onPress={() => removeDay(day.id)}
                  >
                    <Icon name="close-circle" size={24} color="#e53935" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.dayInput}
                  placeholder={`Enter details for Day ${day.id}`}
                  value={day.description}
                  onChangeText={(text) => updateDayDetails(day.id, "description", text)}
                  multiline
                  placeholderTextColor="#999"
                />

                  <TouchableOpacity
                    onPress={() => openMapForDay(day.id)}
                  style={styles.mapButton}
                >
                    <Icon name="location-sharp" size={24} color="white" />
                    <Text style={styles.mapButtonText}>Select Location</Text>
                  </TouchableOpacity>

                {day.latitude && day.longitude && (
                <MapView
                  style={styles.map}
                  initialRegion={{
                      latitude: parseFloat(day.latitude),
                      longitude: parseFloat(day.longitude),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                    <Marker
                      coordinate={{
                        latitude: parseFloat(day.latitude),
                        longitude: parseFloat(day.longitude),
                      }}
                    />
                  </MapView>
                )}

                <View style={styles.timeContainer}>
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => openTimePicker(index, 'start')}
                  >
                    <Text style={styles.timeText}>
                      Start: {day.startTime || "09:00"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => openTimePicker(index, 'end')}
                  >
                    <Text style={styles.timeText}>
                      End: {day.endTime || "17:00"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addDayButton} onPress={addDay}>
              <Icon name="add-circle" size={24} color="#A60F93" />
              <Text style={styles.addDayButtonText}>Add Another Day</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
             <LinearGradient
              colors={['#A60F93', '#8B0B7D', '#6D0861']}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Creating...' : 'Create Schedule'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={fromDate ? new Date(fromDate) : new Date()}
          mode="date"
          display="default"
          onChange={onFromDateChange}
        />
      )}
      {showToDatePicker && (
        <DateTimePicker
          value={toDate ? new Date(toDate) : new Date()}
          mode="date"
          display="default"
          onChange={onToDateChange}
        />
      )}

      {/* Add Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeSelect}
        />
      )}

      {/* Loader */}
      {isLoading && <CustomLoader message="Creating your schedule..." />}
    </KeyboardAvoidingView>
  );
}

export default MakeSchedule;
