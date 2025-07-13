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
              <HStack justify="space-between" align="center">
                <HStack gap={3}>
                  <FaBuilding fontSize="24px" />
                  <Heading size="lg">Departments</Heading>
                </HStack>
                <AddDepartment />
              </HStack>

              {isLoading ? (
                <VStack gap={4} align="stretch">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} h="120px" borderRadius="md" />
                  ))}
                </VStack>
              ) : departments && departments.length > 0 ? (
                <VStack gap={4} align="stretch">
                  {departments.map((department: DepartmentPublic) => (
                    <Box key={department.id} shadow="sm" bg="white" borderRadius="md" p={6} borderLeft="4px solid" borderColor="brand.primary">
                      <VStack align="start" gap={4}>
                        <HStack justify="space-between" align="center" w="full">
                          <VStack align="start" gap={1}>
                            <Heading size="md">{department.name}</Heading>
                            <HStack gap={2}>
                              <Badge
                                colorPalette={department.is_active ? "green" : "red"}
                                variant="subtle"
                              >
                                {department.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Text fontSize="sm" color="gray.500">
                                Created: {new Date(department.created_at).toLocaleDateString()}
                              </Text>
                            </HStack>
                          </VStack>
                          <HStack gap={2}>
                            <EditDepartment department={department} />
                            <DeleteDepartment department={department} />
                          </HStack>
                        </HStack>
                        {department.description && (
                          <Box pt={2}>
                            <Text color="gray.600">{department.description}</Text>
                          </Box>
                        )}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box bg="white" borderRadius="md" p={8} borderLeft="4px solid" borderColor="brand.primary">
                  <VStack gap={4} py={8}>
                    <FaBuilding fontSize="48px" color="gray" />
                    <Text fontSize="lg" color="gray.500">
                      No departments found
                    </Text>
                    <Text color="gray.400">
                      Create your first department to get started
                    </Text>
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