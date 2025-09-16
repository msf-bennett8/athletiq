import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  Vibration,
  Animated,
  FlatList,
} from 'react-native';
import { 
  Card,
  Button,
  Chip,
  ProgressBar,
  Avatar,
  IconButton,
  FAB,
  Surface,
  Searchbar,
  Portal,
  Modal,
  Divider,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { BlurView } from '../../../components/shared/BlurView';
import { LinearGradient } from '../../../components/shared/LinearGradient';
//import { MaterialIcons as Icon } from '@expo/vector-icons';

// Import your design system constants
const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#4ade80',
  error: '#ef4444',
  warning: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const TEXT_STYLES = {
  heading1: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  heading2: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  heading3: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 16, color: COLORS.text },
  caption: { fontSize: 14, color: COLORS.textSecondary },
  small: { fontSize: 12, color: COLORS.textSecondary },
};

const { width } = Dimensions.get('window');

const ClientManagement = ({ navigation }) => {
  // Redux state
  const dispatch = useDispatch();
  const { clients, loading, error } = useSelector(state => state.clients || {});
  const { user } = useSelector(state => state.auth || {});

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Mock data for demonstration
  const [clientsData, setClientsData] = useState([
    {
      id: '1',
      name: 'John Smith',
      avatar: 'https://api.dicebear.com/7.x/avatars/png?seed=john',
      sport: 'Football',
      age: 16,
      joinDate: '2024-01-15',
      status: 'active',
      progress: 85,
      sessionsCompleted: 24,
      totalSessions: 30,
      lastSession: '2024-08-14',
      achievements: 5,
      level: 'Intermediate',
      monthlyRevenue: 120,
      paymentStatus: 'paid',
      notes: 'Shows great improvement in speed and agility.',
      parentContact: '+254700123456',
      goals: ['Improve speed', 'Build endurance', 'Team selection'],
    },
    {
      id: '2',
      name: 'Emma Johnson',
      avatar: 'https://api.dicebear.com/7.x/avatars/png?seed=emma',
      sport: 'Tennis',
      age: 14,
      joinDate: '2024-02-20',
      status: 'active',
      progress: 72,
      sessionsCompleted: 18,
      totalSessions: 24,
      lastSession: '2024-08-13',
      achievements: 3,
      level: 'Beginner',
      monthlyRevenue: 100,
      paymentStatus: 'paid',
      notes: 'Needs work on backhand technique.',
      parentContact: '+254700789012',
      goals: ['Master backhand', 'Improve serve', 'Tournament ready'],
    },
    {
      id: '3',
      name: 'David Wilson',
      avatar: 'https://api.dicebear.com/7.x/avatars/png?seed=david',
      sport: 'Basketball',
      age: 17,
      joinDate: '2024-03-10',
      status: 'inactive',
      progress: 45,
      sessionsCompleted: 12,
      totalSessions: 20,
      lastSession: '2024-07-28',
      achievements: 2,
      level: 'Intermediate',
      monthlyRevenue: 0,
      paymentStatus: 'overdue',
      notes: 'Missing sessions frequently. Need parent meeting.',
      parentContact: '+254700345678',
      goals: ['Improve shooting', 'Better attendance', 'Team play'],
    },
  ]);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Load clients data
    loadClientsData();
  }, []);

  const loadClientsData = async () => {
    try {
      // Simulate API call
      // dispatch(fetchClients());
      console.log('Loading clients data...');
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Vibration.vibrate(50);
    try {
      await loadClientsData();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filterClients = () => {
    let filtered = clientsData;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.sport.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(client => client.status === selectedFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        case 'joinDate':
          return new Date(b.joinDate) - new Date(a.joinDate);
        case 'revenue':
          return b.monthlyRevenue - a.monthlyRevenue;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'inactive': return COLORS.error;
      case 'trial': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return COLORS.success;
      case 'overdue': return COLORS.error;
      case 'pending': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const handleClientPress = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
    Vibration.vibrate(30);
  };

  const handleAddClient = () => {
    Alert.alert(
      'Add Client',
      'This feature is coming soon! You will be able to add new clients with detailed profiles.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleContactParent = (parentContact) => {
    Alert.alert(
      'Contact Parent',
      `Call ${parentContact}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {
          // Implement phone call functionality
          console.log('Calling parent:', parentContact);
        }},
      ]
    );
  };

  const renderClientCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.clientCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => handleClientPress(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            {/* Header */}
            <View style={styles.clientHeader}>
              <View style={styles.clientInfo}>
                <Avatar.Image
                  size={50}
                  source={{ uri: item.avatar }}
                  style={styles.avatar}
                />
                <View style={styles.clientDetails}>
                  <Text style={TEXT_STYLES.heading3}>{item.name}</Text>
                  <Text style={TEXT_STYLES.caption}>
                    {item.sport} • Age {item.age} • {item.level}
                  </Text>
                  <View style={styles.statusRow}>
                    <Chip
                      mode="outlined"
                      compact
                      style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
                      textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
                    >
                      {item.status.toUpperCase()}
                    </Chip>
                    <Chip
                      mode="outlined"
                      compact
                      style={[styles.paymentChip, { borderColor: getPaymentStatusColor(item.paymentStatus) }]}
                      textStyle={[styles.paymentText, { color: getPaymentStatusColor(item.paymentStatus) }]}
                    >
                      {item.paymentStatus.toUpperCase()}
                    </Chip>
                  </View>
                </View>
              </View>
              <IconButton
                icon="phone"
                size={24}
                iconColor={COLORS.primary}
                onPress={() => handleContactParent(item.parentContact)}
              />
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={TEXT_STYLES.body}>Training Progress</Text>
                <Text style={[TEXT_STYLES.caption, { color: COLORS.primary }]}>
                  {item.progress}%
                </Text>
              </View>
              <ProgressBar
                progress={item.progress / 100}
                color={COLORS.primary}
                style={styles.progressBar}
              />
              <Text style={TEXT_STYLES.small}>
                {item.sessionsCompleted} of {item.totalSessions} sessions completed
              </Text>
            </View>

            {/* Stats Grid - Simplified without icons */}
            <View style={styles.statsGrid}>
              <Surface style={styles.statCard}>
                <Text style={[TEXT_STYLES.caption, { fontWeight: 'bold' }]}>{item.achievements}</Text>
                <Text style={TEXT_STYLES.small}>Badges</Text>
              </Surface>
              <Surface style={styles.statCard}>
                <Text style={[TEXT_STYLES.caption, { fontWeight: 'bold' }]}>${item.monthlyRevenue}</Text>
                <Text style={TEXT_STYLES.small}>Monthly</Text>
              </Surface>
              <Surface style={styles.statCard}>
                <Text style={[TEXT_STYLES.caption, { fontWeight: 'bold' }]}>
                  {new Date(item.lastSession).toLocaleDateString()}
                </Text>
                <Text style={TEXT_STYLES.small}>Last Session</Text>
              </Surface>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Button
                mode="outlined"
                compact
                onPress={() => Alert.alert('Schedule Session', 'Feature coming soon!')}
                style={styles.actionButton}
              >
                Schedule
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => Alert.alert('Message', 'Feature coming soon!')}
                style={styles.actionButton}
              >
                Message
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => Alert.alert('View Reports', 'Feature coming soon!')}
                style={styles.actionButton}
              >
                Reports
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFilterModal = () => (
    <Portal>
      <Modal
        visible={showFilterModal}
        onDismiss={() => setShowFilterModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalBackground}>
          <Surface style={styles.modalContent}>
            <Text style={TEXT_STYLES.heading2}>Filter & Sort</Text>
            <Divider style={styles.divider} />

            <Text style={TEXT_STYLES.heading3}>Status Filter</Text>
            <View style={styles.filterChips}>
              {['all', 'active', 'inactive', 'trial'].map((filter) => (
                <Chip
                  key={filter}
                  selected={selectedFilter === filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={styles.filterChip}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Chip>
              ))}
            </View>

            <Text style={TEXT_STYLES.heading3}>Sort By</Text>
            <View style={styles.filterChips}>
              {[
                { key: 'name', label: 'Name' },
                { key: 'progress', label: 'Progress' },
                { key: 'joinDate', label: 'Join Date' },
                { key: 'revenue', label: 'Revenue' },
              ].map((sort) => (
                <Chip
                  key={sort.key}
                  selected={sortBy === sort.key}
                  onPress={() => setSortBy(sort.key)}
                  style={styles.filterChip}
                >
                  {sort.label}
                </Chip>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={() => setShowFilterModal(false)}
              style={styles.applyButton}
            >
              Apply Filters
            </Button>
          </Surface>
        </View>
      </Modal>
    </Portal>
  );

  const renderClientDetailModal = () => (
    <Portal>
      <Modal
        visible={showClientModal}
        onDismiss={() => setShowClientModal(false)}
        contentContainerStyle={styles.clientModalContainer}
      >
        <View style={styles.clientModalBackground}>
          {selectedClient && (
            <Surface style={styles.clientModalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Avatar.Image
                    size={80}
                    source={{ uri: selectedClient.avatar }}
                  />
                  <View style={styles.modalHeaderText}>
                    <Text style={TEXT_STYLES.heading2}>{selectedClient.name}</Text>
                    <Text style={TEXT_STYLES.body}>
                      {selectedClient.sport} • {selectedClient.level}
                    </Text>
                    <View style={styles.modalChips}>
                      <Chip
                        compact
                        style={[styles.modalStatusChip, { backgroundColor: getStatusColor(selectedClient.status) + '20' }]}
                        textStyle={{ color: getStatusColor(selectedClient.status) }}
                      >
                        {selectedClient.status.toUpperCase()}
                      </Chip>
                    </View>
                  </View>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setShowClientModal(false)}
                  />
                </View>

                <Divider style={styles.modalDivider} />

                {/* Goals Section */}
                <View style={styles.modalSection}>
                  <Text style={TEXT_STYLES.heading3}>Goals</Text>
                  {selectedClient.goals?.map((goal, index) => (
                    <Text key={index} style={[TEXT_STYLES.body, styles.goalItem]}>
                      • {goal}
                    </Text>
                  ))}
                </View>

                {/* Notes Section */}
                <View style={styles.modalSection}>
                  <Text style={TEXT_STYLES.heading3}>Coach Notes</Text>
                  <Text style={TEXT_STYLES.body}>{selectedClient.notes}</Text>
                </View>

                {/* Contact Section */}
                <View style={styles.modalSection}>
                  <Text style={TEXT_STYLES.heading3}>Parent Contact</Text>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleContactParent(selectedClient.parentContact)}
                  >
                    <Text style={[TEXT_STYLES.body, { color: COLORS.primary }]}>
                      {selectedClient.parentContact}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <Button
                    mode="contained"
                    onPress={() => Alert.alert('Edit Client', 'Feature coming soon!')}
                    style={styles.modalActionButton}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => Alert.alert('View Schedule', 'Feature coming soon!')}
                    style={styles.modalActionButton}
                  >
                    View Schedule
                  </Button>
                </View>
              </ScrollView>
            </Surface>
          )}
        </View>
      </Modal>
    </Portal>
  );

  const filteredClients = filterClients();

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header - Using View with gradient colors instead of LinearGradient */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Client Management</Text>
            <IconButton
              icon="filter-list"
              size={24}
              iconColor="white"
              onPress={() => setShowFilterModal(true)}
            />
          </View>
          
          {/* Stats Overview */}
          <View style={styles.statsOverview}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{clientsData.length}</Text>
              <Text style={styles.overviewLabel}>Total Clients</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>
                {clientsData.filter(c => c.status === 'active').length}
              </Text>
              <Text style={styles.overviewLabel}>Active</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>
                ${clientsData.reduce((sum, c) => sum + c.monthlyRevenue, 0)}
              </Text>
              <Text style={styles.overviewLabel}>Monthly Revenue</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search clients..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={COLORS.primary}
        />
      </View>

      {/* Clients List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={[TEXT_STYLES.heading3, { textAlign: 'center', marginTop: SPACING.md }]}>
              No clients found
            </Text>
            <Text style={[TEXT_STYLES.body, { textAlign: 'center', marginTop: SPACING.sm }]}>
              Add your first client to get started!
            </Text>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <FAB
        icon="person-add"
        style={styles.fab}
        onPress={handleAddClient}
        color="white"
      />

      {/* Modals */}
      {renderFilterModal()}
      {renderClientDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary, // Using solid color instead of gradient
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  headerContent: {
    marginTop: SPACING.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...TEXT_STYLES.heading1,
    color: 'white',
    fontSize: 28,
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  overviewCard: {
    alignItems: 'center',
    flex: 1,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  overviewLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchBar: {
    elevation: 2,
    backgroundColor: COLORS.surface,
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  clientCard: {
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  cardContent: {
    padding: SPACING.md,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  clientInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  clientDetails: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  statusChip: {
    marginRight: SPACING.sm,
    height: 24,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentChip: {
    height: 24,
  },
  paymentText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    width: width * 0.9,
    maxHeight: '80%',
  },
  divider: {
    marginVertical: SPACING.md,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: SPACING.sm,
  },
  filterChip: {
    margin: SPACING.xs,
  },
  applyButton: {
    marginTop: SPACING.lg,
  },
  clientModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    width: width * 0.95,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalHeaderText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  modalChips: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  modalStatusChip: {
    marginRight: SPACING.sm,
  },
  modalDivider: {
    marginHorizontal: SPACING.lg,
  },
  modalSection: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  goalItem: {
    marginVertical: SPACING.xs,
    paddingLeft: SPACING.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  modalActions: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  modalActionButton: {
    marginBottom: SPACING.sm,
  },
});

export default ClientManagement;