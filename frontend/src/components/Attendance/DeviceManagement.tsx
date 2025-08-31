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
  Grid,
} from "@chakra-ui/react";
import { useCustomToast } from '@/hooks/useCustomToast';
import { AttendanceService } from '@/client';
import type { ZKTecoDevicePublic } from '@/client/types.gen';
import { AppTable } from '@/components/ui/table';
import { AppModal } from '@/components/ui/modal';

interface DeviceManagementProps {
  onRefresh: () => void;
}

export const DeviceManagement: React.FC<DeviceManagementProps> = ({ onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDevice, setSelectedDevice] = useState<ZKTecoDevicePublic | null>(null);
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

  // Mutations
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

  const restartDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => AttendanceService.restartDevice({ deviceId }),
    onSuccess: () => {
      showToast('Success', 'Device restart initiated', 'success');
      queryClient.invalidateQueries({ queryKey: ["zkteco-devices"] });
    },
    onError: () => {
      showToast('Error', 'Failed to restart device', 'error');
    },
  });

  const clearAttendanceMutation = useMutation({
    mutationFn: (deviceId: string) => AttendanceService.clearDeviceAttendance({ deviceId }),
    onSuccess: () => {
      showToast('Success', 'Device attendance cleared', 'success');
      queryClient.invalidateQueries({ queryKey: ["zkteco-devices"] });
    },
    onError: () => {
      showToast('Error', 'Failed to clear device attendance', 'error');
    },
  });

  // Helper functions
  const getStatusBadge = (status: string | undefined) => {
    const colorScheme = status === 'online' ? 'green' : 
                       status === 'offline' ? 'red' : 
                       status === 'error' ? 'orange' : 'gray';
    return (
      <Badge colorScheme={colorScheme} variant="subtle">
        {status}
      </Badge>
    );
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getLastSyncText = (lastSync?: string) => {
    if (!lastSync) return 'Never';
    const now = new Date();
    const syncTime = new Date(lastSync);
    const diffMs = now.getTime() - syncTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Filter devices
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = !searchTerm || 
        device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.device_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.location && device.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = !statusFilter || device.device_status === statusFilter;
      const matchesLocation = !locationFilter || device.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [devices, searchTerm, statusFilter, locationFilter]);

  // Table columns
  const columns = [
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
      key: 'location',
      label: 'Location',
      render: (value: any, row: ZKTecoDevicePublic) => (
        <Text>{row.location || 'Not specified'}</Text>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any, row: ZKTecoDevicePublic) => getStatusBadge(row.device_status || 'unknown'),
    },
    {
      key: 'last_sync',
      label: 'Last Sync',
      render: (value: any, row: ZKTecoDevicePublic) => (
        <VStack align="start" gap={0}>
          <Text fontSize="sm">{getLastSyncText(row.last_sync || undefined)}</Text>
          {row.last_sync && (
            <Text fontSize="xs" color="gray.500">
              {formatDateTime(row.last_sync)}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      key: 'sync_interval',
      label: 'Sync Interval',
      render: (value: any, row: ZKTecoDevicePublic) => (
        <Text>{row.sync_interval} minutes</Text>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: ZKTecoDevicePublic) => (
        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedDevice(row);
              onOpen();
            }}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSyncDevice(row.id)}
            loading={syncDeviceMutation.isPending}
          >
            Sync
          </Button>
        </HStack>
      ),
      width: "150px",
    },
  ];

  // Filter options
  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Online', value: 'online' },
    { label: 'Offline', value: 'offline' },
    { label: 'Error', value: 'error' },
  ];

  const locationOptions = [
    { label: 'All Locations', value: '' },
    ...Array.from(new Set(devices.map(d => d.location).filter(Boolean))).map(location => ({
      label: location!,
      value: location!,
    })),
  ];

  // Device actions
  const handleSyncDevice = (deviceId: string) => {
    syncDeviceMutation.mutate(deviceId);
  };

  const handleConnectDevice = (deviceId: string) => {
    connectDeviceMutation.mutate(deviceId);
  };

  const handleRestartDevice = (deviceId: string) => {
    restartDeviceMutation.mutate(deviceId);
  };

  const handleClearAttendance = (deviceId: string) => {
    clearAttendanceMutation.mutate(deviceId);
  };

  const handleAddDevice = () => {
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
            <Text fontSize="xl" fontWeight="bold" color="gray.800">Device Management</Text>
            <Text fontSize="sm" color="gray.600">
              Manage ZKTeco devices and monitor sync status
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
              onClick={handleAddDevice}
            >
              Add Device
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
              <Text fontSize="sm" fontWeight="medium" mb={2}>Search Device</Text>
              <Input
                placeholder="Search by device name, IP, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
          </Flex>
          
          <HStack justify="end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setLocationFilter("");
              }}
            >
              Clear Filters
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Devices Table */}
      <AppTable
        data={filteredDevices}
        columns={columns}
        isLoading={devicesLoading}
        searchPlaceholder="Search devices..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        emptyMessage="No devices found"
      />

      {/* Device Details Modal */}
      {selectedDevice && (
        <AppModal
          isOpen={isOpen}
          onClose={onClose}
          title={`${selectedDevice.device_name} - Device Details`}
          size="xl"
        >
          <VStack gap={6} align="stretch">
            {/* Device Info */}
            <Box bg="gray.50" p={4} borderRadius="md">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Device Name</Text>
                  <Text fontSize="md" fontWeight="medium">{selectedDevice.device_name}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Device ID</Text>
                  <Text fontSize="md" fontWeight="medium">{selectedDevice.device_id}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>IP Address</Text>
                  <Text fontSize="md" fontWeight="medium">{selectedDevice.device_ip}:{selectedDevice.device_port}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Location</Text>
                  <Text fontSize="md" fontWeight="medium">{selectedDevice.location || 'Not specified'}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Status</Text>
                  {getStatusBadge(selectedDevice.device_status)}
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Sync Interval</Text>
                  <Text fontSize="md" fontWeight="medium">{selectedDevice.sync_interval} minutes</Text>
                </Box>
              </Grid>
            </Box>

            {/* Device Actions */}
            <Box>
              <Text fontSize="md" fontWeight="bold" mb={4}>Device Actions</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Button
                  colorScheme="blue"
                  onClick={() => handleConnectDevice(selectedDevice.id)}
                  loading={connectDeviceMutation.isPending}
                  size="lg"
                >
                  Connect Device
                </Button>
                <Button
                  colorScheme="green"
                  onClick={() => handleSyncDevice(selectedDevice.id)}
                  loading={syncDeviceMutation.isPending}
                  size="lg"
                >
                  Sync Attendance
                </Button>
                <Button
                  colorScheme="orange"
                  onClick={() => handleRestartDevice(selectedDevice.id)}
                  loading={restartDeviceMutation.isPending}
                  size="lg"
                >
                  Restart Device
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => handleClearAttendance(selectedDevice.id)}
                  loading={clearAttendanceMutation.isPending}
                  size="lg"
                >
                  Clear Attendance
                </Button>
              </Grid>
            </Box>

            {/* Sync Information */}
            <Box>
              <Text fontSize="md" fontWeight="bold" mb={4}>Sync Information</Text>
              <VStack align="start" gap={3}>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Last Sync</Text>
                  <Text fontSize="md">
                    {selectedDevice.last_sync ? formatDateTime(selectedDevice.last_sync) : 'Never'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Description</Text>
                  <Text fontSize="md">
                    {selectedDevice.description || 'No description provided'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Active Status</Text>
                  <Badge colorScheme={selectedDevice.is_active ? 'green' : 'red'} variant="subtle">
                    {selectedDevice.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </AppModal>
      )}

      {/* Add Device Modal */}
      <AppModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Device"
        size="md"
      >
        <VStack gap={4} align="stretch">
          <Text fontSize="sm" color="gray.600">
            To add a new ZKTeco device, go to the Devices page and use the "Add Device" functionality.
          </Text>
          
          <Box bg="blue.50" p={4} borderRadius="md">
            <Text fontSize="sm" fontWeight="medium" color="blue.800" mb={2}>
              Device Requirements:
            </Text>
            <VStack align="start" gap={1} fontSize="sm" color="blue.700">
              <Text>• ZKTeco device with network connectivity</Text>
              <Text>• Device IP address and port (default: 4370)</Text>
              <Text>• Device serial number/ID</Text>
              <Text>• Location assignment</Text>
            </VStack>
          </Box>
          
          <Button
            colorScheme="blue"
            onClick={() => {
              setIsAddModalOpen(false);
              // Navigate to devices page
              window.location.href = '/devices';
            }}
          >
            Go to Devices Page
          </Button>
        </VStack>
      </AppModal>
    </Box>
  );
}; 