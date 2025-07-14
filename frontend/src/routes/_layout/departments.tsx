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
  Skeleton,
  Text,
  VStack,
  IconButton,
} from "@chakra-ui/react"

import { 
  FaBuilding, 
  FaChartLine,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaDownload,
  FaCog,
  FaFilter,
  FaTimes
} from "react-icons/fa"

import { DepartmentsService } from "@/client"
import type { DepartmentPublic } from "@/client/types.gen"
import { handleError } from "@/utils"
import AddDepartment from "@/components/Departments/AddDepartment"
import DepartmentActions from "@/components/Departments/DepartmentActions"

// Animation styles
const fadeIn = "opacity 0.3s ease-out"
const slideIn = "transform 0.4s ease-out"
const pulse = "transform 2s infinite"

const Departments = () => {
  const [sortBy, setSortBy] = useState("id") // id, name, created_at
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
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

    const sorted = [...departmentsResponse]
    sorted.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "created_at":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
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

    return sorted
  }, [departmentsResponse, sortBy, sortOrder])

  if (error) {
    console.error("Error loading departments:", error)
  }

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <FaSort fontSize="12px" />
    return sortOrder === "asc" ? <FaSortUp fontSize="12px" /> : <FaSortDown fontSize="12px" />
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
                    <FaBuilding fontSize="28px" color="white" />
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
                        <FaChartLine fontSize="12px" color="#3182ce" />
                        <Text fontSize="xs" color="blue.500">+5% this month</Text>
                      </HStack>
                    </VStack>
                    <Box p={3} bg="blue.50" borderRadius="xl">
                      <FaBuilding fontSize="24px" color="#3182ce" />
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
                        <FaChartLine fontSize="12px" color="#38a169" />
                        <Text fontSize="xs" color="green.500">+12% this month</Text>
                      </HStack>
                    </VStack>
                    <Box p={3} bg="green.50" borderRadius="xl">
                      <FaPlus fontSize="24px" color="#38a169" />
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

            {/* Enhanced Sort Controls */}
            <Box 
              bg={cardBg} 
              p={6} 
              borderRadius="xl" 
              border="1px solid" 
              borderColor={borderColor} 
              boxShadow="lg"
              animation={`${fadeIn} 0.8s ease-out`}
            >
              <HStack justify="space-between" align="center">
                <HStack gap={4}>
                  <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Sort by:</Text>
                  <select
                    value={sortBy}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
                    style={{
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
                    <option value="created_at">Created Date</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value as "asc" | "desc")}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `2px solid ${borderColor}`,
                      fontSize: '14px',
                      backgroundColor: cardBg,
                      color: textColor,
                      fontWeight: '500'
                    }}
                  >
                    <option value="asc">↑ Ascending</option>
                    <option value="desc">↓ Descending</option>
                  </select>
                </HStack>
                <Button
                  aria-label="Toggle filters"
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="md"
                  borderRadius="xl"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  {showFilters ? <FaTimes /> : <FaFilter />}
                  {showFilters ? " Hide Filters" : " Show Filters"}
                </Button>
              </HStack>

              {/* Enhanced Filters */}
              {showFilters && (
                <Box 
                  pt={6} 
                  borderTop="2px solid" 
                  borderColor={borderColor}
                  animation={`${fadeIn} 0.3s ease-out`}
                >
                  <VStack gap={4} align="stretch">
                    <HStack gap={6} flexWrap="wrap">
                      <VStack align="start" gap={2}>
                        <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Status Filter</Text>
                        <select
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
                        <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Results</Text>
                        <Box 
                          p={3} 
                          bg="blue.50" 
                          borderRadius="lg" 
                          border="1px solid" 
                          borderColor="blue.200"
                        >
                          <Text fontSize="sm" color="blue.700" fontWeight="600">
                            {departments.length} department{departments.length !== 1 ? 's' : ''} found
                          </Text>
                        </Box>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>
              )}
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
                        <Skeleton h="24px" w="200px" />
                        <Skeleton h="24px" w="100px" />
                        <Skeleton h="24px" w="120px" />
                        <Skeleton h="40px" w="40px" borderRadius="lg" />
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </Box>
            ) : departments && departments.length > 0 ? (
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
                        }}
                        >
                          <HStack gap={2}>
                            <Text>Department Name</Text>
                            {getSortIcon("name")}
                          </HStack>
                        </th>
                        <th style={{ 
                          padding: '20px 16px', 
                          textAlign: 'left', 
                          fontWeight: '700', 
                          fontSize: '14px',
                          color: mutedTextColor,
                          minWidth: '320px'
                        }}>
                          Description
                        </th>
                        <th style={{ 
                          padding: '20px 16px', 
                          textAlign: 'left', 
                          fontWeight: '700', 
                          fontSize: '14px',
                          color: mutedTextColor,
                          minWidth: '120px'
                        }}>
                          Status
                        </th>
                        <th style={{ 
                          padding: '20px 16px', 
                          textAlign: 'left', 
                          fontWeight: '700', 
                          fontSize: '14px',
                          color: mutedTextColor,
                          minWidth: '140px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setSortBy("created_at")
                          setSortOrder(sortBy === "created_at" && sortOrder === "asc" ? "desc" : "asc")
                        }}
                        >
                          <HStack gap={2}>
                            <Text>Created Date</Text>
                            {getSortIcon("created_at")}
                          </HStack>
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
                      {departments.map((department: DepartmentPublic, index: number) => (
                        <tr key={department.id} style={{ 
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
                                {index + 1}
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
                                <FaBuilding fontSize="16px" color="white" />
                              </Box>
                              <VStack align="start" gap={1}>
                                <Text fontSize="md" fontWeight="700" color={textColor}>
                                  {department.name}
                                </Text>
                                <Text fontSize="xs" color={mutedTextColor} fontWeight="500">
                                  ID: {department.id.slice(0, 8)}...
                                </Text>
                              </VStack>
                            </HStack>
                          </td>
                          <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
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
                              {department.description || 'No description provided'}
                            </Text>
                          </td>
                          <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                            <Badge
                              colorPalette={department.is_active ? "green" : "red"}
                              variant="subtle"
                              size="md"
                              borderRadius="lg"
                              px={3}
                              py={1}
                            >
                              {department.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                            <Text fontSize="sm" color={textColor} fontWeight="500">
                              {new Date(department.created_at).toLocaleDateString()}
                            </Text>
                          </td>
                          <td style={{ padding: '20px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <DepartmentActions department={department} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
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
                    <FaBuilding fontSize="64px" color={mutedTextColor} />
                  </Box>
                  <VStack gap={3}>
                    <Text fontSize="2xl" color={textColor} fontWeight="bold">
                      No departments found
                    </Text>
                    <Text color={mutedTextColor} maxW="md" fontSize="lg">
                      Start organizing your workforce by creating departments. Departments help you group employees and manage them more effectively.
                    </Text>
                  </VStack>
                  <Box mt={4}>
                    <AddDepartment />
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

export const Route = createFileRoute("/_layout/departments")({
  component: Departments,
})

export default Departments 