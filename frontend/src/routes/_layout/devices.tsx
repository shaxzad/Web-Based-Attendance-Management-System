import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Container,
  HStack,
  Heading,
  Text,
  VStack,
  Button,
} from "@chakra-ui/react";
import { useCustomToast } from '@/hooks/useCustomToast';
import { createFileRoute } from '@tanstack/react-router';
import { AttendanceService } from '@/client';
import type { ZKTecoDevicePublic } from '@/client/types.gen';
import { AddDevice } from '@/components/Devices/AddDevice';
import { DeviceDetails } from '@/components/Devices/DeviceDetails';
import { AppTable, createStatusColumn } from '@/components/ui/table';

// Animation styles
const fadeIn = "opacity 0.3s ease-out"
const slideIn = "transform 0.4s ease-out"
const pulse = "transform 2s infinite"

const DevicesPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<ZKTecoDevicePublic | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { showToast } = useCustomToast();

  // Color values
  const bgColor = "gray.50"
  const cardBg = "white"
  const borderColor = "gray.200"
  const textColor = "gray.800"
  const mutedTextColor = "gray.600"

  const {
    data: devicesResponse,
    isLoading,
    error,
    refetch: loadDevices
  } = useQuery({
    queryKey: ["zkteco-devices"],
    queryFn: () => AttendanceService.readZktecoDevices(),
  })

  const devices = devicesResponse?.data || []

  // Filter devices based on search and filter criteria
  const filteredDevices = useMemo(() => {
    if (!devices || devices.length === 0) {
      return []
    }

    let filtered = [...devices]

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((device: ZKTecoDevicePublic) => 
        device.device_name?.toLowerCase().includes(term) ||
        device.device_ip?.toLowerCase().includes(term) ||
        device.device_id?.toLowerCase().includes(term) ||
        device.location?.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((device: ZKTecoDevicePublic) => {
        if (statusFilter === "online") return device.device_status === 'online'
        if (statusFilter === "offline") return device.device_status === 'offline'
        if (statusFilter === "active") return device.is_active === true
        if (statusFilter === "inactive") return device.is_active === false
        return true
      })
    }

    return filtered
  }, [devices, searchTerm, statusFilter])

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await AttendanceService.syncAllDevices();
      showToast('Success', 'Sync completed successfully', 'success');
      loadDevices();
    } catch (error) {
      showToast('Error', 'Failed to sync all devices', 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  if (error) {
    console.error("Error loading devices:", error)
  }

  // Define table columns
  const columns = [
    { key: 'id', label: '#' },
    { 
      key: 'device_name', 
      label: 'Device Name',
      render: (value: string, row: ZKTecoDevicePublic) => (
        <HStack gap={4} align="center">
          <Box 
            p={3} 
            bg={row.device_status === 'online' ? "green.50" : "red.50"} 
            borderRadius="full"
            w="50px" 
            h="50px" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            <Text fontSize="20px" color={row.device_status === 'online' ? "#10b981" : "#ef4444"} fontWeight="bold">
              {row.device_status === 'online' ? 'O' : 'X'}
            </Text>
          </Box>
          <VStack align="start" gap={1}>
            <Text fontSize="lg" fontWeight="700" color={textColor}>
              {value}
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
              {row.device_ip}:{row.device_port}
            </Text>
            <Text fontSize="xs" color={mutedTextColor}>
              ID: {row.device_id}
            </Text>
            {row.location && (
              <Text fontSize="xs" color={mutedTextColor}>
                Location: {row.location}
              </Text>
            )}
          </VStack>
        </HStack>
      )
    },
    { 
      key: 'device_ip', 
      label: 'IP Address',
      render: (value: string) => (
        <Text fontSize="sm" color={textColor} fontWeight="500">
          {value}
        </Text>
      )
    },
    { 
      key: 'device_port', 
      label: 'Port',
      render: (value: string) => (
        <Text fontSize="sm" color={textColor} fontWeight="500">
          {value}
        </Text>
      )
    },
    { 
      key: 'device_status', 
      label: 'Connection Status',
      render: (value: string) => (
        <Badge 
          colorScheme={value === 'online' ? "green" : "red"}
          variant="subtle" 
          size="md"
          borderRadius="lg"
          px={3}
          py={1}
        >
          {value}
        </Badge>
      )
    },
    createStatusColumn('is_active', 'Active Status'),
    { 
      key: 'actions', 
      label: 'Actions',
      width: "120px",
      render: (value: any, row: ZKTecoDevicePublic) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedDevice(row)}
        >
          View
        </Button>
      )
    }
  ]

  // Filter options
  const filterOptions = [
    { label: "All Status", value: "all" },
    { label: "Online Only", value: "online" },
    { label: "Offline Only", value: "offline" },
    { label: "Active Only", value: "active" },
    { label: "Inactive Only", value: "inactive" },
  ]

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="7xl" py={8}>
        <Box flex={1}>
          <VStack gap={8} align="stretch">
            {/* Header Section */}
            <Box animation={`${slideIn} 0.4s ease-out`}>
              <HStack justify="space-between" align="center" mb={6}>
                <HStack gap={4}>
                  <Box 
                    p={4} 
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                    borderRadius="xl"
                    boxShadow="lg"
                    animation={`${pulse} 2s infinite`}
                  >
                    <Text fontSize="28px" color="white" fontWeight="bold">D</Text>
                  </Box>
                  <VStack align="start" gap={2}>
                    <Heading size="lg" color={textColor}>Device Management</Heading>
                    <Text color={mutedTextColor} fontSize="md" fontWeight="medium">
                      Manage ZKTeco fingerprint devices and sync attendance data
                    </Text>
                  </VStack>
                </HStack>
                <HStack gap={3}>
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    size="lg"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="gray"
                    size="lg"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    Settings
                  </Button>
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleSyncAll}
                    disabled={isSyncingAll}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    {isSyncingAll ? "Syncing..." : "Sync All"}
                  </Button>
                  <AddDevice onDeviceAdded={loadDevices} />
                </HStack>
              </HStack>
              
              {/* Enhanced Stats Cards */}
              <HStack gap={6} mb={8}>
                <Box 
                  bg={cardBg} 
                  p={6} 
                  borderRadius="xl" 
                  border="1px solid" 
                  borderColor={borderColor} 
                  flex={1} 
                  boxShadow="lg"
                  _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
                  transition="all 0.3s ease"
                  animation={`${fadeIn} 0.5s ease-out`}
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    height="4px"
                    bg="linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
                  />
                  <HStack justify="space-between">
                    <VStack align="start" gap={2}>
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Total Devices</Text>
                      <Text fontSize="3xl" fontWeight="bold" color={textColor}>{devices?.length || 0}</Text>
                      <Text fontSize="xs" color="blue.500">All ZKTeco devices</Text>
                    </VStack>
                    <Box p={3} bg="blue.50" borderRadius="xl">
                      <Text fontSize="24px" color="#3182ce" fontWeight="bold">D</Text>
                    </Box>
                  </HStack>
                </Box>

                <Box 
                  bg={cardBg} 
                  p={6} 
                  borderRadius="xl" 
                  border="1px solid" 
                  borderColor={borderColor} 
                  flex={1} 
                  boxShadow="lg"
                  _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
                  transition="all 0.3s ease"
                  animation={`${fadeIn} 0.6s ease-out`}
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    height="4px"
                    bg="linear-gradient(90deg, #10b981 0%, #059669 100%)"
                  />
                  <HStack justify="space-between">
                    <VStack align="start" gap={2}>
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Online Devices</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="green.600">
                        {devices?.filter(d => d.device_status === 'online').length || 0}
                      </Text>
                      <Text fontSize="xs" color="green.500">Connected</Text>
                    </VStack>
                    <Box p={3} bg="green.50" borderRadius="xl">
                      <Text fontSize="24px" color="#10b981" fontWeight="bold">O</Text>
                    </Box>
                  </HStack>
                </Box>

                <Box 
                  bg={cardBg} 
                  p={6} 
                  borderRadius="xl" 
                  border="1px solid" 
                  borderColor={borderColor} 
                  flex={1} 
                  boxShadow="lg"
                  _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
                  transition="all 0.3s ease"
                  animation={`${fadeIn} 0.7s ease-out`}
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    height="4px"
                    bg="linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"
                  />
                  <HStack justify="space-between">
                    <VStack align="start" gap={2}>
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Offline Devices</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="red.600">
                        {devices?.filter(d => d.device_status === 'offline').length || 0}
                      </Text>
                      <Text fontSize="xs" color="red.500">Disconnected</Text>
                    </VStack>
                    <Box p={3} bg="red.50" borderRadius="xl">
                      <Text fontSize="24px" color="#ef4444" fontWeight="bold">X</Text>
                    </Box>
                  </HStack>
                </Box>

                <Box 
                  bg={cardBg} 
                  p={6} 
                  borderRadius="xl" 
                  border="1px solid" 
                  borderColor={borderColor} 
                  flex={1} 
                  boxShadow="lg"
                  _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
                  transition="all 0.3s ease"
                  animation={`${fadeIn} 0.8s ease-out`}
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    height="4px"
                    bg="linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)"
                  />
                  <HStack justify="space-between">
                    <VStack align="start" gap={2}>
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Active Devices</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        {devices?.filter(d => d.is_active).length || 0}
                      </Text>
                      <Text fontSize="xs" color="purple.500">Enabled</Text>
                    </VStack>
                    <Box p={3} bg="purple.50" borderRadius="xl">
                      <Text fontSize="24px" color="#8b5cf6" fontWeight="bold">A</Text>
                    </Box>
                  </HStack>
                </Box>
              </HStack>
            </Box>

            {/* AppTable Component */}
            <AppTable
              data={filteredDevices}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Search devices by name, IP, ID, or location..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              filterOptions={filterOptions}
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              onShowFilters={() => setShowFilters(!showFilters)}
              showFilters={showFilters}
              emptyMessage="No devices found. Add your first ZKTeco device to start managing attendance data."
              actions={<AddDevice onDeviceAdded={loadDevices} />}
            />
          </VStack>
        </Box>
      </Container>

      {/* Device Details Modal */}
      {selectedDevice && (
        <DeviceDetails
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onRefresh={loadDevices}
        />
      )}
    </Box>
  );
};

export const Route = createFileRoute("/_layout/devices")({
  component: DevicesPage,
})

export default DevicesPage; 