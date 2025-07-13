import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

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
} from "@chakra-ui/react"
import { FaBuilding } from "react-icons/fa"

import { DepartmentsService } from "@/client"
import type { DepartmentPublic } from "@/client/types.gen"
import { handleError } from "@/utils"
import AddDepartment from "@/components/Departments/AddDepartment"
import DeleteDepartment from "@/components/Departments/DeleteDepartment"
import EditDepartment from "@/components/Departments/EditDepartment"

const Departments = () => {
  const {
    data: departments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: () => DepartmentsService.readDepartments({}),
  })

  if (error) {
    console.error("Error loading departments:", error)
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
                    <FaBuilding fontSize="24px" color="#3182ce" />
                  </Box>
                  <VStack align="start" gap={1}>
                    <Heading size="lg">Departments</Heading>
                    <Text color="gray.600" fontSize="md">
                      Organize your workforce into departments
                    </Text>
                  </VStack>
                </HStack>
                <AddDepartment />
              </HStack>
              
              {/* Stats Cards */}
              <HStack gap={4} mb={6}>
                <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" flex={1} boxShadow="sm">
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Total Departments</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="gray.800">{departments?.length || 0}</Text>
                    </VStack>
                    <Box p={2} bg="blue.50" borderRadius="md">
                      <FaBuilding fontSize="20px" color="#3182ce" />
                    </Box>
                  </HStack>
                </Box>
                <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" flex={1} boxShadow="sm">
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Active Departments</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {departments?.filter(dept => dept.is_active).length || 0}
                      </Text>
                    </VStack>
                    <Box p={2} bg="green.50" borderRadius="md">
                      <FaBuilding fontSize="20px" color="#38a169" />
                    </Box>
                  </HStack>
                </Box>
                <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" flex={1} boxShadow="sm">
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Recently Added</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                        {departments?.filter(dept => {
                          const createdDate = new Date(dept.created_at);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return createdDate > thirtyDaysAgo;
                        }).length || 0}
                      </Text>
                    </VStack>
                    <Box p={2} bg="purple.50" borderRadius="md">
                      <FaBuilding fontSize="20px" color="#805ad5" />
                    </Box>
                  </HStack>
                </Box>
              </HStack>
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
              ) : departments && departments.length > 0 ? (
                <VStack gap={4} align="stretch">
                  {departments.map((department: DepartmentPublic) => (
                    <Box 
                      key={department.id} 
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
                              <FaBuilding fontSize="16px" color="#3182ce" />
                            </Box>
                            <VStack align="start" gap={1}>
                              <Heading size="md" color="gray.800">
                                {department.name}
                              </Heading>
                              <HStack gap={2}>
                                <Badge
                                  colorPalette={department.is_active ? "green" : "red"}
                                  variant="subtle"
                                  size="sm"
                                >
                                  {department.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <Badge colorPalette="blue" variant="subtle" size="sm">
                                  Department
                                </Badge>
                              </HStack>
                            </VStack>
                          </HStack>
                          
                          <HStack gap={6}>
                            <VStack align="start" gap={1}>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium">CREATED</Text>
                              <Text fontSize="sm" color="gray.700" fontWeight="500">
                                {new Date(department.created_at).toLocaleDateString()}
                              </Text>
                            </VStack>
                            <VStack align="start" gap={1}>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium">LAST UPDATED</Text>
                              <Text fontSize="sm" color="gray.700" fontWeight="500">
                                {new Date(department.updated_at).toLocaleDateString()}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          {department.description && (
                            <VStack align="start" gap={1}>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium">DESCRIPTION</Text>
                              <Text fontSize="sm" color="gray.700">{department.description}</Text>
                            </VStack>
                          )}
                        </VStack>
                        
                        <VStack gap={2} align="end">
                          <HStack gap={2}>
                            <EditDepartment department={department} />
                            <DeleteDepartment department={department} />
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box bg="white" borderRadius="lg" p={12} border="2px dashed" borderColor="gray.300" textAlign="center">
                  <VStack gap={4} py={8}>
                    <Box p={4} bg="gray.50" borderRadius="full">
                      <FaBuilding fontSize="48px" color="#a0aec0" />
                    </Box>
                    <VStack gap={2}>
                      <Text fontSize="xl" color="gray.600" fontWeight="semibold">
                        No departments found
                      </Text>
                      <Text color="gray.500" maxW="md">
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