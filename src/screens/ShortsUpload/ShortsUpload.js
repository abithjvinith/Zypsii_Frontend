import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import styles from './Styles';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';

function ShortsUpload({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 30, // Limit to 30 seconds
      });

      if (!result.canceled) {
        setVideo(result.assets[0]);
        // Generate thumbnail from first frame
        setThumbnail(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const handleSubmit = async () => {
    if (!video) {
      Alert.alert('Error', 'Please select a video');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      setIsUploading(true);

      // First upload the video
      const videoFormData = new FormData();
      videoFormData.append('file', {
        uri: video.uri,
        type: 'video/mp4',
        name: 'video.mp4',
      });

      const videoUploadResponse = await fetch(`${base_url}/upload/video`, {
        method: 'POST',
        body: videoFormData,
      });

      if (!videoUploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      const videoData = await videoUploadResponse.json();
      const videoUrl = videoData.url;

      // Then upload the thumbnail
      const thumbnailFormData = new FormData();
      thumbnailFormData.append('file', {
        uri: thumbnail,
        type: 'image/jpeg',
        name: 'thumbnail.jpg',
      });

      const thumbnailUploadResponse = await fetch(`${base_url}/upload/image`, {
        method: 'POST',
        body: thumbnailFormData,
      });

      if (!thumbnailUploadResponse.ok) {
        throw new Error('Failed to upload thumbnail');
      }

      const thumbnailData = await thumbnailUploadResponse.json();
      const thumbnailUrl = thumbnailData.url;

      // Finally create the short
      const createShortResponse = await fetch(`${base_url}/shorts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          videoUrl,
          thumbnailUrl,
        }),
      });

      if (!createShortResponse.ok) {
        throw new Error('Failed to create short');
      }

      Alert.alert('Success', 'Short created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating short:', error);
      Alert.alert('Error', 'Failed to create short');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Short</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.videoContainer} onPress={pickVideo}>
          {video ? (
            <View style={styles.videoPreviewContainer}>
              <Video
                source={{ uri: video.uri }}
                style={styles.videoPreview}
                resizeMode="cover"
                shouldPlay={false}
                isMuted={true}
              />
              <View style={styles.videoOverlay}>
                <MaterialIcons name="play-circle-outline" size={50} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialIcons name="video-library" size={50} color={colors.btncolor} />
              <Text style={styles.placeholderText}>Select Video (max 30s)</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isUploading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Short</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ShortsUpload; 