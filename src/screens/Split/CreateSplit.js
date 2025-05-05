import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

function CreateSplit() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [participants, setParticipants] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateSplit = async () => {
    if (!title || !totalAmount || !participants || !date) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const accessToken = await AsyncStorage.getItem('accessToken');
    setLoading(true);
    try {
      // Get user info from token
      const userInfo = JSON.parse(await AsyncStorage.getItem('user'));
      
      if (!userInfo || !userInfo._id) {
        throw new Error('User information not found');
      }

      // Calculate amount per participant
      const amountPerPerson = parseFloat(totalAmount) / parseInt(participants);

      // Create initial participants array with the creator
      const initialParticipants = [{
        user: {
          _id: userInfo._id,
          email: userInfo.email
        },
        amount: amountPerPerson,
        paid: false
      }];

      const splitData = {
        title,
        totalAmount: parseFloat(totalAmount),
        participants: initialParticipants
      };

      console.log('Creating split with data:', splitData);

      const response = await axios.post(`${base_url}/api/splits`, splitData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      Alert.alert('Success', 'Split created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('SplitDashboard'),
        },
      ]);
    } catch (error) {
      console.error('Error creating split:', error);
      Alert.alert('Error', error.message || error.response?.data?.message || 'Failed to create split');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Split</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter split title"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Total Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter total amount"
            keyboardType="numeric"
            value={totalAmount}
            onChangeText={setTotalAmount}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Number of Participants</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter number of participants"
            keyboardType="numeric"
            value={participants}
            onChangeText={setParticipants}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateSplit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create Split</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.themeBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.fontMainColor,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  createButton: {
    backgroundColor: colors.Zypsii_color,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default CreateSplit; 