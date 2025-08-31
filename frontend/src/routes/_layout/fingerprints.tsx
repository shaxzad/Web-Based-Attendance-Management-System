import { useState } from "react"
import React from "react"
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react"
import { Table } from "@chakra-ui/react"
import { AppModal } from "@/components/ui/modal"
import { FiShield, FiEye, FiTrash2, FiPlus, FiWifi, FiCheckCircle, FiRefreshCw } from "react-icons/fi"
import { useQuery, useMutation } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { EmployeesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"



const FingerprintsPage = () => {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [fingerprintType, setFingerprintType] = useState("thumb")
  const [fingerprintPosition, setFingerprintPosition] = useState(1)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadNotes, setUploadNotes] = useState("")
  
  // ZKTeco device integration state
  const [selectedDevice, setSelectedDevice] = useState("")
  const [deviceUsers, setDeviceUsers] = useState<any[]>([])
  const [isDeviceConnected, setIsDeviceConnected] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<any[]>([])

  // Fetch employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => EmployeesService.readEmployees({}),
  })

  // Placeholder data for fingerprint statistics
  const statistics = {
    total_employees: employees?.data?.length || 0,
    employees_with_fingerprints: 0,
    total_fingerprints: 0,
    thumb_fingerprints: 0,
    index_fingerprints: 0,
    coverage_percentage: 0
  }

  // Placeholder data for employee fingerprint summary
  const selectedEmployeeData = employees?.data?.find(emp => emp.id === selectedEmployee)
  const employeeSummary = selectedEmployee ? {
    employee_id: selectedEmployee,
    employee_name: selectedEmployeeData ? `${selectedEmployeeData.first_name} ${selectedEmployeeData.last_name}` : "Employee Name",
    total_fingerprints: 0,
    thumb_fingerprints: 0,
    index_fingerprints: 0,
    middle_fingerprints: 0,
    ring_fingerprints: 0,
    pinky_fingerprints: 0,
    last_updated: null
  } : null

  // Placeholder data for employee fingerprints
  const employeeFingerprints = selectedEmployee ? {
    data: []
  } : null

  // Upload fingerprint mutation (placeholder)
  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true }
    },
    onSuccess: () => {
      showSuccessToast("Fingerprint uploaded successfully")
      setIsModalOpen(false)
      setUploadFile(null)
      setUploadNotes("")
    },
    onError: () => {
      showErrorToast("Failed to upload fingerprint")
    },
  })

  // Delete fingerprint mutation (placeholder)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    },
    onSuccess: () => {
      showSuccessToast("Fingerprint deleted successfully")
    },
    onError: () => {
      showErrorToast("Failed to delete fingerprint")
    },
  })

  // ZKTeco device mutations (placeholder implementations)
  const captureFromDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, employeeId, fingerprintType, position }: any) => {
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { success: true, fingerprint: { id: "new-fingerprint-id" } }
    },
    onSuccess: () => {
      showSuccessToast("Fingerprint captured from device successfully")
    },
    onError: () => {
      showErrorToast("Failed to capture fingerprint from device")
    },
  })

  const verifyOnDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, employeeId }: any) => {
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { verified: true }
    },
    onSuccess: (data) => {
      if (data.verified) {
        showSuccessToast("Fingerprint verified successfully")
      } else {
        showErrorToast("Fingerprint verification failed")
      }
    },
    onError: () => {
      showErrorToast("Failed to verify fingerprint on device")
    },
  })

  const syncFromDeviceMutation = useMutation({
    mutationFn: async ({ deviceId }: any) => {
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 3000))
      return { fingerprints_synced: 5, status: "success" }
    },
    onSuccess: (data) => {
      showSuccessToast(`Synced ${data.fingerprints_synced} fingerprints from device`)
    },
    onError: () => {
      showErrorToast("Failed to sync fingerprints from device")
    },
  })

  const enrollOnDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, employeeId, fingerprintType, position }: any) => {
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { success: true }
    },
    onSuccess: () => {
      showSuccessToast("Fingerprint enrolled on device successfully")
    },
    onError: () => {
      showErrorToast("Failed to enroll fingerprint on device")
    },
  })

  const getDeviceUsersMutation = useMutation({
    mutationFn: async ({ deviceId }: any) => {
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { users: [], count: 0 }
    },
    onSuccess: (data) => {
      setDeviceUsers(data.users)
      setIsDeviceConnected(true)
      showSuccessToast(`Found ${data.count} users on device`)
    },
    onError: () => {
      setIsDeviceConnected(false)
      showErrorToast("Failed to connect to device")
    },
  })

  // Fetch available devices from device management
  const { data: devicesData } = useQuery({
    queryKey: ["available-devices"],
    queryFn: async () => {
      // Placeholder implementation - in real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        devices: [
          {
            id: "device-1",
            device_id: "device-1",
            device_name: "ZKTeco Device 1",
            device_ip: "172.25.10.73",
            device_port: 4370,
            device_status: "online",
            is_active: true
          },
          {
            id: "device-2", 
            device_id: "device-2",
            device_name: "ZKTeco Device 2",
            device_ip: "169.254.134.75",
            device_port: 4370,
            device_status: "offline",
            is_active: true
          }
        ],
        count: 2
      }
    },
  })

  // Update available devices when data is fetched
  React.useEffect(() => {
    if (devicesData?.devices) {
      setAvailableDevices(devicesData.devices)
    }
  }, [devicesData])

  const getQualityColor = (score: number) => {
    if (score >= 80) return "green"
    if (score >= 60) return "yellow"
    if (score >= 50) return "orange"
    return "red"
  }

  const getQualityText = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 50) return "Acceptable"
    return "Poor"
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleUpload = () => {
    if (!uploadFile) {
      showErrorToast("Please select a file")
      return
    }

    uploadMutation.mutate()
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg" display="flex" alignItems="center" gap={3}>
            <FiShield />
            Fingerprint Management
          </Heading>
          <Button
            colorScheme="blue"
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedEmployee}
          >
            <FiPlus style={{ marginRight: '8px' }} />
            Add Fingerprint
          </Button>
        </Box>

        {/* Statistics Cards */}
        {statistics && (
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="md">
              <VStack align="start" gap={2}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Total Employees
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {statistics.total_employees}
                </Text>
                <Text fontSize="xs" color="green.600">
                  ↗ {statistics.coverage_percentage.toFixed(1)}% coverage
                </Text>
              </VStack>
            </Box>
            <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="md">
              <VStack align="start" gap={2}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Employees with Fingerprints
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {statistics.employees_with_fingerprints}
                </Text>
                <Text fontSize="xs" color="blue.600">
                  ↗ {statistics.total_fingerprints} total fingerprints
                </Text>
              </VStack>
            </Box>
            <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="md">
              <VStack align="start" gap={2}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Thumb Fingerprints
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {statistics.thumb_fingerprints}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Most common type
                </Text>
              </VStack>
            </Box>
            <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="md">
              <VStack align="start" gap={2}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Index Fingerprints
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {statistics.index_fingerprints}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Secondary type
                </Text>
              </VStack>
            </Box>
          </Box>
        )}

        {/* ZKTeco Device Integration */}
        <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="md">
          <Heading size="md" mb={4} display="flex" alignItems="center" gap={2}>
            <FiWifi />
            ZKTeco Device Integration
          </Heading>
          
          <VStack gap={4} align="stretch">
            {/* Device Connection Status */}
            <HStack justify="space-between" p={4} bg={selectedDevice && availableDevices.find(d => d.id === selectedDevice)?.device_status === "online" ? "green.50" : "red.50"} borderRadius="md">
              <HStack>
                <Box color={selectedDevice && availableDevices.find(d => d.id === selectedDevice)?.device_status === "online" ? "green.500" : "red.500"}>
                  {selectedDevice && availableDevices.find(d => d.id === selectedDevice)?.device_status === "online" ? <FiCheckCircle /> : <FiWifi />}
                </Box>
                <Text fontWeight="medium">
                  Device Status: {selectedDevice ? 
                    availableDevices.find(d => d.id === selectedDevice)?.device_status || "Unknown" : 
                    "No device selected"}
                </Text>
              </HStack>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => getDeviceUsersMutation.mutate({ deviceId: selectedDevice })}
                loading={getDeviceUsersMutation.isPending}
                disabled={!selectedDevice}
              >
                <FiRefreshCw style={{ marginRight: '4px' }} />
                Test Connection
              </Button>
            </HStack>

            {/* Device Selection */}
            <HStack gap={4}>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Select Device</Text>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose a device from device management</option>
                  {availableDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.device_name} ({device.device_ip}) - {device.device_status}
                    </option>
                  ))}
                </select>
              </Box>
            </HStack>

            {/* Device Management Link */}
            <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
              <Text fontSize="sm" color="blue.700">
                💡 <strong>Device Management Required:</strong> Devices must be added and connected through the 
                <a href="/attendance" style={{ color: 'blue', textDecoration: 'underline', marginLeft: '4px' }}>
                  Device Management
                </a> 
                section first. Only connected devices can be used for fingerprint operations.
              </Text>
            </Box>

            {/* Device Actions */}
            <HStack gap={2} flexWrap="wrap">
              <Button
                size="sm"
                colorScheme="green"
                onClick={() => enrollOnDeviceMutation.mutate({
                  deviceId: selectedDevice,
                  employeeId: selectedEmployee,
                  fingerprintType: fingerprintType,
                  position: fingerprintPosition
                })}
                loading={enrollOnDeviceMutation.isPending}
                disabled={!selectedDevice || !selectedEmployee || availableDevices.find(d => d.id === selectedDevice)?.device_status !== "online"}
              >
                <FiPlus style={{ marginRight: '4px' }} />
                Enroll on Device
              </Button>
              
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => captureFromDeviceMutation.mutate({
                  deviceId: selectedDevice,
                  employeeId: selectedEmployee,
                  fingerprintType: fingerprintType,
                  position: fingerprintPosition
                })}
                loading={captureFromDeviceMutation.isPending}
                disabled={!selectedDevice || !selectedEmployee || availableDevices.find(d => d.id === selectedDevice)?.device_status !== "online"}
              >
                <FiEye style={{ marginRight: '4px' }} />
                Capture from Device
              </Button>
              
              <Button
                size="sm"
                colorScheme="purple"
                onClick={() => verifyOnDeviceMutation.mutate({
                  deviceId: selectedDevice,
                  employeeId: selectedEmployee
                })}
                loading={verifyOnDeviceMutation.isPending}
                disabled={!selectedDevice || !selectedEmployee || availableDevices.find(d => d.id === selectedDevice)?.device_status !== "online"}
              >
                <FiCheckCircle style={{ marginRight: '4px' }} />
                Verify on Device
              </Button>
              
              <Button
                size="sm"
                colorScheme="orange"
                onClick={() => syncFromDeviceMutation.mutate({ deviceId: selectedDevice })}
                loading={syncFromDeviceMutation.isPending}
                disabled={!selectedDevice || availableDevices.find(d => d.id === selectedDevice)?.device_status !== "online"}
              >
                <FiRefreshCw style={{ marginRight: '4px' }} />
                Sync from Device
              </Button>
            </HStack>

            {/* Device Users */}
            {deviceUsers.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Device Users ({deviceUsers.length})</Text>
                <Box maxH="200px" overflowY="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
                  {deviceUsers.map((user, index) => (
                    <Box key={index} p={3} borderBottom="1px solid" borderColor="gray.100">
                      <Text fontSize="sm">User ID: {user.user_id}</Text>
                      <Text fontSize="sm" color="gray.600">Name: {user.name}</Text>
                      <Text fontSize="sm" color="gray.600">Fingerprints: {user.fingerprints?.length || 0}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Employee Selection */}
        <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="md">
          <Heading size="md" mb={4}>Select Employee</Heading>
          <select
            placeholder="Choose an employee"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="">Choose an employee...</option>
            {employees?.data?.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name} - {employee.employee_id}
              </option>
            ))}
          </select>
        </Box>

        {/* Employee Fingerprint Summary */}
        {employeeSummary && (
          <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="md">
            <Heading size="md" mb={4}>Employee Fingerprint Summary</Heading>
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
              <Box>
                <Text fontWeight="bold" color="gray.600">Total Fingerprints</Text>
                <Text fontSize="2xl" fontWeight="bold">{employeeSummary.total_fingerprints}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.600">Thumb</Text>
                <Text fontSize="2xl" fontWeight="bold">{employeeSummary.thumb_fingerprints}/5</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.600">Index</Text>
                <Text fontSize="2xl" fontWeight="bold">{employeeSummary.index_fingerprints}/5</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.600">Middle</Text>
                <Text fontSize="2xl" fontWeight="bold">{employeeSummary.middle_fingerprints}/5</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.600">Ring</Text>
                <Text fontSize="2xl" fontWeight="bold">{employeeSummary.ring_fingerprints}/5</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="gray.600">Pinky</Text>
                <Text fontSize="2xl" fontWeight="bold">{employeeSummary.pinky_fingerprints}/5</Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Fingerprints Table */}
        {employeeFingerprints && employeeFingerprints.data.length > 0 && (
          <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="md">
            <Heading size="md" mb={4}>Employee Fingerprints</Heading>
            <Table.Root size={{ base: "sm", md: "md" }}>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Type</Table.ColumnHeader>
                  <Table.ColumnHeader>Position</Table.ColumnHeader>
                  <Table.ColumnHeader>Quality Score</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Created</Table.ColumnHeader>
                  <Table.ColumnHeader>Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {employeeFingerprints.data.map((fingerprint: any) => (
                  <Table.Row key={fingerprint.id}>
                    <Table.Cell>
                      <Box
                        display="inline-block"
                        px={2}
                        py={1}
                        bg="blue.100"
                        color="blue.800"
                        borderRadius="md"
                        fontSize="sm"
                        textTransform="capitalize"
                      >
                        {fingerprint.fingerprint_type}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>{fingerprint.fingerprint_position}</Table.Cell>
                    <Table.Cell>
                      <VStack align="start" gap={1}>
                        <Text fontWeight="bold">
                          {fingerprint.quality_score?.toFixed(1) || "N/A"}
                        </Text>
                        <Box
                          w="100px"
                          h="8px"
                          bg="gray.200"
                          borderRadius="full"
                          overflow="hidden"
                        >
                          <Box
                            h="100%"
                            bg={getQualityColor(fingerprint.quality_score || 0) === "green" ? "green.500" : 
                                getQualityColor(fingerprint.quality_score || 0) === "yellow" ? "yellow.500" :
                                getQualityColor(fingerprint.quality_score || 0) === "orange" ? "orange.500" : "red.500"}
                            w={`${fingerprint.quality_score || 0}%`}
                          />
                        </Box>
                        <Text fontSize="xs" color="gray.500">
                          {getQualityText(fingerprint.quality_score || 0)}
                        </Text>
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <Box
                        display="inline-block"
                        px={2}
                        py={1}
                        bg={fingerprint.is_active ? "green.100" : "red.100"}
                        color={fingerprint.is_active ? "green.800" : "red.800"}
                        borderRadius="md"
                        fontSize="sm"
                      >
                        {fingerprint.is_active ? "Active" : "Inactive"}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(fingerprint.created_at).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={2}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: Implement view fingerprint details
                            showSuccessToast("View functionality coming soon")
                          }}
                        >
                          <FiEye style={{ marginRight: '4px' }} />
                          View
                        </Button>
                                                  <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this fingerprint?")) {
                                deleteMutation.mutate()
                              }
                            }}
                          >
                          <FiTrash2 style={{ marginRight: '4px' }} />
                          Delete
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {/* Upload Modal */}
        <AppModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Upload Fingerprint"
          submitText="Upload Fingerprint"
          onSubmit={handleUpload}
          isLoading={uploadMutation.isPending}
          size="lg"
        >
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontWeight="bold" mb={2}>Fingerprint Type</Text>
              <select
                value={fingerprintType}
                onChange={(e) => setFingerprintType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="thumb">Thumb</option>
                <option value="index">Index</option>
                <option value="middle">Middle</option>
                <option value="ring">Ring</option>
                <option value="pinky">Pinky</option>
              </select>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={2}>Position</Text>
              <select
                value={fingerprintPosition}
                onChange={(e) => setFingerprintPosition(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value={1}>Position 1</option>
                <option value={2}>Position 2</option>
                <option value={3}>Position 3</option>
                <option value={4}>Position 4</option>
                <option value={5}>Position 5</option>
              </select>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={2}>Fingerprint Image</Text>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                p={1}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Supported formats: PNG, JPG, JPEG (100x100 to 1000x1000 pixels)
              </Text>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={2}>Notes (Optional)</Text>
              <Input
                placeholder="Add notes about this fingerprint"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
              />
            </Box>
          </VStack>
        </AppModal>
      </VStack>
    </Container>
  )
}

export const Route = createFileRoute("/_layout/fingerprints")({
  component: FingerprintsPage,
})

export default FingerprintsPage
