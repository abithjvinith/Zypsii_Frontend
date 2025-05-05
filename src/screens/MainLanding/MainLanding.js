import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  Alert, 
  ScrollView, 
  ImageBackground, 
  TouchableOpacity, 
  NativeModules,
  Image,
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text
} from 'react-native';
import SwiperFlatList from 'react-native-swiper-flatlist';
import styles from './styles';
import CategoryCard from '../../ui/CategoryCard/CategoryCard';
import { BottomTab, TextDefault, TextError, Spinner, Hexagon } from '../../components';
import { verticalScale, scale, colors, alignment } from '../../utils';
import ProductCard from '../../ui/ProductCard/ProductCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSchedule } from '../../context/ScheduleContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Stories from '../../components/Stories/Stories';
import Post from '../../components/Posts/Post';
import DiscoverByNearest from '../../components/DiscoverByNearest/DiscoverByNearest';
import SkeletonLoader from '../../components/Loader/SkeletonLoader';
import { useFocusEffect } from '@react-navigation/native';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatusBar } from '../../utils/useStatusBar';
import ChatSupport from '../../components/ChatSupport/ChatSupport';
import FloatingSupportButton from '../../components/FloatingChatButton/FloatingChatButton';
import AllSchedule from '../MySchedule/Schedule/AllSchedule';
import RecommendCard from '../../components/Recommendation/RecommendCard';



