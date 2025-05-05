import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

// API base URL
const API_BASE_URL = 'http://192.168.2.10:3030/api'; // For Android Emulator
// const API_BASE_URL = 'http://localhost:3030/api'; // For iOS Simulator
// const API_BASE_URL = 'http://your-actual-server.com/api'; // For production

// AddParticipantModal Component
const AddParticipantModal = ({ visible, onClose, onAddParticipant, existingParticipants }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${base_url}/user/getProfile?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Format the data to match our UI needs
        const formattedResults = data.data.map(user => ({
          _id: user._id,
          name: user.fullName,
          email: user.email,
          profileImage: user.profileImage || 'https://via.placeholder.com/50',
          userName: user.userName
        }));

        // Filter out users who are already participants
        const filteredResults = formattedResults.filter(user => 
          !existingParticipants.some(p => p.user._id === user._id)
        );
        
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onAddParticipant(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={colors.Zypsii_color} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Participant</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.fontMainColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.fontSecondColor} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.fontSecondColor}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.Zypsii_color} />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.searchResults}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No users found' : 'Start typing to search users'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const AddExpenseModal = ({ visible, onClose, onAddExpense }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedCategories = [
    'Food & Dining',
    'Transportation',
    'Accommodation',
    'Shopping',
    'Entertainment',
    'Utilities',
    'Other'
  ];

  const handleSubmit = async () => {
    // Validate inputs
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in description and amount');
      return;
    }

    if (!isCustomCategory && category === '') {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (isCustomCategory && !category.trim()) {
      Alert.alert('Error', 'Please enter a custom category');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const expenseData = {
        description: description.trim(),
        amount: parseFloat(amount),
        category: isCustomCategory ? category.trim() : predefinedCategories[parseInt(category)],
        date: new Date().toISOString(),
      };

      await onAddExpense(expenseData);
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setIsCustomCategory(false);
    } catch (error) {
      console.error('Error submitting expense:', error);
      Alert.alert(
        'Error',
        'Failed to add expense. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategorySection = () => (
    <View style={styles.categorySection}>
      <View style={styles.categoryToggleContainer}>
        <TouchableOpacity
          style={[
            styles.categoryToggleButton,
            !isCustomCategory && styles.categoryToggleButtonActive
          ]}
          onPress={() => setIsCustomCategory(false)}
        >
          <Text style={[
            styles.categoryToggleText,
            !isCustomCategory && styles.categoryToggleTextActive
          ]}>Select Category</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.categoryToggleButton,
            isCustomCategory && styles.categoryToggleButtonActive
          ]}
          onPress={() => setIsCustomCategory(true)}
        >
          <Text style={[
            styles.categoryToggleText,
            isCustomCategory && styles.categoryToggleTextActive
          ]}>Custom Category</Text>
        </TouchableOpacity>
      </View>

      {!isCustomCategory ? (
        <View style={styles.predefinedCategoriesContainer}>
          {predefinedCategories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryOption,
                category === index.toString() && styles.selectedCategory
              ]}
              onPress={() => setCategory(index.toString())}
            >
              <Text style={[
                styles.categoryText,
                category === index.toString() && styles.selectedCategoryText
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.customCategoryContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your custom category"
            value={category}
            onChangeText={setCategory}
            placeholderTextColor={colors.fontSecondColor}
          />
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.fontMainColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={colors.fontSecondColor}
              editable={!isSubmitting}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor={colors.fontSecondColor}
              editable={!isSubmitting}
            />

            {renderCategorySection()}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Add Expense</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function SplitDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { splitId } = route.params;

  // State for tabs
  const [activeTab, setActiveTab] = useState('participants');
  const [split, setSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddParticipantModalVisible, setIsAddParticipantModalVisible] = useState(false);
  const [isAddExpenseModalVisible, setIsAddExpenseModalVisible] = useState(false);

  // State for invite modal
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  useEffect(() => {
    fetchSplitDetails();
  }, [splitId]);

  const fetchSplitDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/splits/${splitId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSplit(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching split details:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch split details');
      setLoading(false);
    }
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDescription}>{item.description}</Text>
        <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
      </View>
      <View style={styles.expenseAmount}>
        <Text style={styles.amountText}>₹{item.amount}</Text>
        <Text style={styles.paidByText}>
          Paid by {split.participants.find(p => p.user._id === item.paidBy)?.user.email}
        </Text>
      </View>
    </View>
  );

  const renderParticipantItem = ({ item }) => (
    <View style={styles.participantItem}>
      <View style={styles.participantInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.user.email[0].toUpperCase()}</Text>
        </View>
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>{item.user.email}</Text>
          <Text style={styles.participantContact}>Amount: ₹{item.amount}</Text>
          <Text style={[
            styles.paymentStatus,
            { color: item.paid ? colors.greenColor : colors.error }
          ]}>
            {item.paid ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>
      {!item.paid && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => handleMarkAsPaid(item._id)}
        >
          <Text style={styles.payButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const handleAddExpense = async (expenseData) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/splits/${splitId}/expenses`, expenseData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSplit(response.data);
      setIsAddExpenseModalVisible(false);
      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleMarkAsPaid = async (participantId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/splits/${splitId}/participants/paid`, {
        participantId: participantId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchSplitDetails(); // Refresh the data
      Alert.alert('Success', 'Payment marked as completed');
    } catch (error) {
      console.error('Error marking payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark payment');
    }
  };

  const handleInviteFriend = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter email');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/splits/${splitId}/participants`, {
        email: inviteEmail.trim(),
        amount: split.totalAmount / (split.participants.length + 1)
        }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setInviteEmail('');
      setIsInviteModalVisible(false);
      fetchSplitDetails(); // Refresh the data
      Alert.alert('Success', 'Friend has been invited to the split');
    } catch (error) {
      console.error('Error inviting friend:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to invite friend');
    }
  };

  const handleAddParticipant = async (user) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/splits/${splitId}/participants`, {
        userId: user._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setIsAddParticipantModalVisible(false);
      fetchSplitDetails(); // Refresh the data
      Alert.alert('Success', 'Participant added successfully');
    } catch (error) {
      console.error('Error adding participant:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add participant');
    }
  };

  if (loading || !split) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{split.title}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddParticipantModalVisible(true)}
          >
            <Ionicons name="person-add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Total Expenses</Text>
        <Text style={styles.totalAmount}>₹{split.totalAmount}</Text>
        <Text style={styles.participantsText}>{split.participants.length} participants</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'participants' && styles.activeTab]}
          onPress={() => setActiveTab('participants')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'participants' ? colors.btncolor : colors.fontSecondColor} 
          />
          <Text style={[styles.tabText, activeTab === 'participants' && styles.activeTabText]}>
            Participants
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Ionicons 
            name="receipt-outline" 
            size={20} 
            color={activeTab === 'expenses' ? colors.btncolor : colors.fontSecondColor} 
          />
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'expenses' ? (
        <>
          <FlatList
            data={split.expenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No expenses added yet</Text>
              </View>
            }
          />
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setIsAddExpenseModalVisible(true)}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={split.participants}
          renderItem={renderParticipantItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <AddParticipantModal
        visible={isAddParticipantModalVisible}
        onClose={() => setIsAddParticipantModalVisible(false)}
        onAddParticipant={handleAddParticipant}
        existingParticipants={split?.participants || []}
      />

      <Modal
        visible={isInviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsInviteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Friend</Text>
            <TextInput
              style={styles.input}
              placeholder="Friend's Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsInviteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.inviteButton]}
                onPress={handleInviteFriend}
              >
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddExpenseModal
        visible={isAddExpenseModalVisible}
        onClose={() => setIsAddExpenseModalVisible(false)}
        onAddExpense={handleAddExpense}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.btncolor,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: colors.grayBackground,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: colors.fontSecondColor,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  participantsText: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 8,
  },
  activeTab: {
    borderBottomColor: colors.btncolor,
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  activeTabText: {
    color: colors.btncolor,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.grayBackground,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  participantContact: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
  removeButton: {
    padding: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.grayBackground,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  paidByText: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  modalBody: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.fontMainColor,
    height: 40,
  },
  searchResults: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: colors.grayBackground,
  },
  inviteButton: {
    backgroundColor: colors.btncolor,
  },
  cancelButtonText: {
    color: colors.fontMainColor,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  payButton: {
    backgroundColor: colors.btncolor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  payButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  expenseCategory: {
    fontSize: 12,
    color: colors.fontSecondColor,
    marginTop: 4,
  },
  categorySection: {
    marginVertical: 16,
  },
  categoryToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  categoryToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  categoryToggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  categoryToggleText: {
    fontSize: 14,
    color: colors.fontSecondColor,
    fontWeight: '500',
  },
  categoryToggleTextActive: {
    color: colors.btncolor,
    fontWeight: '600',
  },
  predefinedCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
    minWidth: '48%',
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: colors.btncolor,
    borderColor: colors.btncolor,
  },
  categoryText: {
    fontSize: 14,
    color: colors.fontMainColor,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: colors.white,
  },
  customCategoryContainer: {
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: colors.btncolor,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
});

export default SplitDetail; 