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
  Button,
  IconButton,
} from "@chakra-ui/react"
import { 
  FaUsers, 
  FaBuilding, 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaEye,
  FaChartLine,
  FaUserPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaDownload,
  FaCog
} from "react-icons/fa"
import { EmployeesService, DepartmentsService } from "@/client"
import type { EmployeePublic, DepartmentPublic } from "@/client/types.gen"
import { handleError } from "@/utils"
import AddEmployee from "@/components/Employees/AddEmployee"
import EmployeeActions from "@/components/Employees/EmployeeActions"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { createFileRoute } from "@tanstack/react-router"

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

// Animation styles
const fadeIn = "opacity 0.3s ease-out"
const slideIn = "transform 0.4s ease-out"
const pulse = "transform 2s infinite"

const Employees = () => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [searchBy, setSearchBy] = useState("name") // name, cnic, employee_id
  const [statusFilter, setStatusFilter] = useState("all") // all, active, inactive
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("id") // id, name, employee_id, hire_date
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

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

    // Sort employees based on selected criteria
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case "name":
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
          break
        case "employee_id":
          aValue = a.employee_id.toLowerCase()
          bValue = b.employee_id.toLowerCase()
          break
        case "hire_date":
          aValue = new Date(a.hire_date).getTime()
          bValue = new Date(b.hire_date).getTime()
          break
        case "id":
        default:
          aValue = a.id
          bValue = b.id
          break
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortOrder === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

    return filtered
  }, [allEmployees, searchTerm, searchBy, statusFilter, departmentFilter, sortBy, sortOrder])

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

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <FaSort fontSize="12px" />
    return sortOrder === "asc" ? <FaSortUp fontSize="12px" /> : <FaSortDown fontSize="12px" />
  }

  // Modern pagination bar
  const PaginationBar = () => {
    return (
      <Box 
        bg={cardBg} 
        p={6} 
        borderRadius="xl" 
        border="1px solid" 
        borderColor={borderColor} 
        boxShadow="lg"
        animation={`${fadeIn} 0.3s ease-out`}
      >
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <HStack gap={4}>
            <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">
              Showing {employees.length ? (page - 1) * pageSize + 1 : 0} -
              {Math.min(page * pageSize, totalCount)} of {totalCount} employees
            </Text>
            <HStack gap={2} align="center">
              <Text fontSize="sm" color={mutedTextColor}>Show:</Text>
              <select
                style={{ 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  border: `1px solid ${borderColor}`,
                  fontSize: "14px",
                  fontWeight: "500",
                  backgroundColor: cardBg,
                  color: textColor
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
                    <FaUsers fontSize="28px" color="white" />
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
                    colorPalette="blue"
                    size="lg"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    <FaDownload />
                  </IconButton>
                  <IconButton
                    aria-label="Settings"
                    variant="outline"
                    colorPalette="gray"
                    size="lg"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                  >
                    <FaCog />
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
                        <FaChartLine fontSize="12px" color="#38a169" />
                        <Text fontSize="xs" color="green.500">+12% this month</Text>
                      </HStack>
                    </VStack>
                    <Box p={3} bg="blue.50" borderRadius="xl">
                      <FaUsers fontSize="24px" color="#3182ce" />
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
                        <FaChartLine fontSize="12px" color="#38a169" />
                        <Text fontSize="xs" color="green.500">+8% this month</Text>
                      </HStack>
                    </VStack>
                    <Box p={3} bg="green.50" borderRadius="xl">
                      <FaUserPlus fontSize="24px" color="#38a169" />
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
                        <FaChartLine fontSize="12px" color="#805ad5" />
                        <Text fontSize="xs" color="purple.500">+3 new this month</Text>
                      </HStack>
                    </VStack>
                    <Box p={3} bg="purple.50" borderRadius="xl">
                      <FaBuilding fontSize="24px" color="#805ad5" />
                    </Box>
                  </HStack>
                </Box>
              </HStack>
            </Box>

            {/* Enhanced Search and Filter Section */}
            <Box 
              bg={cardBg} 
              p={8} 
              borderRadius="xl" 
              border="1px solid" 
              borderColor={borderColor} 
              boxShadow="lg"
              animation={`${fadeIn} 0.8s ease-out`}
            >
              <VStack gap={6} align="stretch">
                {/* Enhanced Search Bar */}
                <HStack gap={4}>
                  <Box flex={1}>
                    <HStack gap={4}>
                      <Box flex={1}>
                        <HStack gap={3}>
                          <Box flex={1} position="relative">
                            <Input
                              placeholder="Search employees by name, CNIC, or ID..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value)
                                resetPage()
                              }}
                              size="lg"
                              borderRadius="xl"
                              border="2px solid"
                              borderColor={borderColor}
                              _focus={{ 
                                borderColor: "blue.400", 
                                boxShadow: "0 0 0 1px #3182ce",
                                transform: "scale(1.02)"
                              }}
                              _hover={{ borderColor: "blue.300" }}
                              transition="all 0.2s"
                              pl={12}
                            />
                            <Box position="absolute" left={4} top="50%" transform="translateY(-50%)">
                              <FaSearch fontSize="16px" color={mutedTextColor} />
                            </Box>
                          </Box>
                          <select
                            value={searchBy}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              setSearchBy(e.target.value)
                              resetPage()
                            }}
                            style={{
                              width: '180px',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              border: `2px solid ${borderColor}`,
                              fontSize: '14px',
                              backgroundColor: cardBg,
                              color: textColor,
                              fontWeight: '500'
                            }}
                          >
                            <option value="name">Search by Name</option>
                            <option value="cnic">Search by CNIC</option>
                            <option value="employee_id">Search by Employee ID</option>
                          </select>
                        </HStack>
                      </Box>
                      <Button
                        aria-label="Toggle filters"
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        size="lg"
                        borderRadius="xl"
                        _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                        transition="all 0.2s"
                      >
                        {showFilters ? <FaTimes /> : <FaFilter />}
                        {showFilters ? " Hide Filters" : " Show Filters"}
                      </Button>
                      {searchTerm && (
                        <Button
                          size="lg"
                          variant="ghost"
                          borderRadius="xl"
                          onClick={() => {
                            setSearchTerm("")
                            resetPage()
                          }}
                          _hover={{ bg: "red.50", color: "red.500" }}
                          transition="all 0.2s"
                        >
                          Clear
                        </Button>
                      )}
                    </HStack>
                  </Box>
                </HStack>

                {/* Enhanced Advanced Filters */}
                {showFilters && (
                  <Box 
                    pt={6} 
                    borderTop="2px solid" 
                    borderColor={borderColor}
                    animation={`${fadeIn} 0.3s ease-out`}
                  >
                    <VStack gap={6} align="stretch">
                      <HStack gap={6} flexWrap="wrap">
                        <VStack align="start" gap={2}>
                          <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Status Filter</Text>
                          <select
                            value={statusFilter}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              setStatusFilter(e.target.value)
                              resetPage()
                            }}
                            style={{
                              width: '140px',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: `2px solid ${borderColor}`,
                              fontSize: '14px',
                              backgroundColor: cardBg,
                              color: textColor,
                              fontWeight: '500'
                            }}
                          >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                          </select>
                        </VStack>
                        
                        <VStack align="start" gap={2}>
                          <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Department Filter</Text>
                          <select
                            value={departmentFilter}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              setDepartmentFilter(e.target.value)
                              resetPage()
                            }}
                            style={{
                              width: '200px',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: `2px solid ${borderColor}`,
                              fontSize: '14px',
                              backgroundColor: cardBg,
                              color: textColor,
                              fontWeight: '500'
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

                        <VStack align="start" gap={2}>
                          <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Sort By</Text>
                          <HStack gap={2}>
                            <select
                              value={sortBy}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                setSortBy(e.target.value)
                                resetPage()
                              }}
                              style={{
                                width: '140px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: `2px solid ${borderColor}`,
                                fontSize: '14px',
                                backgroundColor: cardBg,
                                color: textColor,
                                fontWeight: '500'
                              }}
                            >
                              <option value="id">ID</option>
                              <option value="name">Name</option>
                              <option value="employee_id">Employee ID</option>
                              <option value="hire_date">Hire Date</option>
                            </select>
                            <select
                              value={sortOrder}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                setSortOrder(e.target.value as "asc" | "desc")
                                resetPage()
                              }}
                              style={{
                                width: '100px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: `2px solid ${borderColor}`,
                                fontSize: '14px',
                                backgroundColor: cardBg,
                                color: textColor,
                                fontWeight: '500'
                              }}
                            >
                              <option value="asc">↑ Asc</option>
                              <option value="desc">↓ Desc</option>
                            </select>
                          </HStack>
                        </VStack>

                        <VStack align="start" gap={2}>
                          <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Results</Text>
                          <Box 
                            p={3} 
                            bg="blue.50" 
                            borderRadius="lg" 
                            border="1px solid" 
                            borderColor="blue.200"
                          >
                            <Text fontSize="sm" color="blue.700" fontWeight="600">
                              {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
                            </Text>
                          </Box>
                        </VStack>
                      </HStack>

                      <HStack justify="center">
                        <Button
                          variant="outline"
                          borderRadius="xl"
                          onClick={() => {
                            setSearchTerm("")
                            setStatusFilter("all")
                            setDepartmentFilter("all")
                            setSortBy("id")
                            setSortOrder("asc")
                            resetPage()
                          }}
                          _hover={{ bg: "red.50", borderColor: "red.300", color: "red.600" }}
                          transition="all 0.2s"
                        >
                          Clear All Filters
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>

            {isLoading ? (
              <Box 
                bg={cardBg} 
                borderRadius="xl" 
                border="1px solid" 
                borderColor={borderColor} 
                overflow="hidden"
                boxShadow="lg"
                animation={`${fadeIn} 0.9s ease-out`}
              >
                <Box p={8}>
                  <VStack gap={6} align="stretch">
                    {[...Array(5)].map((_, i) => (
                      <HStack key={i} gap={4}>
                        <Skeleton w="50px" h="50px" borderRadius="full" />
                        <VStack align="start" gap={3} flex={1}>
                          <Skeleton h="24px" w="180px" />
                          <Skeleton h="18px" w="120px" />
                        </VStack>
                        <Skeleton h="24px" w="100px" />
                        <Skeleton h="24px" w="120px" />
                        <Skeleton h="24px" w="100px" />
                        <Skeleton h="24px" w="120px" />
                        <Skeleton h="24px" w="80px" />
                        <Skeleton h="40px" w="40px" borderRadius="lg" />
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </Box>
            ) : filteredEmployees.length > 0 ? (
              <>
                <Box 
                  bg={cardBg} 
                  borderRadius="xl" 
                  border="1px solid" 
                  borderColor={borderColor} 
                  overflow="hidden" 
                  boxShadow="lg"
                  animation={`${fadeIn} 1s ease-out`}
                >
                  <Box overflowX="auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ 
                          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                          borderBottom: `2px solid ${borderColor}` 
                        }}>
                          <th style={{ 
                            padding: '20px 16px', 
                            textAlign: 'center', 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: mutedTextColor,
                            minWidth: '60px'
                          }}>
                            #
                          </th>
                          <th style={{ 
                            padding: '20px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: mutedTextColor,
                            minWidth: '220px',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setSortBy("name")
                            setSortOrder(sortBy === "name" && sortOrder === "asc" ? "desc" : "asc")
                            resetPage()
                          }}
                          >
                            <HStack gap={2}>
                              <Text>Employee Name</Text>
                              {getSortIcon("name")}
                            </HStack>
                          </th>
                          <th style={{ 
                            padding: '20px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: mutedTextColor,
                            minWidth: '130px',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setSortBy("employee_id")
                            setSortOrder(sortBy === "employee_id" && sortOrder === "asc" ? "desc" : "asc")
                            resetPage()
                          }}
                          >
                            <HStack gap={2}>
                              <Text>Employee ID</Text>
                              {getSortIcon("employee_id")}
                            </HStack>
                          </th>
                          <th style={{ 
                            padding: '20px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: mutedTextColor,
                            minWidth: '130px'
                          }}>
                            CNIC
                          </th>
                          <th style={{ 
                            padding: '20px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: mutedTextColor,
                            minWidth: '130px'
                          }}>
                            Phone
                          </th>
                          <th style={{ 
                            padding: '20px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: mutedTextColor,
                            minWidth: '130px'
                          }}>
                            Department
                          </th>
                          <th style={{ 
                            padding: '20px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: mutedTextColor,
                            minWidth: '100px'
                          }}>
                            Status
                          </th>
                          <th style={{ 
                            padding: '20px 16px', 
                            textAlign: 'center', 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: mutedTextColor,
                            minWidth: '120px'
                          }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee: EmployeePublic, index: number) => (
                          <tr key={employee.id} style={{ 
                            borderBottom: `1px solid ${borderColor}`,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                            e.currentTarget.style.transform = 'scale(1.01)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                          >
                            <td style={{ padding: '20px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <Box 
                                p={2} 
                                bg="blue.50" 
                                borderRadius="full" 
                                w="40px" 
                                h="40px" 
                                display="flex" 
                                alignItems="center" 
                                justifyContent="center"
                                mx="auto"
                              >
                                <Text fontSize="sm" color="blue.600" fontWeight="600">
                                  {startIndex + index + 1}
                                </Text>
                              </Box>
                            </td>
                            <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                              <HStack gap={4} align="center">
                                <Box 
                                  p={3} 
                                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                                  borderRadius="full"
                                  boxShadow="md"
                                >
                                  <FaUsers fontSize="16px" color="white" />
                                </Box>
                                <VStack align="start" gap={1}>
                                  <Text fontSize="md" fontWeight="700" color={textColor}>
                                    {employee.first_name} {employee.last_name}
                                  </Text>
                                  <Text fontSize="xs" color={mutedTextColor} fontWeight="500">
                                    Hired: {new Date(employee.hire_date).toLocaleDateString()}
                                  </Text>
                                </VStack>
                              </HStack>
                            </td>
                            <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                              <Box 
                                p={2} 
                                bg="gray.50" 
                                borderRadius="lg" 
                                border="1px solid" 
                                borderColor="gray.200"
                              >
                                <Text fontSize="sm" color={textColor} fontWeight="600">
                                  {employee.employee_id}
                                </Text>
                              </Box>
                            </td>
                            <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                              <Text fontSize="sm" color={textColor} fontWeight="500">
                                {employee.cnic}
                              </Text>
                            </td>
                            <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                              <Text fontSize="sm" color={textColor} fontWeight="500">
                                {employee.phone}
                              </Text>
                            </td>
                            <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                              <Badge 
                                colorPalette="blue" 
                                variant="subtle" 
                                size="md"
                                borderRadius="lg"
                                px={3}
                                py={1}
                              >
                                {departmentMap.get(employee.department_id) || 'Unknown'}
                              </Badge>
                            </td>
                            <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                              <Badge
                                colorPalette={employee.is_active ? "green" : "red"}
                                variant="subtle"
                                size="md"
                                borderRadius="lg"
                                px={3}
                                py={1}
                              >
                                {employee.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td style={{ padding: '20px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <EmployeeActions employee={employee} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
                {totalPages > 1 && <PaginationBar />}
              </>
            ) : searchTerm || statusFilter !== "all" || departmentFilter !== "all" ? (
              <Box 
                bg={cardBg} 
                borderRadius="xl" 
                p={16} 
                border="2px dashed" 
                borderColor={borderColor} 
                textAlign="center"
                animation={`${fadeIn} 1.1s ease-out`}
              >
                <VStack gap={6} py={8}>
                  <Box 
                    p={6} 
                    bg="gray.50" 
                    borderRadius="full"
                    animation={`${pulse} 2s infinite`}
                  >
                    <FaUsers fontSize="64px" color={mutedTextColor} />
                  </Box>
                  <VStack gap={3}>
                    <Text fontSize="2xl" color={textColor} fontWeight="bold">
                      No employees match your filters
                    </Text>
                    <Text color={mutedTextColor} maxW="md" fontSize="lg">
                      Try adjusting your search criteria or filters to find the employees you're looking for.
                    </Text>
                  </VStack>
                  <HStack gap={3}>
                    <Button
                      variant="outline"
                      size="lg"
                      borderRadius="xl"
                      onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                        setDepartmentFilter("all")
                        resetPage()
                      }}
                      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                      transition="all 0.2s"
                    >
                      Clear All Filters
                    </Button>
                    <Button
                      variant="solid"
                      size="lg"
                      borderRadius="xl"
                      colorPalette="blue"
                      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                      transition="all 0.2s"
                    >
                      Add New Employee
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ) : (
              <Box 
                bg={cardBg} 
                borderRadius="xl" 
                p={16} 
                border="2px dashed" 
                borderColor={borderColor} 
                textAlign="center"
                animation={`${fadeIn} 1.1s ease-out`}
              >
                <VStack gap={6} py={8}>
                  <Box 
                    p={6} 
                    bg="gray.50" 
                    borderRadius="full"
                    animation={`${pulse} 2s infinite`}
                  >
                    <FaUsers fontSize="64px" color={mutedTextColor} />
                  </Box>
                  <VStack gap={3}>
                    <Text fontSize="2xl" color={textColor} fontWeight="bold">
                      No employees found
                    </Text>
                    <Text color={mutedTextColor} maxW="md" fontSize="lg">
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