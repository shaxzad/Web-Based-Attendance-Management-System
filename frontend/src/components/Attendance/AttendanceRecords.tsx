import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Button,
  Input,
  Flex,
  Spinner,
  Select,
  useDisclosure,
} from "@chakra-ui/react";
import { useCustomToast } from '@/hooks/useCustomToast';
import { AttendanceService, EmployeesService } from '@/client';
import type { AttendancePublic, EmployeePublic, ZKTecoDevicePublic } from '@/client/types.gen';
import { AppTable } from '@/components/ui/table';
import { AppModal } from '@/components/ui/modal';

interface AttendanceRecordsProps {
  onRefresh: () => void;
}

export const AttendanceRecords: React.FC<AttendanceRecordsProps> = ({ onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAttendance, setSelectedAttendance] = useState<AttendancePublic | null>(null);
  const { showToast } = useCustomToast();

  // Fetch data
  const {
    data: attendancesResponse,
    isLoading: attendancesLoading,
    error: attendancesError,
  } = useQuery({
    queryKey: ["attendances"],
    queryFn: () => AttendanceService.readAttendances(),
  });

  const {
    data: employeesResponse,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => EmployeesService.readEmployees({ limit: 100 }),
  });

  const {
    data: devicesResponse,
    isLoading: devicesLoading,
    error: devicesError,
  } = useQuery({
    queryKey: ["zkteco-devices"],
    queryFn: () => AttendanceService.readZktecoDevices(),
  });

  const attendances = attendancesResponse?.data || [];
  const employees = employeesResponse?.data || [];
  const devices = devicesResponse?.data || [];

  // Helper functions
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  const getEmployeeId = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.employee_id || 'N/A';
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.device_name || 'Unknown Device';
  };

  const getDeviceLocation = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.location || 'Unknown Location';
  };

  const getStatusBadge = (status: string) => {
    const colorScheme = status === 'present' ? 'green' : 
                       status === 'absent' ? 'red' : 
                       status === 'late' ? 'yellow' : 'gray';
    return (
      <Badge colorScheme={colorScheme} variant="subtle">
        {status}
      </Badge>
    );
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString();
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString();
  };

  const calculateWorkHours = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return '-';
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return `${diffHours.toFixed(2)}h`;
  };

  // Filter data
  const filteredAttendances = useMemo(() => {
    return attendances.filter(attendance => {
      const employee = employees.find(e => e.id === attendance.employee_id);
      const employeeName = employee ? `${employee.first_name} ${employee.last_name}`.toLowerCase() : '';
      const employeeId = employee?.employee_id?.toLowerCase() || '';
      
      const matchesSearch = !searchTerm || 
        employeeName.includes(searchTerm.toLowerCase()) ||
        employeeId.includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || attendance.status === statusFilter;
      const matchesEmployee = !employeeFilter || attendance.employee_id === employeeFilter;
      const matchesDevice = !deviceFilter || attendance.zkteco_device_id === deviceFilter;
      const matchesDate = !dateFilter || 
        new Date(attendance.check_in_time).toDateString() === new Date(dateFilter).toDateString();

      return matchesSearch && matchesStatus && matchesEmployee && matchesDevice && matchesDate;
    });
  }, [attendances, employees, searchTerm, statusFilter, employeeFilter, deviceFilter, dateFilter]);

  // Table columns
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (value: any, row: AttendancePublic) => (
        <VStack align="start" gap={0}>
          <Text fontWeight="medium">{getEmployeeName(row.employee_id)}</Text>
          <Text fontSize="sm" color="gray.500">ID: {getEmployeeId(row.employee_id)}</Text>
        </VStack>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (value: any, row: AttendancePublic) => formatDate(row.check_in_time),
    },
    {
      key: 'check_in',
      label: 'Check In',
      render: (value: any, row: AttendancePublic) => formatTime(row.check_in_time),
    },
    {
      key: 'check_out',
      label: 'Check Out',
      render: (value: any, row: AttendancePublic) => 
        row.check_out_time ? formatTime(row.check_out_time) : '-',
    },
    {
      key: 'device',
      label: 'Device/Location',
      render: (value: any, row: AttendancePublic) => (
        <VStack align="start" gap={0}>
          <Text fontSize="sm">{row.zkteco_device_id ? getDeviceName(row.zkteco_device_id) : 'Manual Entry'}</Text>
          {row.zkteco_device_id && (
            <Text fontSize="xs" color="gray.500">{getDeviceLocation(row.zkteco_device_id)}</Text>
          )}
        </VStack>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any, row: AttendancePublic) => getStatusBadge(row.status),
    },
    {
      key: 'work_hours',
      label: 'Work Hours',
      render: (value: any, row: AttendancePublic) => 
        calculateWorkHours(row.check_in_time, row.check_out_time),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: AttendancePublic) => (
        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedAttendance(row);
              onOpen();
            }}
          >
            View
          </Button>
        </HStack>
      ),
      width: "120px",
    },
  ];

  // Filter options
  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Late', value: 'late' },
    { label: 'Early Leave', value: 'early_leave' },
  ];

  const employeeOptions = [
    { label: 'All Employees', value: '' },
    ...employees.map(emp => ({
      label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})`,
      value: emp.id,
    })),
  ];

  const deviceOptions = [
    { label: 'All Devices', value: '' },
    ...devices.map(device => ({
      label: `${device.device_name} - ${device.location || 'No Location'}`,
      value: device.id,
    })),
  ];

  const handleViewDetails = (attendance: AttendancePublic) => {
    setSelectedAttendance(attendance);
    onOpen();
  };

  if (attendancesError) {
    console.error("Error loading attendances:", attendancesError);
  }
  if (employeesError) {
    console.error("Error loading employees:", employeesError);
  }
  if (devicesError) {
    console.error("Error loading devices:", devicesError);
  }

  const isLoading = attendancesLoading || employeesLoading || devicesLoading;

  return (
    <Box>
      {/* Filters */}
      <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.200" mb={6}>
        <VStack gap={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color="gray.800">Filters</Text>
          
          <Flex gap={4} wrap="wrap">
            <Box flex={1} minW="200px">
              <Text fontSize="sm" fontWeight="medium" mb={2}>Search Employee</Text>
              <Input
                placeholder="Search by name or employee ID..."
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
              <Text fontSize="sm" fontWeight="medium" mb={2}>Employee</Text>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  fontSize: '14px',
                }}
              >
                {employeeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Box>
            
            <Box minW="200px">
              <Text fontSize="sm" fontWeight="medium" mb={2}>Device</Text>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  fontSize: '14px',
                }}
              >
                {deviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Box>
            
            <Box minW="200px">
              <Text fontSize="sm" fontWeight="medium" mb={2}>Date</Text>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </Box>
          </Flex>
          
          <HStack justify="end" gap={3}>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setEmployeeFilter("");
                setDeviceFilter("");
                setDateFilter("");
              }}
            >
              Clear Filters
            </Button>
            <Button
              colorScheme="blue"
              onClick={onRefresh}
            >
              Refresh Data
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Attendance Table */}
      <AppTable
        data={filteredAttendances}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search attendance records..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        emptyMessage="No attendance records found"
      />

      {/* Attendance Details Modal */}
      {selectedAttendance && (
        <AppModal
          isOpen={isOpen}
          onClose={onClose}
          title="Attendance Details"
          size="lg"
        >
          <VStack gap={6} align="stretch">
            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>Employee</Text>
              <Text fontSize="lg" fontWeight="bold">
                {getEmployeeName(selectedAttendance.employee_id)}
              </Text>
              <Text fontSize="sm" color="gray.600">
                ID: {getEmployeeId(selectedAttendance.employee_id)}
              </Text>
            </Box>

            <HStack gap={6}>
              <Box flex={1}>
                <Text fontSize="sm" color="gray.500" mb={1}>Check In</Text>
                <Text fontSize="md" fontWeight="medium">
                  {formatDateTime(selectedAttendance.check_in_time)}
                </Text>
              </Box>
              
              <Box flex={1}>
                <Text fontSize="sm" color="gray.500" mb={1}>Check Out</Text>
                <Text fontSize="md" fontWeight="medium">
                  {selectedAttendance.check_out_time 
                    ? formatDateTime(selectedAttendance.check_out_time)
                    : 'Not checked out'
                  }
                </Text>
              </Box>
            </HStack>

            <HStack gap={6}>
              <Box flex={1}>
                <Text fontSize="sm" color="gray.500" mb={1}>Status</Text>
                {getStatusBadge(selectedAttendance.status)}
              </Box>
              
              <Box flex={1}>
                <Text fontSize="sm" color="gray.500" mb={1}>Work Hours</Text>
                <Text fontSize="md" fontWeight="medium">
                  {calculateWorkHours(selectedAttendance.check_in_time, selectedAttendance.check_out_time)}
                </Text>
              </Box>
            </HStack>

            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>Device</Text>
              <Text fontSize="md" fontWeight="medium">
                {selectedAttendance.zkteco_device_id 
                  ? getDeviceName(selectedAttendance.zkteco_device_id)
                  : 'Manual Entry'
                }
              </Text>
              {selectedAttendance.zkteco_device_id && (
                <Text fontSize="sm" color="gray.600">
                  Location: {getDeviceLocation(selectedAttendance.zkteco_device_id)}
                </Text>
              )}
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>Attendance Type</Text>
              <Text fontSize="md" fontWeight="medium">
                {selectedAttendance.attendance_type}
              </Text>
            </Box>

            <HStack gap={6}>
              <Box flex={1}>
                <Text fontSize="sm" color="gray.500" mb={1}>Created</Text>
                <Text fontSize="sm" color="gray.600">
                  {formatDateTime(selectedAttendance.created_at)}
                </Text>
              </Box>
              
              <Box flex={1}>
                <Text fontSize="sm" color="gray.500" mb={1}>Last Updated</Text>
                <Text fontSize="sm" color="gray.600">
                  {formatDateTime(selectedAttendance.updated_at)}
                </Text>
              </Box>
            </HStack>
          </VStack>
        </AppModal>
      )}
    </Box>
  );
}; 