function MainLanding(props) { 
  const navigation = useNavigation();
  const { scheduleData } = useSchedule();
  const [selectedButton, setSelectedButton] = useState('All');
  const buttons = ['All', 'Schedule', 'Shorts', 'Posts'];
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Loading states
  const [isDiscoverByInterestLoading, setIsDiscoverByInterestLoading] = useState(true);
  const [isBestDestinationLoading, setIsBestDestinationLoading] = useState(true);
  const [isAllDestinationLoading, setIsAllDestinationLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isShortsLoading, setIsShortsLoading] = useState(true);
  const [isNearestLoading, setIsNearestLoading] = useState(true);
  const [isStoriesLoading, setIsStoriesLoading] = useState(true);

  // Data states
  const [discover_by_intrest, setDiscover_by_intrest] = useState([]);
  const [best_destination, setBest_destination] = useState([]);
  const [all_destination, setAll_destination] = useState([]);
  const [all_schedule, setAll_schedule] = useState([]);
  const [all_posts, setAllPosts] = useState([]);
  const [all_shorts, setAllShorts] = useState([]);
  const [discoverbynearest, setDiscoverbyNearest] = useState([]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [shortsPagination, setShortsPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    totalPages: 0
  });

  // Back handler
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit?",
          [
            {
              text: "Cancel",
              onPress: () => null,
              style: "cancel"
            },
            { text: "YES", onPress: () => BackHandler.exitApp() }
          ]
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  // Add useEffect to fetch unread messages
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) return;

        const response = await fetch(`${base_url}/api/messages/unread`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadMessages(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();
  }, []);

  // Combined API calls in a single useEffect
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Set all loading states to true
        setIsDiscoverByInterestLoading(true);
        setIsBestDestinationLoading(true);
        setIsAllDestinationLoading(true);
        setIsScheduleLoading(true);
        setIsPostsLoading(true);
        setIsShortsLoading(true);
        setIsNearestLoading(true);

        // Get access token once for all authenticated requests
        const accessToken = await AsyncStorage.getItem('accessToken');
                if (!accessToken) {
          throw new Error('No access token found');
        }

        // Create a timeout promise
        const timeoutPromise = (ms) => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), ms)
        );

        // Make all API requests in parallel with timeout
        const [
          discoverByInterestResponse,
          bestDestinationResponse,
          allDestinationResponse,
          allScheduleResponse,
          allPostsResponse,
          allShortsResponse,
          discoverByNearestResponse
        ] = await Promise.all([
          Promise.race([
            fetch(`${base_url}/schedule/places/getNearest`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }),
            timeoutPromise(10000) // 10 second timeout
          ]),
          Promise.race([
            fetch(`${base_url}/schedule/places/getNearest?bestDestination=true`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }),
            timeoutPromise(10000)
          ]),
          Promise.race([
            fetch(`${base_url}/schedule/places/getNearest`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }),
            timeoutPromise(10000)
          ]),
          Promise.race([
            fetch(`${base_url}/schedule/listing/filter`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }),
            timeoutPromise(10000)
          ]),
          Promise.race([
            fetch(`${base_url}/post/listing/filter`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }),
            timeoutPromise(10000)
          ]),
          Promise.race([
            fetch(`${base_url}/schedule/places/getNearest`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }),
            timeoutPromise(10000)
          ]),
          Promise.race([
            fetch(`${base_url}/schedule/places/getNearest`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }),
            timeoutPromise(10000)
          ])
        ]);

        // Check if any response failed
        const responses = [
          discoverByInterestResponse,
          bestDestinationResponse,
          allDestinationResponse,
          allScheduleResponse,
          allPostsResponse,
          allShortsResponse,
          discoverByNearestResponse
        ];

        responses.forEach(response => {
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
        });

        // Process all responses
        const [
          discoverByInterestData,
          bestDestinationData,
          allDestinationData,
          allScheduleData,
          allPostsData,
          allShortsData,
          discoverByNearestData
        ] = await Promise.all([
          discoverByInterestResponse.json(),
          bestDestinationResponse.json(),
          allDestinationResponse.json(),
          allScheduleResponse.json(),
          allPostsResponse.json(),
          allShortsResponse.json(),
          discoverByNearestResponse.json()
        ]);

        // Set data for each response with proper empty state handling
        if (Array.isArray(discoverByInterestData?.data)) {
          setDiscover_by_intrest(discoverByInterestData.data.slice(0, 100).map(item => ({
            id: item._id || item.name,
            image: item.image,
            name: item.name
          })));
        } else {
          setDiscover_by_intrest([]);
        }

        if (Array.isArray(bestDestinationData?.data)) {
          setBest_destination(bestDestinationData.data.slice(0, 100).map(item => ({
            id: item._id || item.name,
            image: item.image,
            name: item.name,
            rating: item.rating,
            distanceInKilometer: item.distanceInKilometer
          })));
        } else {
          setBest_destination([]);
        }

        if (Array.isArray(allDestinationData?.data)) {
          setAll_destination(allDestinationData.data.slice(0, 100).map(item => ({
            id: item._id || item.name,
            image: item.image,
            name: item.name,
            rating: item.rating,
            distanceInKilometer: item.distanceInKilometer
          })));
        } else {
          setAll_destination([]);
        }

        if (Array.isArray(allScheduleData?.data)) {
          setAll_schedule(allScheduleData.data.map(item => ({
            id: item._id,
            title: item.tripName,
            from: (item.locationDetails?.[0]?.address 
              ? item.locationDetails[0].address.slice(0, 5) + '...'
              : 'Unknown'),
       
            to: (item.locationDetails?.[1]?.address 
            ? item.locationDetails[1].address.slice(0, 5) + '...'
            : 'Unknown'),
            date: new Date(item.Dates.from).toLocaleDateString(),
            endDate: new Date(item.Dates.end).toLocaleDateString(),
            travelMode: item.travelMode,
            visible: item.visible,
            numberOfDays: item.numberOfDays.toString(),
            imageUrl: item.bannerImage,
            locationDetails: item.locationDetails,
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            riders: '0 riders',
            joined: false,
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
          })));
        } else {
          setAll_schedule([]);
        }

        if (Array.isArray(allPostsData?.data)) {
          setAllPosts(allPostsData.data.map(item => {
            // Process mediaUrl array
            let mediaUrls = item.mediaUrl;
            
            // Handle string URLs
            if (typeof mediaUrls === 'string') {
              try {
                // Try to parse if it's a JSON string
                if (mediaUrls.startsWith('[')) {
                  mediaUrls = JSON.parse(mediaUrls);
                } else {
                  // Single URL string
                  mediaUrls = [mediaUrls];
                }
              } catch (e) {
                console.log('Error parsing mediaUrl:', e);
                mediaUrls = [mediaUrls];
              }
            }

            // Ensure mediaUrls is always an array
            if (!Array.isArray(mediaUrls)) {
              mediaUrls = [mediaUrls];
            }

            // Filter out null or undefined URLs
            mediaUrls = mediaUrls.filter(url => url != null);

            // Clean up URLs if needed
            mediaUrls = mediaUrls.map(url => {
              if (typeof url === 'string') {
                return url.replace(/\\/g, '').replace(/"/g, '');
              }
              return url;
            });

            return {
              _id: item._id,
              postTitle: item.postTitle,
              postType: item.postType,
              mediaType: item.mediaType,
              mediaUrl: mediaUrls,
              createdBy: item.createdBy,
              tags: Array.isArray(item.tags) ? item.tags : [],
              likesCount: item.likesCount || 0,
              commentsCount: item.commentsCount || 0,
              shareCount: item.shareCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            };
          }));
        } else {
          setAllPosts([]);
        }

        if (Array.isArray(allShortsData)) {
          setAllShorts(allShortsData.slice(0, 100).map(item => ({
            id: item.id,
            video: item.video.url,
            videoTitle: item.videoTitle,
            videoImage: item.videoImage,
            likes: item.likes,
            isLiked: item.isLiked
          })));
        } else {
          setAllShorts([]);
        }

        if (Array.isArray(discoverByNearestData?.data)) {
          const formattedData = discoverByNearestData.data.slice(0, 100).map(item => ({
            id: item._id || item.image,
            image: item.image,
            title: item.name,
            subtitle: item.address || 'No address',
            rating: parseFloat(item.rating) || 0,
            distance: item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null
          }));
          setDiscoverbyNearest(formattedData);
        } else {
          setDiscoverbyNearest([]);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays on error
        setDiscover_by_intrest([]);
        setBest_destination([]);
        setAll_destination([]);
        setAll_schedule([]);
        setAllPosts([]);
        setAllShorts([]);
        setDiscoverbyNearest([]);
        
        // Log specific error details
        if (error.message === 'Request timeout') {
          console.error('One or more API requests timed out');
        } else if (error.message === 'No access token found') {
          console.error('Authentication error: No access token found');
        } else {
          console.error('Network or server error:', error);
        }
      } finally {
        // Set all loading states to false after all data is processed
        setIsDiscoverByInterestLoading(false);
        setIsBestDestinationLoading(false);
        setIsAllDestinationLoading(false);
        setIsScheduleLoading(false);
        setIsPostsLoading(false);
        setIsShortsLoading(false);
        setIsNearestLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const fetchShorts = async () => {
    try {
      setIsShortsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${base_url}/shorts/listing`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shorts');
      }

      const data = await response.json();
      
      if (data.status) {
        const formattedShorts = data.data.map(short => ({
          id: short._id,
          title: short.title,
          description: short.description,
          videoUrl: short.videoUrl,
          thumbnailUrl: short.thumbnailUrl,
          createdBy: short.createdBy,
          viewsCount: short.viewsCount || 0,
          likesCount: short.likesCount || 0,
          commentsCount: short.commentsCount || 0,
          createdAt: short.createdAt,
          updatedAt: short.updatedAt
        }));
        
        setAllShorts(formattedShorts);
        setShortsPagination(data.pagination);
      } else {
        console.error('Failed to fetch shorts:', data.message);
        setAllShorts([]);
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setAllShorts([]);
    } finally {
      setIsShortsLoading(false);
    }
  };

  // Add pagination support
  const loadMoreShorts = async () => {
    if (isShortsLoading || !shortsPagination.hasNextPage) return;

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const nextPage = shortsPagination.currentPage + 1;
      
      const response = await fetch(`${base_url}/shorts/listing?page=${nextPage}&limit=${shortsPagination.limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch more shorts');
      }

      const data = await response.json();
      
      if (data.status) {
        const newShorts = data.data.map(short => ({
          id: short._id,
          title: short.title,
          description: short.description,
          videoUrl: short.videoUrl,
          thumbnailUrl: short.thumbnailUrl,
          createdBy: short.createdBy,
          viewsCount: short.viewsCount || 0,
          likesCount: short.likesCount || 0,
          commentsCount: short.commentsCount || 0,
          createdAt: short.createdAt,
          updatedAt: short.updatedAt
        }));
        
        setAllShorts(prevShorts => [...prevShorts, ...newShorts]);
        setShortsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading more shorts:', error);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  // Loader components
  const HorizontalListLoader = ({ count = 8 }) => (
    <View style={{ paddingVertical: 10 }}>
      <SkeletonLoader 
        count={count} 
        circleSize={80}
        textWidth={60}
        textHeight={12}
        containerStyle={{ paddingHorizontal: 8 }}
      />
    </View>
  );

  const VerticalListLoader = ({ count = 5 }) => (
    <View style={{ padding: 10 }}>
      {Array(count).fill(0).map((_, index) => (
        <View key={index} style={{ marginBottom: 20 }}>
          <SkeletonLoader 
            count={1} 
            circleSize={40}
            textWidth={'100%'}
            textHeight={100}
            containerStyle={{ paddingHorizontal: 0, alignItems: 'flex-start' }}
            circleStyle={{ marginBottom: 10 }}
            textStyle={{ borderRadius: 8, height: 150 }}
          />
        </View>
      ))}
    </View>
  );

  // Render functions
  const renderVideoShorts = () => (
    <View style={styles.titleSpacer}>
      <View style={styles.shortsHeader}>
        <TextDefault textColor={colors.fontMainColor} H4>
          {'Shorts'}
        </TextDefault>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('Drawer', { screen: 'ShortsUpload' })}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
      {isShortsLoading ? (
        <VerticalListLoader count={3} />
      ) : (
        <FlatList
          data={all_shorts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.shortItemContainer}
              onPress={() => navigation.navigate('ShortDetail', { short: item })}
            >
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={styles.shortThumbnail}
              />
              <View style={styles.shortInfoContainer}>
                <TextDefault textColor={colors.fontMainColor} H5 bold>
                  {item.title}
                </TextDefault>
                <TextDefault textColor={colors.fontSecondColor} H6 numberOfLines={2}>
                  {item.description}
                </TextDefault>
                <View style={styles.shortStatsContainer}>
                  <View style={styles.shortStat}>
                    <Ionicons name="eye-outline" size={16} color={colors.fontSecondColor} />
                    <TextDefault textColor={colors.fontSecondColor} H6>
                      {item.viewsCount}
                    </TextDefault>
                  </View>
                  <View style={styles.shortStat}>
                    <Ionicons name="heart-outline" size={16} color={colors.fontSecondColor} />
                    <TextDefault textColor={colors.fontSecondColor} H6>
                      {item.likesCount}
                    </TextDefault>
                  </View>
                  <View style={styles.shortStat}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.fontSecondColor} />
                    <TextDefault textColor={colors.fontSecondColor} H6>
                      {item.commentsCount}
                    </TextDefault>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={loadMoreShorts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            isShortsLoading && shortsPagination.hasNextPage ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.btncolor} />
              </View>
            ) : null
          )}
        />
      )}
    </View>
  );

  const renderScheduleContainer = () => {
    if (!all_schedule || all_schedule.length === 0) {
      return (
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleheadContainer}>
            <TextDefault textColor={colors.fontMainColor} H5 bold>
              {'Schedule'}
            </TextDefault>
            <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
              <TextDefault textColor={colors.btncolor} H5>
                {'View All'}
              </TextDefault>
            </TouchableOpacity>
          </View>
          <TextDefault style={{ marginLeft: 20, color: colors.fontSecondColor }}>
            No schedule available
          </TextDefault>
        </View>
      );
    }
  
    return (
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleheadContainer}>
          <TextDefault textColor={colors.fontMainColor} H5 bold>
            {'Schedule'}
          </TextDefault>
          <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
            <TextDefault textColor={colors.btncolor} H5>
              {'View All'}
            </TextDefault>
          </TouchableOpacity>
        </View>
  
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          data={all_schedule}
          // contentContainerStyle={{
          //   paddingHorizontal: 10,
          //   gap: 10
          // }}
          renderItem={({ item }) => (
            <View style={{ marginRight: 0 }}>
              <AllSchedule item={item} />
            </View>
          )}
        />
      </View>
    );
  };
  

  const renderDiscoverByInterest = () => (
    <View style={styles.titleSpaceredge}>


<RecommendCard  title="Itineraries Suggested by Interest" />
      {/* <TextDefault textColor={colors.fontMainColor} H5 bold style={styles.titleSpacer}>
        {'Discover by Interest'}
      </TextDefault>
      <View style={styles.seeAllTextContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('WhereToGo')}>
          <TextDefault textColor={colors.greenColor} H5 style={styles.seeAllText}>View All</TextDefault>
        </TouchableOpacity>
      </View>

      {isDiscoverByInterestLoading ? (
        <HorizontalListLoader count={8} />
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          data={discover_by_intrest?.slice(0, 8) || []}
          renderItem={({ item }) => (
            <CategoryCard
              id={item.id}
              icon={item.image}
              cardLabel={item.name}
              style={styles.categoryWrapper}
            />
          )}
        />
      )} */}

    
    </View>
  );

  const renderDiscoverByNearest = () => (
    <View style={styles.titleSpaceredge}>
      <TextDefault textColor={colors.fontMainColor} H5 bold style={styles.titleSpacernearest}>
        {'Discover by Nearest'}
      </TextDefault>
      <View style={styles.seeAllTextContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('DiscoverPlace')}>
          <TextDefault textColor={colors.greenColor} H5 style={styles.seeAllText}>View All</TextDefault>
        </TouchableOpacity>
      </View>

      {isNearestLoading ? (
        <HorizontalListLoader count={8} />
      ) : (
        <FlatList
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.id}
          data={discoverbynearest}
          renderItem={({ item, index }) => (
            <DiscoverByNearest 
              styles={styles.itemCardContainer} 
              {...item}
              rating={item.rating}
            />
          )}
        />
      )}
    </View>
  );

  const renderBestDestination = () => (
    <View style={styles.titleSpacerdesti}>
      <TextDefault textColor={colors.fontMainColor} H5 bold style={styles.titleSpacer}>
        {'Best Destination'}
      </TextDefault>
      <View style={styles.seeAllTextContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('WhereToGo')}>
          <TextDefault textColor={colors.greenColor} H5 style={styles.seeAllText}>View All</TextDefault>
        </TouchableOpacity>
      </View>

      {isBestDestinationLoading ? (
        <HorizontalListLoader count={8} />
      ) : (
        <FlatList
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.id}
          data={best_destination}
          renderItem={({ item, index }) => (
            <ProductCard 
              styles={styles.itemCardContainer} 
              {...item}
              rating={parseInt(item.rating) || 0}
              distance={item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null}
            />
          )}
        />
      )}
    </View>
  );

  const renderAllDestination = () => (
    <View style={styles.titleSpacer}>
      <TextDefault textColor={colors.fontMainColor} H4 bold>
        {'All Destination'}
      </TextDefault>
      {isAllDestinationLoading ? (
        <HorizontalListLoader count={8} />
      ) : (
        <FlatList
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          data={all_destination}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard 
              styles={styles.itemCardContainer} 
              {...item}
              rating={parseFloat(item.rating) || 0}
              distance={item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null}
            />
          )}
        />
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    return (
      <Post item={item} />
    );
  };

  const renderPosts = () => (
    <View style={styles.titleSpacer}>
      <TextDefault textColor={colors.fontMainColor} H4>
        {'Posts'}
      </TextDefault>
      {isPostsLoading ? (
        <VerticalListLoader count={5} />
      ) : (
        <FlatList
          data={all_posts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );

  const renderContent = () => {
    switch (selectedButton) {
      case 'Shorts':
        return isShortsLoading ? (
          <VerticalListLoader count={3} />
        ) : (
          renderVideoShorts()
        );
      case 'Schedule':
        return isScheduleLoading ? (
          <HorizontalListLoader count={5} />
        ) : (
          renderScheduleContainer()
        );
      case 'Posts':
        return isPostsLoading ? (
          <VerticalListLoader count={5} />
        ) : (
          renderPosts()
        );
      case 'All':
      default:
        return (
          <>
            {isScheduleLoading ? (
              <HorizontalListLoader count={5} />
            ) : (
              renderScheduleContainer()
            )}
            {isDiscoverByInterestLoading ? (
              <HorizontalListLoader count={8} />
            ) : (
              renderDiscoverByInterest()
            )}
            {isNearestLoading ? (
              <HorizontalListLoader count={8} />
            ) : (
              renderDiscoverByNearest()
            )}
            {isBestDestinationLoading ? (
              <HorizontalListLoader count={8} />
            ) : (
              renderBestDestination()
            )}
            {renderAllDestination()}
          </>
        );
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.locationWrapper}>
          <View style={styles.locationContainer}>
            <Image
              source={require('../../assets/zipsii.png')}
              style={styles.locationImage}
            />
            <TextDefault style={styles.locationText} H5 bold>Zypsii</TextDefault>
          </View>
        </View>
        <View style={styles.rightIconsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchPage')}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="search"
              size={28}
              color="#000"
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MessageList')}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="chat"
              size={28}
              color="#000"
              style={styles.icon}
            />
            {unreadMessages > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notification')}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="notifications-none"
              size={28}
              color="#000"
              style={styles.notificationIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Stories />

      <View style={styles.buttonContainer}>
        {buttons.map(button => (
          <TouchableOpacity
            key={button}
            style={[
              styles.button,
              selectedButton === button && styles.selectedButton
            ]}
            onPress={() => setSelectedButton(button)}
          >
            <TextDefault
              style={[
                styles.buttonText,
                selectedButton === button && styles.selectedButtonText
              ]}
            >
              {button}
            </TextDefault>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </>
  );

  useStatusBar(colors.btncolor, 'light-content');

  return (
    <SafeAreaView style={[styles.flex, styles.safeAreaStyle]}>
      <View style={[styles.grayBackground, styles.flex]}>
        <View style={[styles.contentContainer, { paddingBottom: 100 }]}>
          <FlatList
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            data={[]}
            renderItem={() => null}
            ListEmptyComponent={null}
          />
        </View>
        <View style={styles.bottomTabContainer}>
          <BottomTab screen="HOME" />
        </View>
      </View>
      <FloatingSupportButton onPress={() => setIsChatVisible(true)} />
      <ChatSupport
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />
    </SafeAreaView>
  );
}

export default MainLanding;
