import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import {
  Badge,
  Box,
  Container,
  HStack,
  Heading,
  Text,
  VStack,

  IconButton,
} from "@chakra-ui/react"
import { EmployeesService, DepartmentsService } from "@/client"
import type { EmployeePublic, DepartmentPublic } from "@/client/types.gen"

import AddEmployee from "@/components/Employees/AddEmployee"
import EmployeeActions from "@/components/Employees/EmployeeActions"
import { AppTable, createStatusColumn } from "@/components/ui/table"
import { createFileRoute } from "@tanstack/react-router"

// Animation styles
const fadeIn = "opacity 0.3s ease-out"
const slideIn = "transform 0.4s ease-out"
const pulse = "transform 2s infinite"

const Employees = () => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [searchBy] = useState("name") // name, cnic, employee_id
  const [statusFilter, setStatusFilter] = useState("all") // all, active, inactive
  const [departmentFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Color values
  const bgColor = "gray.50"
  const cardBg = "white"
  const borderColor = "gray.200"
  const textColor = "gray.800"
  const mutedTextColor = "gray.600"

  const {
    data: employeesResponse,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () =>
      EmployeesService.readEmployees({
        limit: 100, // Use a reasonable limit
      }),
  })

  const {
    data: departments,
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: () => DepartmentsService.readDepartments({}),
  })

  if (employeesError) {
    console.error("Error loading employees:", employeesError)
  }
  if (departmentsError) {
    console.error("Error loading departments:", departmentsError)
  }

  const allEmployees = employeesResponse?.data || []
  const departmentsList = departments || []
  const isLoading = employeesLoading || departmentsLoading

  // Filter employees based on search and filter criteria
  const filteredEmployees = useMemo(() => {
    // If no employees, return empty array
    if (!allEmployees || allEmployees.length === 0) {
      return []
    }

    let filtered = [...allEmployees]

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((employee: EmployeePublic) => {
        switch (searchBy) {
          case "name":
            return `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(term)
          case "cnic":
            return employee.cnic.toLowerCase().includes(term)
          case "employee_id":
            return employee.employee_id.toLowerCase().includes(term)
          default:
            return `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(term) ||
                   employee.cnic.toLowerCase().includes(term) ||
                   employee.employee_id.toLowerCase().includes(term)
        }
      })
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((employee: EmployeePublic) => {
        if (statusFilter === "active") return employee.is_active === true
        if (statusFilter === "inactive") return employee.is_active === false
        return true
      })
    }

    // Department filter
    if (departmentFilter && departmentFilter !== "all") {
      filtered = filtered.filter((employee: EmployeePublic) => 
        employee.department_id === departmentFilter
      )
    }

    return filtered
  }, [allEmployees, searchTerm, searchBy, statusFilter, departmentFilter])

  // Create a map of department IDs to names for quick lookup
  const departmentMap = new Map<string, string>()
  departmentsList.forEach((dept: DepartmentPublic) => {
    departmentMap.set(dept.id, dept.name)
  })

  // Define table columns
  const columns = [
    { key: 'id', label: '#' },
    { 
      key: 'name', 
      label: 'Employee Name',
      render: (value: string, row: EmployeePublic) => (
        <HStack gap={4} align="center">
          <Box 
            p={3} 
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
            borderRadius="full"
            boxShadow="md"
          >
            <Text fontSize="16px" color="white" fontWeight="bold">E</Text>
          </Box>
          <VStack align="start" gap={1}>
            <Text fontSize="md" fontWeight="700" color={textColor}>
              {row.first_name} {row.last_name}
            </Text>
            <Text fontSize="xs" color={mutedTextColor} fontWeight="500">
              Hired: {new Date(row.hire_date).toLocaleDateString()}
            </Text>
          </VStack>
        </HStack>
      )
    },
    { 
      key: 'employee_id', 
      label: 'Employee ID',
      render: (value: string) => (
        <Box 
          p={2} 
          bg="gray.50" 
          borderRadius="lg" 
          border="1px solid" 
          borderColor="gray.200"
        >
          <Text fontSize="sm" color={textColor} fontWeight="600">
            {value}
          </Text>
        </Box>
      )
    },
    { 
      key: 'cnic', 
      label: 'CNIC',
      render: (value: string) => (
        <Text fontSize="sm" color={textColor} fontWeight="500">
          {value}
        </Text>
      )
    },
    { 
      key: 'phone', 
      label: 'Phone',
      render: (value: string) => (
        <Text fontSize="sm" color={textColor} fontWeight="500">
          {value}
        </Text>
      )
    },
    { 
      key: 'department_id', 
      label: 'Department',
      render: (value: string) => (
        <Badge 
          colorScheme="blue" 
          variant="subtle" 
          size="md"
          borderRadius="lg"
          px={3}
          py={1}
        >
          {departmentMap.get(value) || 'Unknown'}
        </Badge>
      )
    },
    createStatusColumn('is_active', 'Status'),
    { 
      key: 'actions', 
      label: 'Actions',
      width: "120px",
      render: (value: any, row: EmployeePublic) => <EmployeeActions employee={row} />
    }
  ]

  // Filter options for status
  const statusFilterOptions = [
    { label: "All Status", value: "all" },
    { label: "Active Only", value: "active" },
    { label: "Inactive Only", value: "inactive" },
  ]

  // Filter options for departments
  const departmentFilterOptions = [
    { label: "All Departments", value: "all" },
    ...departmentsList.map((dept: DepartmentPublic) => ({
      label: dept.name,
      value: dept.id
    }))
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
                    <Text fontSize="28px" color="white" fontWeight="bold">E</Text>
                  </Box>
                  <VStack align="start" gap={2}>
                    <Heading size="lg" color={textColor}>Employee Management</Heading>
                    <Text color={mutedTextColor} fontSize="md" fontWeight="medium">
                      Manage your organization's workforce with ease
                    </Text>
                  </VStack>
                </HStack>
                <HStack gap={3}>
                  <IconButton
                    aria-label="Export"
                    variant="outline"
                    colorScheme="blue"
                    size="lg"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    <Text fontSize="16px">📊</Text>
                  </IconButton>
                  <IconButton
                    aria-label="Settings"
                    variant="outline"
                    colorScheme="gray"
                    size="lg"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    <Text fontSize="16px">⚙️</Text>
                  </IconButton>
                  <AddEmployee />
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
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Total Employees</Text>
                      <Text fontSize="3xl" fontWeight="bold" color={textColor}>{allEmployees.length}</Text>
                      <HStack gap={1}>
                        <Text fontSize="12px" color="#38a169">📈</Text>
                        <Text fontSize="xs" color="green.500">+12% this month</Text>
                      </HStack>
                    </VStack>
                    <Box p={3} bg="blue.50" borderRadius="xl">
                      <Text fontSize="24px" color="#3182ce" fontWeight="bold">E</Text>
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
                    bg="linear-gradient(90deg, #38a169 0%, #68d391 100%)"
                  />
                  <HStack justify="space-between">
                    <VStack align="start" gap={2}>
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Active Employees</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="green.600">
                        {allEmployees.filter(emp => emp.is_active).length}
                      </Text>
                      <HStack gap={1}>
                        <Text fontSize="12px" color="#38a169">📈</Text>
                        <Text fontSize="xs" color="green.500">+8% this month</Text>
                      </HStack>
                    </VStack>
                    <Box p={3} bg="green.50" borderRadius="xl">
                      <Text fontSize="24px" color="#38a169" fontWeight="bold">+</Text>
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
                    bg="linear-gradient(90deg, #805ad5 0%, #b794f4 100%)"
                  />
                  <HStack justify="space-between">
                    <VStack align="start" gap={2}>
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Departments</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="purple.600">{departmentsList.length}</Text>
                      <HStack gap={1}>
                        <Text fontSize="12px" color="#805ad5">📈</Text>
                        <Text fontSize="xs" color="purple.500">+3 new this month</Text>
                      </HStack>
                    </VStack>
                    <Box p={3} bg="purple.50" borderRadius="xl">
                      <Text fontSize="24px" color="#805ad5" fontWeight="bold">D</Text>
                    </Box>
                  </HStack>
                </Box>
              </HStack>
            </Box>

            {/* AppTable Component */}
            <AppTable
              data={filteredEmployees}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Search employees by name, CNIC, or ID..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              filterOptions={statusFilterOptions}
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              onShowFilters={() => setShowFilters(!showFilters)}
              showFilters={showFilters}
              emptyMessage="No employees found. Get started by adding your first employee to the system."
              actions={<AddEmployee />}
            />
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

export const Route = createFileRoute("/_layout/employees")({
  component: Employees,
})

export default Employees 