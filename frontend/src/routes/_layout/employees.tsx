import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
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
} from "@chakra-ui/react"
import { FaUsers } from "react-icons/fa"
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

  const {
    data: employeesResponse,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees", page, pageSize],
    queryFn: () =>
      EmployeesService.readEmployees({
        skip: (page - 1) * pageSize,
        limit: pageSize,
      }),
    // keepPreviousData: true, // REMOVE for React Query v3
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

  const employees = employeesResponse?.data || []
  const totalCount = employeesResponse?.count || 0
  const departmentsList = departments || []
  const isLoading = employeesLoading || departmentsLoading

  // Create a map of department IDs to names for quick lookup
  const departmentMap = new Map<string, string>()
  departmentsList.forEach((dept: DepartmentPublic) => {
    departmentMap.set(dept.id, dept.name)
  })

  const totalPages = Math.ceil(totalCount / pageSize)

  // Modern pagination bar
  const PaginationBar = () => {
    return (
      <HStack justify="space-between" mt={8} flexWrap="wrap" gap={2}>
        <HStack gap={2}>
          <Text fontSize="sm" color="gray.600">
            Showing {employees.length ? (page - 1) * pageSize + 1 : 0} -
            {Math.min(page * pageSize, totalCount)} of {totalCount} employees
          </Text>
          <select
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}
            value={pageSize}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
          >
            {PAGE_SIZE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        </HStack>
        
        <PaginationRoot
          count={totalCount}
          pageSize={pageSize}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </HStack>
    )
  }

  return (
    <Box minH="100vh" bg="brand.accent">
      <Container maxW="7xl" py={8}>
        <Box flex={1}>
          <VStack gap={6} align="stretch">
            <HStack justify="space-between" align="center">
              <HStack gap={3}>
                <FaUsers fontSize="24px" />
                <Heading size="lg">Employees</Heading>
              </HStack>
              <AddEmployee />
            </HStack>

            {isLoading ? (
              <VStack gap={4} align="stretch">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} h="120px" borderRadius="md" />
                ))}
              </VStack>
            ) : employees.length > 0 ? (
              <>
                <VStack gap={4} align="stretch">
                  {employees.map((employee: EmployeePublic) => (
                    <Box key={employee.id} shadow="sm" bg="white" borderRadius="md" p={6} borderLeft="4px solid" borderColor="brand.primary">
                      <VStack align="start" gap={4}>
                        <HStack justify="space-between" align="center" w="full">
                          <VStack align="start" gap={1}>
                            <Heading size="md">
                              {employee.first_name} {employee.last_name}
                            </Heading>
                            <HStack gap={2}>
                              <Badge
                                colorPalette={employee.is_active ? "green" : "red"}
                                variant="subtle"
                              >
                                {employee.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Text fontSize="sm" color="gray.500">
                                ID: {employee.employee_id}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                CNIC: {employee.cnic}
                              </Text>
                            </HStack>
                            <HStack gap={4}>
                              <Text fontSize="sm" color="gray.600">
                                Phone: {employee.phone}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                              Hired: {new Date(employee.hire_date).toLocaleDateString()}
                            </Text>
                          </VStack>
                          <HStack gap={2}>
                            <Text fontSize="sm" color="gray.500">
                              Department: {departmentMap.get(employee.department_id) || 'Unknown Department'}
                            </Text>
                            <HStack gap={2}>
                              <EditEmployee employee={employee} />
                              <DeleteEmployee employee={employee} />
                            </HStack>
                          </HStack>
                        </HStack>
                        {employee.address && (
                          <Box pt={2}>
                            <Text color="gray.600">
                              <strong>Address:</strong> {employee.address}
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
                {totalPages > 1 && <PaginationBar />}
              </>
            ) : (
              <Box bg="white" borderRadius="md" p={8} borderLeft="4px solid" borderColor="brand.primary">
                <VStack gap={4} py={8}>
                  <FaUsers fontSize="48px" color="gray" />
                  <Text fontSize="lg" color="gray.500">
                    No employees found
                  </Text>
                  <Text color="gray.400">
                    Create your first employee to get started
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

export const Route = createFileRoute("/_layout/employees")({
  component: Employees,
})

export default Employees 