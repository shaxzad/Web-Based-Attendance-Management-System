import React, { useMemo, useState, useCallback } from "react"
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Input,
  useDisclosure,
  Spinner,
  Badge
} from "@chakra-ui/react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { addDays, format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale/en-US"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./calendar.css"
import { HolidaysService } from "@/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import useCustomToast from "@/hooks/useCustomToast"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogCloseTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"

const locales = {
  "en-US": enUS,
}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

const HOLIDAY_COLORS: Record<string, string> = {
  public: "blue",
  company: "green",
  special: "orange",
}

export const Route = createFileRoute("/_layout/calendar")({
  component: HolidayCalendar,
})

function HolidayCalendar() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const { open: isOpen, onOpen, onClose } = useDisclosure()
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    holiday_date: "",
    holiday_type: "public",
    is_recurring: false,
    recurrence_pattern: "yearly",
    color: "#3182CE",
  })
  const [view, setView] = useState<any>(Views.MONTH)
  const [date, setDate] = useState(new Date())

  // Fetch holidays for the current month
  const { data, isLoading } = useQuery({
    queryKey: ["holidays", date.getFullYear(), date.getMonth() + 1],
    queryFn: () =>
      HolidaysService.readHolidays({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        limit: 100,
      }),
  })

  const holidays = data?.data || []

  // Map holidays to calendar events
  const events = useMemo(
    () =>
      holidays.map((h: any) => ({
        id: h.id,
        title: h.title,
        start: new Date(h.holiday_date),
        end: new Date(h.holiday_date),
        allDay: true,
        resource: h,
        color: h.color || HOLIDAY_COLORS[h.holiday_type] || "blue",
        holiday_type: h.holiday_type,
        is_recurring: h.is_recurring,
        recurrence_pattern: h.recurrence_pattern,
      })),
    [holidays]
  )

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: any) => HolidaysService.createHoliday({ requestBody: body }),
    onSuccess: () => {
      showSuccessToast("Holiday added successfully!")
      queryClient.invalidateQueries({ queryKey: ["holidays"] })
      onClose()
    },
    onError: () => showErrorToast("Failed to add holiday"),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => HolidaysService.updateHoliday({ holidayId: id, requestBody: body }),
    onSuccess: () => {
      showSuccessToast("Holiday updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["holidays"] })
      onClose()
    },
    onError: () => showErrorToast("Failed to update holiday"),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => HolidaysService.deleteHoliday({ holidayId: id }),
    onSuccess: () => {
      showSuccessToast("Holiday deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["holidays"] })
      onClose()
    },
    onError: () => showErrorToast("Failed to delete holiday"),
  })

  // Handlers
  const handleSelectSlot = useCallback((slotInfo: any) => {
    setForm({
      title: "",
      description: "",
      holiday_date: format(slotInfo.start, "yyyy-MM-dd"),
      holiday_type: "public",
      is_recurring: false,
      recurrence_pattern: "yearly",
      color: "#3182CE",
    })
    setSelectedEvent(null)
    onOpen()
  }, [onOpen])

  const handleSelectEvent = useCallback((event: any) => {
    setForm({
      ...event.resource,
      holiday_date: format(new Date(event.start), "yyyy-MM-dd"),
    })
    setSelectedEvent(event)
    onOpen()
  }, [onOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEvent) {
      updateMutation.mutate({ id: selectedEvent.id, ...form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id)
    }
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack gap={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Holiday Calendar
          </Heading>
          <Text color="gray.600" fontSize="md" mb={4}>
            Manage company holidays and public holidays with interactive calendar views
          </Text>
          
          {/* Holiday Stats */}
          <HStack gap={4} mb={4}>
            <Box bg="blue.50" p={3} borderRadius="md" border="1px solid" borderColor="blue.200" flex={1}>
              <Text fontSize="sm" color="blue.600" fontWeight="medium">Public Holidays</Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.700">
                {holidays.filter((h: any) => h.holiday_type === 'public').length}
              </Text>
            </Box>
            <Box bg="green.50" p={3} borderRadius="md" border="1px solid" borderColor="green.200" flex={1}>
              <Text fontSize="sm" color="green.600" fontWeight="medium">Company Holidays</Text>
              <Text fontSize="lg" fontWeight="bold" color="green.700">
                {holidays.filter((h: any) => h.holiday_type === 'company').length}
              </Text>
            </Box>
            <Box bg="orange.50" p={3} borderRadius="md" border="1px solid" borderColor="orange.200" flex={1}>
              <Text fontSize="sm" color="orange.600" fontWeight="medium">Special Events</Text>
              <Text fontSize="lg" fontWeight="bold" color="orange.700">
                {holidays.filter((h: any) => h.holiday_type === 'special').length}
              </Text>
            </Box>
            <Box bg="purple.50" p={3} borderRadius="md" border="1px solid" borderColor="purple.200" flex={1}>
              <Text fontSize="sm" color="purple.600" fontWeight="medium">Recurring</Text>
              <Text fontSize="lg" fontWeight="bold" color="purple.700">
                {holidays.filter((h: any) => h.is_recurring).length}
              </Text>
            </Box>
          </HStack>
        </Box>
        
        <Box bg="white" borderRadius="lg" p={6} boxShadow="sm" border="1px solid" borderColor="gray.200">
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={12}>
              <Spinner size="lg" color="primary.500" />
            </Box>
          ) : (
            <>
              <Box mb={4}>
                <HStack justify="space-between" align="center">
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                    {format(date, 'MMMM yyyy')}
                  </Text>
                  <HStack gap={2}>
                    <Badge colorScheme="blue" variant="subtle">Public</Badge>
                    <Badge colorScheme="green" variant="subtle">Company</Badge>
                    <Badge colorScheme="orange" variant="subtle">Special</Badge>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => {
                        setForm({
                          title: "",
                          description: "",
                          holiday_date: format(new Date(), "yyyy-MM-dd"),
                          holiday_type: "public",
                          is_recurring: false,
                          recurrence_pattern: "yearly",
                          color: "#3182CE",
                        })
                        setSelectedEvent(null)
                        onOpen()
                      }}
                    >
                      Add Holiday
                    </Button>
                  </HStack>
                </HStack>
              </Box>
              <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            onView={setView}
            view={view}
            date={date}
            onNavigate={setDate}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={(event: any) => ({
              style: {
                backgroundColor: event.color,
                borderRadius: "6px",
                color: "white",
                border: "none",
                padding: "2px 8px",
              },
            })}
            components={{
              event: (props: any) => (
                <Box p={1}>
                  <VStack gap={1} align="start">
                    <Text fontWeight="bold" fontSize="sm">
                      {props.title}
                    </Text>
                    <HStack gap={1}>
                      <Badge size="sm" colorScheme={HOLIDAY_COLORS[props.event.holiday_type] || "blue"}>
                        {props.event.holiday_type}
                      </Badge>
                      {props.event.is_recurring && (
                        <Badge size="sm" colorScheme="purple">Repeats</Badge>
                      )}
                    </HStack>
                  </VStack>
                </Box>
              ),
            }}
          />
            </>
          )}
        </Box>
      <DialogRoot open={isOpen} onOpenChange={({ open }) => open ? onOpen() : onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody>
              <Text mb={4} color="gray.600" fontSize="sm">
                {selectedEvent ? "Update the holiday details below." : "Fill in the details to add a new holiday."}
              </Text>
              <VStack gap={4} align="stretch">
                <Field required label="Title">
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))}
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={form.description || ""}
                    onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
                  />
                </Field>
                <Field required label="Date">
                  <Input
                    type="date"
                    value={form.holiday_date}
                    onChange={(e) => setForm((f: any) => ({ ...f, holiday_date: e.target.value }))}
                  />
                </Field>
                <Field required label="Type">
                  <select
                    value={form.holiday_type}
                    onChange={(e) => setForm((f: any) => ({ ...f, holiday_type: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="public">Public Holiday</option>
                    <option value="company">Company Holiday</option>
                    <option value="special">Special Event</option>
                  </select>
                </Field>
                <Field>
                  <Checkbox
                    checked={form.is_recurring}
                    onCheckedChange={({ checked }) => setForm((f: any) => ({ ...f, is_recurring: checked }))}
                  >
                    Repeat every year/month/week
                  </Checkbox>
                  {form.is_recurring && (
                    <select
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      value={form.recurrence_pattern}
                      onChange={(e) => setForm((f: any) => ({ ...f, recurrence_pattern: e.target.value }))}
                    >
                      <option value="yearly">Every Year</option>
                      <option value="monthly">Every Month</option>
                      <option value="weekly">Every Week</option>
                    </select>
                  )}
                </Field>
                <Field label="Color">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f: any) => ({ ...f, color: e.target.value }))}
                    width="60px"
                    height="40px"
                    p={0}
                  />
                </Field>
              </VStack>
            </DialogBody>
            <DialogFooter>
              {selectedEvent && (
                <Button colorScheme="red" mr={2} onClick={handleDelete} loading={deleteMutation.isPending}>
                  Delete
                </Button>
              )}
              <Button onClick={onClose} mr={2} variant="ghost">
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue" loading={createMutation.isPending || updateMutation.isPending}>
                {selectedEvent ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>
      </VStack>
    </Container>
  )
} 