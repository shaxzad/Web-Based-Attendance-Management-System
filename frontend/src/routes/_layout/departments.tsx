import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState, useMemo } from "react"

import {
  Badge,
  Box,
  Button,
  Container,
  HStack,
  Heading,
  Text,
  VStack,
  IconButton,
} from "@chakra-ui/react"

import { DepartmentsService } from "@/client"
import type { DepartmentPublic } from "@/client/types.gen"
import { handleError } from "@/utils"
import AddDepartment from "@/components/Departments/AddDepartment"
import DepartmentActions from "@/components/Departments/DepartmentActions"
import { AppTable, createStatusColumn } from "@/components/ui/table"

// Animation styles
const fadeIn = "opacity 0.3s ease-out"
const slideIn = "transform 0.4s ease-out"
const pulse = "transform 2s infinite"

const Departments = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Color mode values
  const bgColor = "gray.50"
  const cardBg = "white"
  const borderColor = "gray.200"
  const textColor = "gray.800"
  const mutedTextColor = "gray.600"

  const {
    data: departmentsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: () => DepartmentsService.readDepartments({}),
  })

  const departments = useMemo(() => {
    if (!departmentsResponse || departmentsResponse.length === 0) {
      return []
    }

    let filtered = [...departmentsResponse]

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((dept: DepartmentPublic) => 
        dept.name.toLowerCase().includes(term) ||
        (dept.description && dept.description.toLowerCase().includes(term))
      )
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((dept: DepartmentPublic) => {
        if (statusFilter === "active") return dept.is_active === true
        if (statusFilter === "inactive") return dept.is_active === false
        return true
      })
    }

    return filtered
  }, [departmentsResponse, searchTerm, statusFilter])

  if (error) {
    console.error("Error loading departments:", error)
  }

  // Define table columns
  const columns = [
    { key: 'id', label: '#' },
    { 
      key: 'name', 
      label: 'Department Name',
      render: (value: string, row: DepartmentPublic) => (
        <HStack gap={4} align="center">
          <Box 
            p={3} 
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
            borderRadius="full"
            boxShadow="md"
          >
            <Text fontSize="16px" color="white" fontWeight="bold">D</Text>
          </Box>
          <VStack align="start" gap={1}>
            <Text fontSize="md" fontWeight="700" color={textColor}>
              {value}
            </Text>
            <Text fontSize="xs" color={mutedTextColor} fontWeight="500">
              ID: {row.id.slice(0, 8)}...
            </Text>
          </VStack>
        </HStack>
      )
    },
    { 
      key: 'description', 
      label: 'Description',
      render: (value: string) => (
        <Text 
          fontSize="sm" 
          color={textColor} 
          maxW="280px" 
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {value || 'No description provided'}
        </Text>
      )
    },
    createStatusColumn('is_active', 'Status'),
    { 
      key: 'created_at', 
      label: 'Created Date',
      render: (value: string) => (
        <Text fontSize="sm" color={textColor} fontWeight="500">
          {new Date(value).toLocaleDateString()}
        </Text>
      )
    },
    { 
      key: 'actions', 
      label: 'Actions',
      width: "120px",
      render: (value: any, row: DepartmentPublic) => <DepartmentActions department={row} />
    }
  ]

  // Filter options
  const filterOptions = [
    { label: "All Status", value: "all" },
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
                    <Heading size="lg" color={textColor}>Department Management</Heading>
                    <Text color={mutedTextColor} fontSize="md" fontWeight="medium">
                      Organize your workforce into departments efficiently
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
                  <AddDepartment />
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
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Total Departments</Text>
                      <Text fontSize="3xl" fontWeight="bold" color={textColor}>{departments?.length || 0}</Text>
                      <HStack gap={1}>
                        <Text fontSize="12px" color="#3182ce">📈</Text>
                        <Text fontSize="xs" color="blue.500">+5% this month</Text>
                      </HStack>
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
                    bg="linear-gradient(90deg, #38a169 0%, #68d391 100%)"
                  />
                  <HStack justify="space-between">
                    <VStack align="start" gap={2}>
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Active Departments</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="green.600">
                        {departments?.filter(dept => dept.is_active).length || 0}
                      </Text>
                      <HStack gap={1}>
                        <Text fontSize="12px" color="#38a169">📈</Text>
                        <Text fontSize="xs" color="green.500">+12% this month</Text>
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
                      <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Recently Added</Text>
                      <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                        {departments?.filter(dept => {
                          const createdDate = new Date(dept.created_at);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return createdDate > thirtyDaysAgo;
                        }).length || 0}
                      </Text>
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
              data={departments}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Search departments by name or description..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              filterOptions={filterOptions}
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              onShowFilters={() => setShowFilters(!showFilters)}
              showFilters={showFilters}
              emptyMessage="No departments found. Start organizing your workforce by creating departments."
              actions={<AddDepartment />}
            />
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

export const Route = createFileRoute("/_layout/departments")({
  component: Departments,
})

export default Departments 