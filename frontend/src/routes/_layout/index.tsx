import { 
  Box, 
  Container, 
  Text, 
  Grid, 
  GridItem, 
  Heading,
  HStack,
  VStack,
  Badge,
  Skeleton
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { FiUsers, FiTrendingUp, FiActivity } from "react-icons/fi"
import { FaBuilding } from "react-icons/fa"

import { DepartmentsService, EmployeesService } from "@/client"
import useAuth from "@/hooks/useAuth"
import { useColorModeValue } from "@/components/ui/color-mode"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const bgColor = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")

  // Fetch departments and employees data
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => DepartmentsService.readDepartments({ limit: 100 }),
  })

  const { data: employeesResponse, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => EmployeesService.readEmployees({ limit: 100 }),
  })

  const employees = employeesResponse?.data || []
  const totalEmployees = employeesResponse?.count || 0
  const totalDepartments = departments?.length || 0

  // Calculate statistics
  const activeEmployees = employees.filter(emp => emp.is_active).length
  const inactiveEmployees = totalEmployees - activeEmployees

  // Prepare data for charts
  const departmentEmployeeData = departments?.map(dept => {
    const deptEmployees = employees.filter(emp => emp.department_id === dept.id)
    return {
      name: dept.name,
      employees: deptEmployees.length,
      active: deptEmployees.filter(emp => emp.is_active).length,
      inactive: deptEmployees.filter(emp => !emp.is_active).length
    }
  }) || []

  const employeeStatusData = [
    { name: "Active", value: activeEmployees, color: "#48BB78" },
    { name: "Inactive", value: inactiveEmployees, color: "#F56565" }
  ]

  const monthlyHireData = employees.reduce((acc, emp) => {
    const hireDate = new Date(emp.hire_date)
    const monthYear = `${hireDate.getFullYear()}-${String(hireDate.getMonth() + 1).padStart(2, '0')}`
    acc[monthYear] = (acc[monthYear] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const monthlyHireChartData = Object.entries(monthlyHireData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, count]) => ({
      month: month.split('-')[1] + '/' + month.split('-')[0].slice(-2),
      hires: count
    }))

  const isLoading = departmentsLoading || employeesLoading

  return (
    <Container maxW="full" p={4}>
      {/* Welcome Section */}
      <Box mb={8}>
        <Text fontSize="3xl" fontWeight="bold" mb={2}>
          Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
        </Text>
        <Text fontSize="lg" color="gray.600">
          Welcome back! Here's what's happening with your organization today.
        </Text>
      </Box>

      {/* Statistics Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={8}>
        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md" p={6}>
            <HStack justify="space-between">
              <VStack align="start" gap={1}>
                <Text color="gray.600">Total Employees</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {isLoading ? <Skeleton height="32px" /> : totalEmployees}
                </Text>
                <Text fontSize="sm" color="gray.500">▲ 12.5%</Text>
              </VStack>
              <Box p={3} bg="blue.100" borderRadius="full">
                <FiUsers size={24} color="#3182CE" />
              </Box>
            </HStack>
          </Box>
        </GridItem>

        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md" p={6}>
            <HStack justify="space-between">
              <VStack align="start" gap={1}>
                <Text color="gray.600">Active Employees</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {isLoading ? <Skeleton height="32px" /> : activeEmployees}
                </Text>
                <Text fontSize="sm" color="gray.500">▲ 8.2%</Text>
              </VStack>
              <Box p={3} bg="green.100" borderRadius="full">
                <FiActivity size={24} color="#38A169" />
              </Box>
            </HStack>
          </Box>
        </GridItem>

        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md" p={6}>
            <HStack justify="space-between">
              <VStack align="start" gap={1}>
                <Text color="gray.600">Departments</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {isLoading ? <Skeleton height="32px" /> : totalDepartments}
                </Text>
                <Text fontSize="sm" color="gray.500">▲ 3.1%</Text>
              </VStack>
              <Box p={3} bg="purple.100" borderRadius="full">
                <FaBuilding size={24} color="#805AD5" />
              </Box>
            </HStack>
          </Box>
        </GridItem>

        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md" p={6}>
            <HStack justify="space-between">
              <VStack align="start" gap={1}>
                <Text color="gray.600">Growth Rate</Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {isLoading ? <Skeleton height="32px" /> : "15.3%"}
                </Text>
                <Text fontSize="sm" color="gray.500">▲ This month</Text>
              </VStack>
              <Box p={3} bg="orange.100" borderRadius="full">
                <FiTrendingUp size={24} color="#DD6B20" />
              </Box>
            </HStack>
          </Box>
        </GridItem>
      </Grid>

      {/* Charts Section */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6} mb={8}>
        {/* Department Employee Distribution */}
        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md" p={6}>
            <Heading size="md" mb={4}>Employees by Department</Heading>
            {isLoading ? (
              <Skeleton height="300px" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentEmployeeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#48BB78" name="Active" />
                  <Bar dataKey="inactive" fill="#F56565" name="Inactive" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </GridItem>
        {/* Employee Status Distribution */}
        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md" p={6}>
            <Heading size="md" mb={4}>Employee Status Distribution</Heading>
            {isLoading ? (
              <Skeleton height="300px" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={employeeStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {employeeStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </GridItem>
      </Grid>

      {/* Recent Hires Chart */}
      <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md" p={6} mb={8}>
        <Heading size="md" mb={4}>Recent Hires (Last 6 Months)</Heading>
        {isLoading ? (
          <Skeleton height="300px" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyHireChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="hires" 
                stroke="#3182CE" 
                strokeWidth={3}
                dot={{ fill: "#3182CE", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>

      {/* Department List with Employee Counts */}
      <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md" p={6}>
        <Heading size="md" mb={4}>Department Overview</Heading>
        {isLoading ? (
          <VStack gap={4}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height="60px" width="100%" />
            ))}
          </VStack>
        ) : (
          <VStack gap={4} align="stretch">
            {departmentEmployeeData.map((dept, index) => (
              <Box
                key={index}
                p={4}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                bg={useColorModeValue("gray.50", "gray.700")}
              >
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Text fontWeight="bold" fontSize="lg">{dept.name}</Text>
                    <HStack gap={4}>
                      <Badge colorScheme="green" variant="subtle">
                        {dept.active} Active
                      </Badge>
                      <Badge colorScheme="red" variant="subtle">
                        {dept.inactive} Inactive
                      </Badge>
                    </HStack>
                  </VStack>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {dept.employees}
                  </Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Container>
  )
}
