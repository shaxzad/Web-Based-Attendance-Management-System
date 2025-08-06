import React, { useState, useEffect } from 'react';
import {
  Button,
  Badge,
  Box,
  VStack,
  HStack,
  Text,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { AppModal } from '@/components/ui/modal';
import { useCustomToast } from '@/hooks/useCustomToast';
import { AttendanceService } from '@/client';
import type { ZKTecoDevicePublic } from '@/client/types.gen';

interface DeviceDetailsProps {
  device: ZKTecoDevicePublic;
  onClose: () => void;
  onRefresh: () => void;
}

export const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, onClose, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const { showToast } = useCustomToast();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await AttendanceService.connectDevice({ deviceId: device.id });
      showToast('Success', 'Device connected successfully', 'success');
      onRefresh();
    } catch (error) {
      showToast('Error', 'Failed to connect to device', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const result = await AttendanceService.syncDeviceAttendance({ deviceId: device.id });
      const recordsSynced = (result as any)?.records_synced || 0;
      showToast('Success', `Sync completed: ${recordsSynced} records synced`, 'success');
      onRefresh();
    } catch (error) {
      showToast('Error', 'Failed to sync device', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      await AttendanceService.restartDevice({ deviceId: device.id });
      showToast('Success', 'Device restart initiated', 'success');
      onRefresh();
    } catch (error) {
      showToast('Error', 'Failed to restart device', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAttendance = async () => {
    if (!confirm('Are you sure you want to clear all attendance data from this device?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await AttendanceService.clearDeviceAttendance({ deviceId: device.id });
      showToast('Success', 'Device attendance cleared', 'success');
      onRefresh();
    } catch (error) {
      showToast('Error', 'Failed to clear device attendance', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceInfo = async () => {
    try {
      const info = await AttendanceService.getDeviceInfo({ deviceId: device.id });
      setDeviceInfo(info);
    } catch (error) {
      console.error('Failed to get device info:', error);
    }
  };

  useEffect(() => {
    getDeviceInfo();
  }, [device.id]);

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'online':
        return <Badge colorScheme="green" size="lg">Online</Badge>;
      case 'offline':
        return <Badge colorScheme="red" size="lg">Offline</Badge>;
      case 'error':
        return <Badge colorScheme="yellow" size="lg">Error</Badge>;
      case 'syncing':
        return <Badge colorScheme="blue" size="lg">Syncing</Badge>;
      default:
        return <Badge colorScheme="gray" size="lg">Unknown</Badge>;
    }
  };

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={`${device.device_name} - Device Details`}
      size="xl"
    >
      <VStack gap={6} align="stretch">
        {/* Device Header */}
        <HStack gap={3}>
          <Box 
            p={2} 
            bg={device.device_status === 'online' ? "green.50" : "red.50"} 
            borderRadius="full"
            w="40px"
            h="40px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="16px" color={device.device_status === 'online' ? "#10b981" : "#ef4444"} fontWeight="bold">
              D
            </Text>
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="xl" fontWeight="bold">{device.device_name}</Text>
            <Text fontSize="sm" color="gray.500">{device.device_ip}:{device.device_port}</Text>
          </VStack>
        </HStack>

        {/* Device Status */}
        <Box p={4} bg="gray.50" borderRadius="lg">
          <HStack justify="space-between" align="center">
            <Text fontWeight="semibold">Device Status</Text>
            <HStack gap={2}>
              {getStatusBadge(device.device_status)}
              <Badge 
                colorScheme={device.is_active ? "blue" : "gray"} 
                size="lg"
              >
                {device.is_active ? "Active" : "Inactive"}
              </Badge>
            </HStack>
          </HStack>
        </Box>

        {/* Device Information */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={4}>Device Information</Text>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Device ID</Text>
              <Text fontWeight="medium">{device.device_id}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>IP Address</Text>
              <Text fontWeight="medium">{device.device_ip}:{device.device_port}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Location</Text>
              <Text fontWeight="medium">{device.location || 'Not specified'}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Sync Interval</Text>
              <Text fontWeight="medium">{device.sync_interval} minutes</Text>
            </Box>
          </Grid>
          
          {device.description && (
            <Box mt={4}>
              <Text fontSize="sm" color="gray.600" mb={1}>Description</Text>
              <Text>{device.description}</Text>
            </Box>
          )}
        </Box>

        {/* Divider */}
        <Box borderTop="1px solid" borderColor="gray.200" />

        {/* Device Statistics */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={4}>Device Statistics</Text>
          <HStack gap={4}>
            <Box 
              bg="blue.50" 
              p={4} 
              borderRadius="lg" 
              border="1px solid" 
              borderColor="blue.200" 
              flex={1}
            >
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">Sync Interval</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">{device.sync_interval}</Text>
                <Text fontSize="xs" color="blue.500">minutes</Text>
              </VStack>
            </Box>
            <Box 
              bg="green.50" 
              p={4} 
              borderRadius="lg" 
              border="1px solid" 
              borderColor="green.200" 
              flex={1}
            >
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">Last Sync</Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {device.last_sync ? new Date(device.last_sync).toLocaleDateString() : 'Never'}
                </Text>
                <Text fontSize="xs" color="green.500">
                  {device.last_sync ? new Date(device.last_sync).toLocaleTimeString() : ''}
                </Text>
              </VStack>
            </Box>
            <Box 
              bg="purple.50" 
              p={4} 
              borderRadius="lg" 
              border="1px solid" 
              borderColor="purple.200" 
              flex={1}
            >
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">Added Date</Text>
                <Text fontSize="lg" fontWeight="bold" color="purple.600">
                  {new Date(device.created_at).toLocaleDateString()}
                </Text>
                <Text fontSize="xs" color="purple.500">
                  {new Date(device.created_at).toLocaleTimeString()}
                </Text>
              </VStack>
            </Box>
          </HStack>
        </Box>

        {/* Divider */}
        <Box borderTop="1px solid" borderColor="gray.200" />

        {/* Device Actions */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={4}>Device Actions</Text>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              variant="outline"
              colorScheme="green"
              size="lg"
            >
              Connect Device
            </Button>
            <Button
              onClick={handleSync}
              disabled={isLoading}
              variant="outline"
              colorScheme="blue"
              size="lg"
            >
              Sync Attendance
            </Button>
            <Button
              onClick={handleRestart}
              disabled={isLoading}
              variant="outline"
              colorScheme="orange"
              size="lg"
            >
              Restart Device
            </Button>
            <Button
              onClick={handleClearAttendance}
              disabled={isLoading}
              variant="outline"
              colorScheme="red"
              size="lg"
            >
              Clear Attendance
            </Button>
          </Grid>
        </Box>

        {/* Device Info (if available) */}
        {deviceInfo && (
          <>
            {/* Divider */}
            <Box borderTop="1px solid" borderColor="gray.200" />
            
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>Device System Info</Text>
              <Box bg="gray.50" p={4} borderRadius="lg" maxH="200px" overflowY="auto">
                <pre className="text-sm">
                  {JSON.stringify(deviceInfo, null, 2)}
                </pre>
              </Box>
            </Box>
          </>
        )}
      </VStack>
    </AppModal>
  );
}; 