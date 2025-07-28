import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Container,
  HStack,
  Heading,
  Skeleton,
  Text,
  VStack,
  Flex,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { useCustomToast } from '@/hooks/useCustomToast';
import { createFileRoute } from '@tanstack/react-router';
import { AttendanceService, EmployeesService } from '@/client';
import type { AttendancePublic, EmployeePublic, ZKTecoDevicePublic } from '@/client/types.gen';
import { AttendanceReports } from '@/components/Attendance/AttendanceReports';
import { AttendanceRecords } from '@/components/Attendance/AttendanceRecords';
import { LocationManagement } from '@/components/Attendance/LocationManagement';
import { DeviceManagement } from '@/components/Attendance/DeviceManagement';

// Animation styles
const fadeIn = "opacity 0.3s ease-out"
const slideIn = "transform 0.4s ease-out"
const pulse = "transform 2s infinite"

const AttendancePage: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("check_in_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeView, setActiveView] = useState<'records' | 'reports' | 'locations' | 'devices'>('records');
  const { showToast } = useCustomToast();

  // Color values
  const bgColor = "gray.50"
  const cardBg = "white"
  const borderColor = "gray.200"
  const textColor = "gray.800"
  const mutedTextColor = "gray.600"

  const {
    data: attendancesResponse,
    isLoading: attendancesLoading,
    error: attendancesError,
    refetch: loadAttendances
  } = useQuery({
    queryKey: ["attendances"],
    queryFn: () => AttendanceService.readAttendances(),
  })

  const {
    data: employeesResponse,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => EmployeesService.readEmployees({ limit: 100 }),
  })

  const {
    data: devicesResponse,
    isLoading: devicesLoading,
    error: devicesError,
  } = useQuery({
    queryKey: ["zkteco-devices"],
    queryFn: () => AttendanceService.readZktecoDevices(),
  })

  const attendances = attendancesResponse?.data || []
  const employees = employeesResponse?.data || []
  const devices = devicesResponse?.data || []

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAttendances();
      showToast('Success', 'Attendance data refreshed', 'success');
    } catch (error) {
      showToast('Error', 'Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (attendancesError) {
    console.error("Error loading attendances:", attendancesError)
  }
  if (employeesError) {
    console.error("Error loading employees:", employeesError)
  }
  if (devicesError) {
    console.error("Error loading devices:", devicesError)
  }

  const isLoading = attendancesLoading || employeesLoading || devicesLoading;

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
                    <Text fontSize="28px" color="white" fontWeight="bold">A</Text>
                  </Box>
                  <VStack align="start" gap={2}>
                    <Heading size="lg" color={textColor}>Attendance Management</Heading>
                    <Text color={mutedTextColor} fontSize="md" fontWeight="medium">
                      Monitor employee attendance, manage locations, devices, and generate comprehensive reports
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
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    {isRefreshing ? "Refreshing..." : "Refresh Data"}
                  </Button>
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
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Total Records</Text>
                      <Text fontSize="3xl" fontWeight="bold" color={textColor}>{attendances?.length || 0}</Text>
                      <Text fontSize="xs" color="blue.500">All attendance records</Text>
                    </VStack>
                    <Box p={3} bg="blue.50" borderRadius="xl">
                      <Text fontSize="24px" color="#3182ce" fontWeight="bold">R</Text>
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
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Present Today</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="green.600">
                        {attendances?.filter(a => {
                          const today = new Date().toDateString();
                          const checkInDate = new Date(a.check_in_time).toDateString();
                          return checkInDate === today;
                        }).length || 0}
                      </Text>
                      <Text fontSize="xs" color="green.500">Checked in today</Text>
                    </VStack>
                    <Box p={3} bg="green.50" borderRadius="xl">
                      <Text fontSize="24px" color="#10b981" fontWeight="bold">P</Text>
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
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Absent Today</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="red.600">
                        {employees?.length - (attendances?.filter(a => {
                          const today = new Date().toDateString();
                          const checkInDate = new Date(a.check_in_time).toDateString();
                          return checkInDate === today;
                        }).length || 0) || 0}
                      </Text>
                      <Text fontSize="xs" color="red.500">Not checked in</Text>
                    </VStack>
                    <Box p={3} bg="red.50" borderRadius="xl">
                      <Text fontSize="24px" color="#ef4444" fontWeight="bold">A</Text>
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
                        {devices?.filter(d => d.device_status === 'online').length || 0}
                      </Text>
                      <Text fontSize="xs" color="purple.500">Online devices</Text>
                    </VStack>
                    <Box p={3} bg="purple.50" borderRadius="xl">
                      <Text fontSize="24px" color="#8b5cf6" fontWeight="bold">D</Text>
                    </Box>
                  </HStack>
                </Box>
              </HStack>
            </Box>

            {/* View Toggle */}
            <Box 
              bg={cardBg} 
              p={4} 
              borderRadius="xl" 
              border="1px solid" 
              borderColor={borderColor} 
              boxShadow="lg"
              animation={`${fadeIn} 0.9s ease-out`}
            >
              <HStack justify="center" gap={4}>
                <Button
                  variant={activeView === 'records' ? "solid" : "outline"}
                  colorScheme="blue"
                  onClick={() => setActiveView('records')}
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  Attendance Records
                </Button>
                <Button
                  variant={activeView === 'locations' ? "solid" : "outline"}
                  colorScheme="blue"
                  onClick={() => setActiveView('locations')}
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  Location Management
                </Button>
                <Button
                  variant={activeView === 'devices' ? "solid" : "outline"}
                  colorScheme="blue"
                  onClick={() => setActiveView('devices')}
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  Device Management
                </Button>
                <Button
                  variant={activeView === 'reports' ? "solid" : "outline"}
                  colorScheme="blue"
                  onClick={() => setActiveView('reports')}
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  Reports
                </Button>
              </HStack>
            </Box>

            {/* Content */}
            {activeView === 'records' && (
              <AttendanceRecords onRefresh={handleRefresh} />
            )}
            {activeView === 'locations' && (
              <LocationManagement onRefresh={handleRefresh} />
            )}
            {activeView === 'devices' && (
              <DeviceManagement onRefresh={handleRefresh} />
            )}
            {activeView === 'reports' && (
              <AttendanceReports />
            )}
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export const Route = createFileRoute("/_layout/attendance")({
  component: AttendancePage,
})

export default AttendancePage; 