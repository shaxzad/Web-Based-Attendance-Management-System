import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Button,
  Input,
  Flex,
  useDisclosure,
} from "@chakra-ui/react";
import { useCustomToast } from '@/hooks/useCustomToast';
import { AttendanceService } from '@/client';
import type { ZKTecoDevicePublic } from '@/client/types.gen';
import { AppTable } from '@/components/ui/table';
import { AppModal } from '@/components/ui/modal';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  description?: string;
  deviceCount: number;
  isActive: boolean;
}

interface LocationManagementProps {
  onRefresh: () => void;
}

export const LocationManagement: React.FC<LocationManagementProps> = ({ onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useCustomToast();
  const queryClient = useQueryClient();

  // Fetch devices data
  const {
    data: devicesResponse,
    isLoading: devicesLoading,
    error: devicesError,
  } = useQuery({
    queryKey: ["zkteco-devices"],
    queryFn: () => AttendanceService.readZktecoDevices(),
  });

  const devices = devicesResponse?.data || [];

  // Generate locations from devices data
  const locations = useMemo(() => {
    const locationMap = new Map<string, Location>();
    
    devices.forEach(device => {
      const locationKey = device.location || 'Unknown Location';
      
      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, {
          id: locationKey,
          name: locationKey,
          address: `${device.device_name} - ${device.device_ip}`,
          city: 'Unknown',
          country: 'Unknown',
          postalCode: 'Unknown',
          description: device.description || undefined,
          deviceCount: 0,
          isActive: true,
        });
      }
      
      const location = locationMap.get(locationKey)!;
      location.deviceCount++;
    });
    
    return Array.from(locationMap.values());
  }, [devices]);

  // Helper functions
  const getLocationDevices = (locationName: string) => {
    return devices.filter(device => device.location === locationName);
  };

  const getDeviceStatusBadge = (status: string | undefined) => {
    const colorScheme = status === 'online' ? 'green' : 
                       status === 'offline' ? 'red' : 'yellow';
    return (
      <Badge colorScheme={colorScheme} variant="subtle">
        {status}
      </Badge>
    );
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const matchesSearch = !searchTerm || 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || location.name === locationFilter;
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && location.isActive) ||
        (statusFilter === 'inactive' && !location.isActive);

      return matchesSearch && matchesLocation && matchesStatus;
    });
  }, [locations, searchTerm, locationFilter, statusFilter]);

  // Table columns for locations
  const locationColumns = [
    {
      key: 'name',
      label: 'Location Name',
      render: (value: any, row: Location) => (
        <VStack align="start" gap={0}>
          <Text fontWeight="medium">{row.name}</Text>
          <Text fontSize="sm" color="gray.500">{row.address}</Text>
        </VStack>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (value: any, row: Location) => row.city,
    },
    {
      key: 'deviceCount',
      label: 'Devices',
      render: (value: any, row: Location) => (
        <HStack gap={2}>
          <Text fontWeight="bold">{row.deviceCount}</Text>
          <Text fontSize="sm" color="gray.500">devices</Text>
        </HStack>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any, row: Location) => (
        <Badge colorScheme={row.isActive ? 'green' : 'red'} variant="subtle">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Location) => (
        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedLocation(row);
              onOpen();
            }}
          >
            View Devices
          </Button>
        </HStack>
      ),
      width: "120px",
    },
  ];

  // Table columns for devices in location
  const deviceColumns = [
    {
      key: 'device_name',
      label: 'Device Name',
      render: (value: any, row: ZKTecoDevicePublic) => (
        <VStack align="start" gap={0}>
          <Text fontWeight="medium">{row.device_name}</Text>
          <Text fontSize="sm" color="gray.500">ID: {row.device_id}</Text>
        </VStack>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (value: any, row: ZKTecoDevicePublic) => (
        <Text>{row.device_ip}:{row.device_port}</Text>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any, row: ZKTecoDevicePublic) => getDeviceStatusBadge(row.device_status || 'unknown'),
    },
    {
      key: 'last_sync',
      label: 'Last Sync',
      render: (value: any, row: ZKTecoDevicePublic) => 
        row.last_sync ? formatDateTime(row.last_sync) : 'Never',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: ZKTecoDevicePublic) => (
        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSyncDevice(row.id)}
          >
            Sync
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleConnectDevice(row.id)}
          >
            Connect
          </Button>
        </HStack>
      ),
      width: "150px",
    },
  ];

  // Filter options
  const locationOptions = [
    { label: 'All Locations', value: '' },
    ...locations.map(location => ({
      label: location.name,
      value: location.name,
    })),
  ];

  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  // Device actions
  const syncDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => AttendanceService.syncDeviceAttendance({ deviceId }),
    onSuccess: () => {
      showToast('Success', 'Device sync initiated', 'success');
      queryClient.invalidateQueries({ queryKey: ["zkteco-devices"] });
    },
    onError: () => {
      showToast('Error', 'Failed to sync device', 'error');
    },
  });

  const connectDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => AttendanceService.connectDevice({ deviceId }),
    onSuccess: () => {
      showToast('Success', 'Device connection initiated', 'success');
      queryClient.invalidateQueries({ queryKey: ["zkteco-devices"] });
    },
    onError: () => {
      showToast('Error', 'Failed to connect device', 'error');
    },
  });

  const handleSyncDevice = (deviceId: string) => {
    syncDeviceMutation.mutate(deviceId);
  };

  const handleConnectDevice = (deviceId: string) => {
    connectDeviceMutation.mutate(deviceId);
  };

  const handleAddLocation = () => {
    setIsAddModalOpen(true);
  };

  if (devicesError) {
    console.error("Error loading devices:", devicesError);
  }

  return (
    <Box>
      {/* Header */}
      <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.200" mb={6}>
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Text fontSize="xl" fontWeight="bold" color="gray.800">Location Management</Text>
            <Text fontSize="sm" color="gray.600">
              Manage office locations and device assignments
            </Text>
          </VStack>
          <HStack gap={3}>
            <Button
              variant="outline"
              onClick={onRefresh}
            >
              Refresh
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddLocation}
            >
              Add Location
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Filters */}
      <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.200" mb={6}>
        <VStack gap={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color="gray.800">Filters</Text>
          
          <Flex gap={4} wrap="wrap">
            <Box flex={1} minW="200px">
              <Text fontSize="sm" fontWeight="medium" mb={2}>Search Location</Text>
              <Input
                placeholder="Search by location name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Box>
            
            <Box minW="200px">
              <Text fontSize="sm" fontWeight="medium" mb={2}>Location</Text>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  fontSize: '14px',
                }}
              >
                {locationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Box>
            
            <Box minW="200px">
              <Text fontSize="sm" fontWeight="medium" mb={2}>Status</Text>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  fontSize: '14px',
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Box>
          </Flex>
          
          <HStack justify="end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setLocationFilter("");
                setStatusFilter("");
              }}
            >
              Clear Filters
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Locations Table */}
      <AppTable
        data={filteredLocations}
        columns={locationColumns}
        isLoading={devicesLoading}
        searchPlaceholder="Search locations..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        emptyMessage="No locations found"
      />

      {/* Location Details Modal */}
      {selectedLocation && (
        <AppModal
          isOpen={isOpen}
          onClose={onClose}
          title={`${selectedLocation.name} - Device Details`}
          size="xl"
        >
          <VStack gap={6} align="stretch">
            {/* Location Info */}
            <Box bg="gray.50" p={4} borderRadius="md">
              <VStack align="start" gap={2}>
                <Text fontSize="lg" fontWeight="bold">{selectedLocation.name}</Text>
                <Text fontSize="sm" color="gray.600">{selectedLocation.address}</Text>
                <HStack gap={4}>
                  <Text fontSize="sm" color="gray.500">
                    City: {selectedLocation.city}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Country: {selectedLocation.country}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Devices: {selectedLocation.deviceCount}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Devices in this location */}
            <Box>
              <Text fontSize="md" fontWeight="bold" mb={4}>
                Devices at this location ({getLocationDevices(selectedLocation.name).length})
              </Text>
              
              <AppTable
                data={getLocationDevices(selectedLocation.name)}
                columns={deviceColumns}
                isLoading={devicesLoading}
                emptyMessage="No devices found at this location"
              />
            </Box>
          </VStack>
        </AppModal>
      )}

      {/* Add Location Modal */}
      <AppModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Location"
        size="md"
      >
        <VStack gap={4} align="stretch">
          <Text fontSize="sm" color="gray.600">
            To add a new location, first add a device and specify the location in the device settings.
          </Text>
          
          <Box bg="blue.50" p={4} borderRadius="md">
            <Text fontSize="sm" fontWeight="medium" color="blue.800" mb={2}>
              How to add a location:
            </Text>
            <VStack align="start" gap={1} fontSize="sm" color="blue.700">
              <Text>1. Go to Devices page</Text>
              <Text>2. Click "Add Device"</Text>
              <Text>3. Enter the location in the device form</Text>
              <Text>4. The location will appear here automatically</Text>
            </VStack>
          </Box>
        </VStack>
      </AppModal>
    </Box>
  );
}; 