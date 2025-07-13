import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
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
  Input,
  Select,
  Button,
  IconButton,
} from "@chakra-ui/react"
import { FaUsers, FaBuilding, FaSearch, FaFilter, FaTimes } from "react-icons/fa"
import { EmployeesService, DepartmentsService } from "@/client"
import type { EmployeePublic, DepartmentPublic } from "@/client/types.gen"
import { handleError } from "@/utils"
import AddEmployee from "@/components/Employees/AddEmployee"
import EditEmployee from "@/components/Employees/EditEmployee"
import DeleteEmployee from "@/components/Employees/DeleteEmployee"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { createFileRoute } from "@tanstack/react-router"

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

const Employees = () => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [searchBy, setSearchBy] = useState("name") // name, cnic, employee_id
  const [statusFilter, setStatusFilter] = useState("all") // all, active, inactive
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

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

  // Pagination for filtered results
  const totalCount = filteredEmployees.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const employees = filteredEmployees.slice(startIndex, endIndex)

  // Reset page when filters change
  const resetPage = () => setPage(1)

  // Create a map of department IDs to names for quick lookup
  const departmentMap = new Map<string, string>()
  departmentsList.forEach((dept: DepartmentPublic) => {
    departmentMap.set(dept.id, dept.name)
  })

  // Modern pagination bar
  const PaginationBar = () => {
    return (
      <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <HStack gap={4}>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              Showing {employees.length ? (page - 1) * pageSize + 1 : 0} -
              {Math.min(page * pageSize, totalCount)} of {totalCount} employees
            </Text>
            <HStack gap={2} align="center">
              <Text fontSize="sm" color="gray.600">Show:</Text>
              <select
                style={{ 
                  padding: "6px 12px", 
                  borderRadius: "6px", 
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
                value={pageSize}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                {PAGE_SIZE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt} per page
                  </option>
                ))}
              </select>
            </HStack>
          </HStack>
          
          <PaginationRoot
            count={totalCount}
            pageSize={pageSize}
            onPageChange={({ page }) => setPage(page)}
          >
            <Flex gap={2}>
              <PaginationPrevTrigger />
              <PaginationItems />
              <PaginationNextTrigger />
            </Flex>
          </PaginationRoot>
        </HStack>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="brand.accent">
      <Container maxW="7xl" py={8}>
        <Box flex={1}>
          <VStack gap={6} align="stretch">
            {/* Header Section */}
            <Box>
              <HStack justify="space-between" align="center" mb={4}>
                <HStack gap={3}>
                  <Box p={3} bg="primary.50" borderRadius="lg">
                    <FaUsers fontSize="24px" color="#3182ce" />
                  </Box>
                  <VStack align="start" gap={1}>
                    <Heading size="lg">Employees</Heading>
                    <Text color="gray.600" fontSize="md">
                      Manage your organization's workforce
                    </Text>
                  </VStack>
                </HStack>
                <AddEmployee />
              </HStack>
              
              {/* Stats Cards */}
              <HStack gap={4} mb={6}>
                <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" flex={1} boxShadow="sm">
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Total Employees</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="gray.800">{allEmployees.length}</Text>
                    </VStack>
                    <Box p={2} bg="blue.50" borderRadius="md">
                      <FaUsers fontSize="20px" color="#3182ce" />
                    </Box>
                  </HStack>
                </Box>
                <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" flex={1} boxShadow="sm">
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Filtered Results</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {filteredEmployees.length}
                      </Text>
                    </VStack>
                    <Box p={2} bg="green.50" borderRadius="md">
                      <FaUsers fontSize="20px" color="#38a169" />
                    </Box>
                  </HStack>
                </Box>
                <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" flex={1} boxShadow="sm">
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Departments</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="purple.600">{departmentsList.length}</Text>
                    </VStack>
                    <Box p={2} bg="purple.50" borderRadius="md">
                      <FaBuilding fontSize="20px" color="#805ad5" />
                    </Box>
                  </HStack>
                </Box>
              </HStack>
            </Box>

            {/* Search and Filter Section */}
            <Box bg="white" p={6} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
              <VStack gap={4} align="stretch">
                {/* Search Bar */}
                <HStack gap={4}>
                  <Box flex={1}>
                    <HStack gap={3}>
                      <Box flex={1}>
                        <HStack gap={2}>
                          <Box flex={1}>
                            <Input
                              placeholder="Search employees..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value)
                                resetPage()
                              }}
                              size="md"
                            />
                          </Box>
                          <select
                            value={searchBy}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              setSearchBy(e.target.value)
                              resetPage()
                            }}
                            style={{
                              width: '150px',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              fontSize: '14px'
                            }}
                          >
                            <option value="name">By Name</option>
                            <option value="cnic">By CNIC</option>
                            <option value="employee_id">By Employee ID</option>
                          </select>
                        </HStack>
                      </Box>
                      <Button
                        aria-label="Toggle filters"
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        size="md"
                      >
                        {showFilters ? <FaTimes /> : <FaFilter />}
                      </Button>
                      {searchTerm && (
                        <Button
                          size="md"
                          variant="ghost"
                          onClick={() => {
                            setSearchTerm("")
                            resetPage()
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </HStack>
                  </Box>
                </HStack>

                {/* Advanced Filters */}
                {showFilters && (
                  <Box pt={4} borderTop="1px solid" borderColor="gray.200">
                    <HStack gap={4} flexWrap="wrap">
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Status</Text>
                        <select
                          value={statusFilter}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setStatusFilter(e.target.value)
                            resetPage()
                          }}
                          style={{
                            width: '120px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                          }}
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </VStack>
                      
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Department</Text>
                        <select
                          value={departmentFilter}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setDepartmentFilter(e.target.value)
                            resetPage()
                          }}
                          style={{
                            width: '180px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                          }}
                        >
                          <option value="all">All Departments</option>
                          {departmentsList.map((dept: DepartmentPublic) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </VStack>

                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Results</Text>
                        <Text fontSize="sm" color="gray.700" fontWeight="500">
                          {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>

            {isLoading ? (
              <VStack gap={4} align="stretch">
                {[...Array(3)].map((_, i) => (
                  <Box key={i} bg="white" borderRadius="lg" p={6} border="1px solid" borderColor="gray.200">
                    <HStack gap={4}>
                      <Skeleton w="40px" h="40px" borderRadius="full" />
                      <VStack align="start" gap={2} flex={1}>
                        <Skeleton h="24px" w="200px" />
                        <HStack gap={4}>
                          <Skeleton h="20px" w="100px" />
                          <Skeleton h="20px" w="120px" />
                        </HStack>
                        <HStack gap={6}>
                          <Skeleton h="16px" w="80px" />
                          <Skeleton h="16px" w="100px" />
                          <Skeleton h="16px" w="90px" />
                        </HStack>
                      </VStack>
                      <VStack gap={2}>
                        <Skeleton h="32px" w="80px" />
                        <Skeleton h="32px" w="80px" />
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            ) : filteredEmployees.length > 0 ? (
              <>
                <VStack gap={4} align="stretch">
                  {employees.map((employee: EmployeePublic) => (
                    <Box 
                      key={employee.id} 
                      bg="white" 
                      borderRadius="lg" 
                      p={6} 
                      border="1px solid" 
                      borderColor="gray.200"
                      boxShadow="sm"
                      _hover={{ 
                        boxShadow: "md", 
                        transform: "translateY(-2px)",
                        transition: "all 0.2s"
                      }}
                    >
                      <HStack justify="space-between" align="start" w="full">
                        <VStack align="start" gap={3} flex={1}>
                          <HStack gap={3} align="center">
                            <Box p={2} bg="primary.50" borderRadius="full">
                              <FaUsers fontSize="16px" color="#3182ce" />
                            </Box>
                            <VStack align="start" gap={1}>
                              <Heading size="md" color="gray.800">
                                {employee.first_name} {employee.last_name}
                              </Heading>
                              <HStack gap={2}>
                                <Badge
                                  colorPalette={employee.is_active ? "green" : "red"}
                                  variant="subtle"
                                  size="sm"
                                >
                                  {employee.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <Badge colorPalette="blue" variant="subtle" size="sm">
                                  {departmentMap.get(employee.department_id) || 'Unknown Department'}
                                </Badge>
                              </HStack>
                            </VStack>
                          </HStack>
                          
                          <HStack gap={6} flexWrap="wrap">
                            <VStack align="start" gap={1}>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium">EMPLOYEE ID</Text>
                              <Text fontSize="sm" color="gray.700" fontWeight="500">{employee.employee_id}</Text>
                            </VStack>
                            <VStack align="start" gap={1}>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium">CNIC</Text>
                              <Text fontSize="sm" color="gray.700" fontWeight="500">{employee.cnic}</Text>
                            </VStack>
                            <VStack align="start" gap={1}>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium">PHONE</Text>
                              <Text fontSize="sm" color="gray.700" fontWeight="500">{employee.phone}</Text>
                            </VStack>
                            <VStack align="start" gap={1}>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium">HIRE DATE</Text>
                              <Text fontSize="sm" color="gray.700" fontWeight="500">
                                {new Date(employee.hire_date).toLocaleDateString()}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          {employee.address && (
                            <VStack align="start" gap={1}>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium">ADDRESS</Text>
                              <Text fontSize="sm" color="gray.700">{employee.address}</Text>
                            </VStack>
                          )}
                        </VStack>
                        
                        <VStack gap={2} align="end">
                          <HStack gap={2}>
                            <EditEmployee employee={employee} />
                            <DeleteEmployee employee={employee} />
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
                {totalPages > 1 && <PaginationBar />}
              </>
                          ) : searchTerm || statusFilter !== "all" || departmentFilter !== "all" ? (
                <Box bg="white" borderRadius="lg" p={12} border="2px dashed" borderColor="gray.300" textAlign="center">
                  <VStack gap={4} py={8}>
                    <Box p={4} bg="gray.50" borderRadius="full">
                      <FaUsers fontSize="48px" color="#a0aec0" />
                    </Box>
                    <VStack gap={2}>
                      <Text fontSize="xl" color="gray.600" fontWeight="semibold">
                        No employees match your filters
                      </Text>
                      <Text color="gray.500" maxW="md">
                        Try adjusting your search criteria or filters to find the employees you're looking for.
                      </Text>
                    </VStack>
                    <HStack gap={2}>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("")
                          setStatusFilter("all")
                          setDepartmentFilter("all")
                          resetPage()
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              ) : (
                <Box bg="white" borderRadius="lg" p={12} border="2px dashed" borderColor="gray.300" textAlign="center">
                  <VStack gap={4} py={8}>
                    <Box p={4} bg="gray.50" borderRadius="full">
                      <FaUsers fontSize="48px" color="#a0aec0" />
                    </Box>
                    <VStack gap={2}>
                      <Text fontSize="xl" color="gray.600" fontWeight="semibold">
                        No employees found
                      </Text>
                      <Text color="gray.500" maxW="md">
                        Get started by adding your first employee to the system. You can manage their information, department assignments, and more.
                      </Text>
                    </VStack>
                    <Box mt={4}>
                      <AddEmployee />
                    </Box>
                  </VStack>
                </Box>
              )}
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