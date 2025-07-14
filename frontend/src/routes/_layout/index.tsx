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
import { FiUsers, FiTrendingUp, FiActivity, FiCalendar } from "react-icons/fi"
import { FaBuilding, FaRegCalendarAlt } from "react-icons/fa"

import { DepartmentsService, EmployeesService, HolidaysService } from "@/client"
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

  // Fetch holidays data
  const { data: holidaysResponse, isLoading: holidaysLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: () => HolidaysService.readHolidays({ limit: 100 }),
  })

  const employees = employeesResponse?.data || []
  const totalEmployees = employeesResponse?.count || 0
  const totalDepartments = departments?.length || 0
    const holidays = holidaysResponse?.data || []
  
  // Calculate statistics
  const activeEmployees = employees.filter(emp => emp.is_active).length
  const inactiveEmployees = totalEmployees - activeEmployees

  // Calculate holiday statistics
  const totalHolidays = holidays.length
  const publicHolidays = holidays.filter(h => h.holiday_type === 'public').length
  const companyHolidays = holidays.filter(h => h.holiday_type === 'company').length
  const recurringHolidays = holidays.filter(h => h.is_recurring).length
  
  // Get current year holidays
  const currentYear = new Date().getFullYear()
  const currentYearHolidays = holidays.filter(h => {
    const holidayYear = new Date(h.holiday_date).getFullYear()
    return holidayYear === currentYear
  })
  
  // Get upcoming holidays (next 30 days)
  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
  const upcomingHolidays = holidays.filter(h => {
    const holidayDate = new Date(h.holiday_date)
    return holidayDate >= today && holidayDate <= thirtyDaysFromNow
  })

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

  // Prepare holiday chart data
  const holidayTypeData = [
    { name: "Public Holidays", value: publicHolidays, color: "#3182CE" },
    { name: "Company Holidays", value: companyHolidays, color: "#38A169" },
    { name: "Special Events", value: holidays.filter(h => h.holiday_type === 'special').length, color: "#DD6B20" }
  ]

  // Monthly holiday distribution for current year
  const monthlyHolidayData = currentYearHolidays.reduce((acc, holiday) => {
    const month = new Date(holiday.holiday_date).getMonth()
    const monthName = new Date(2024, month).toLocaleString('default', { month: 'short' })
    acc[monthName] = (acc[monthName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const monthlyHolidayChartData = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ].map(month => ({
    month,
    holidays: monthlyHolidayData[month] || 0
  }))

  const isLoading = departmentsLoading || employeesLoading || holidaysLoading

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
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
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
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
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
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
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
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
            <HStack justify="space-between">
              <VStack align="start" gap={1}>
                <Text color="gray.600">Total Holidays</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {isLoading ? <Skeleton height="32px" /> : totalHolidays}
                </Text>
                <Text fontSize="sm" color="gray.500">{upcomingHolidays.length} upcoming</Text>
              </VStack>
              <Box p={3} bg="blue.100" borderRadius="full">
                <FiCalendar size={24} color="#3182CE" />
              </Box>
            </HStack>
          </Box>
        </GridItem>
      </Grid>

      {/* Charts Section */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6} mb={8}>
        {/* Department Employee Distribution */}
        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
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
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
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

      {/* Holiday Charts Section */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6} mb={8}>
        {/* Holiday Types Distribution */}
        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
            <Heading size="md" mb={4}>Holiday Types Distribution</Heading>
            {isLoading ? (
              <Skeleton height="300px" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={holidayTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {holidayTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </GridItem>

        {/* Monthly Holiday Distribution */}
        <GridItem>
          <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
            <Heading size="md" mb={4}>Monthly Holiday Distribution ({currentYear})</Heading>
            {isLoading ? (
              <Skeleton height="300px" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyHolidayChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="holidays" fill="#3182CE" name="Holidays" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </GridItem>
      </Grid>

      {/* Recent Hires Chart */}
      <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }} mb={8}>
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
      <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }}>
        <Heading size="md" mb={4}>Department Overview</Heading>
        {isLoading ? (
          <VStack gap={4}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height="60px" width="100%" rounded="xl" />
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
                _hover={{ bg: useColorModeValue('blue.50', 'gray.600'), boxShadow: 'md' }}
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

      {/* Upcoming Holidays Section */}
      <Box bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "lg", transform: "translateY(-2px) scale(1.02)" }} mb={8}>
        <HStack mb={2} gap={2}><FaRegCalendarAlt color="#3182CE" /><Heading size="md">Upcoming Holidays</Heading></HStack>
        <Text color="gray.500" fontSize="sm" mb={4}>See what's coming up in the next 30 days</Text>
        {isLoading ? (
          <VStack gap={4}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height="60px" width="100%" rounded="xl" />
            ))}
          </VStack>
        ) : upcomingHolidays.length > 0 ? (
          <VStack gap={4} align="stretch">
            {upcomingHolidays
              .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime())
              .slice(0, 5)
              .map((holiday, index) => (
                <Box
                  key={index}
                  p={4}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                  bg={useColorModeValue("gray.50", "gray.700")}
                  _hover={{ bg: useColorModeValue('blue.50', 'gray.600'), boxShadow: 'md' }}
                >
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontWeight="bold" fontSize="lg">{holiday.title}</Text>
                      <HStack gap={4}>
                        <Badge 
                          colorScheme={holiday.holiday_type === 'public' ? 'blue' : 'green'} 
                          variant="subtle"
                        >
                          {holiday.holiday_type}
                        </Badge>
                        {holiday.is_recurring && (
                          <Badge colorScheme="purple" variant="subtle">
                            Recurring
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                    <VStack align="end" gap={1}>
                      <Text fontSize="lg" fontWeight="bold" color="blue.500">
                        {new Date(holiday.holiday_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(holiday.holiday_date).toLocaleDateString('en-US', { 
                          weekday: 'long' 
                        })}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
          </VStack>
        ) : (
          <Box textAlign="center" color="gray.400" py={8}><Text>No upcoming holidays in the next 30 days</Text></Box>
        )}
      </Box>
    </Container>
  )
}
