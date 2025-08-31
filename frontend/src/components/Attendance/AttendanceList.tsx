import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomToast } from '@/hooks/useCustomToast';
import { OpenAPI } from '@/client';
import { Attendance, Employee, Device } from '@/client/schemas.gen';

interface AttendanceListProps {
  attendances: Attendance[];
  employees: Employee[];
  devices: Device[];
  onRefresh: () => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({ 
  attendances, 
  employees, 
  devices, 
  onRefresh 
}) => {
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>(attendances);
  const [filters, setFilters] = useState({
    employee_id: '',
    device_id: '',
    status: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  const { showToast } = useCustomToast();

  useEffect(() => {
    applyFilters();
  }, [attendances, filters]);

  const applyFilters = () => {
    let filtered = [...attendances];

    if (filters.employee_id) {
      filtered = filtered.filter(a => a.employee_id === filters.employee_id);
    }

    if (filters.device_id) {
      filtered = filtered.filter(a => a.zkteco_device_id === filters.device_id);
    }

    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    if (filters.start_date) {
      const startDate = new Date(filters.start_date);
      filtered = filtered.filter(a => new Date(a.check_in_time) >= startDate);
    }

    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      filtered = filtered.filter(a => new Date(a.check_in_time) <= endDate);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(a => {
        const employee = employees.find(e => e.id === a.employee_id);
        return employee?.name?.toLowerCase().includes(searchLower) ||
               employee?.employee_id?.toLowerCase().includes(searchLower);
      });
    }

    setFilteredAttendances(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      employee_id: '',
      device_id: '',
      status: '',
      start_date: '',
      end_date: '',
      search: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>;
      case 'half_day':
        return <Badge className="bg-orange-500">Half Day</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.name} (${employee.employee_id})` : 'Unknown Employee';
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.device_name : 'Unknown Device';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Employee</Label>
              <Input
                id="search"
                placeholder="Search by name or employee ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select value={filters.employee_id} onValueChange={(value) => handleFilterChange('employee_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="device">Device</Label>
              <Select value={filters.device_id} onValueChange={(value) => handleFilterChange('device_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Devices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Devices</SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.device_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Work Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendances.map((attendance) => (
              <TableRow key={attendance.id}>
                <TableCell className="font-medium">
                  {getEmployeeName(attendance.employee_id)}
                </TableCell>
                <TableCell>
                  {new Date(attendance.check_in_time).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(attendance.check_in_time).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  {attendance.check_out_time 
                    ? new Date(attendance.check_out_time).toLocaleTimeString()
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  {attendance.zkteco_device_id 
                    ? getDeviceName(attendance.zkteco_device_id)
                    : 'Manual Entry'
                  }
                </TableCell>
                <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                <TableCell>
                  {attendance.work_hours 
                    ? `${attendance.work_hours.toFixed(2)}h`
                    : '-'
                  }
                </TableCell>
              </TableRow>
            ))}
            {filteredAttendances.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No attendance records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAttendances.length} of {attendances.length} records
        </div>
      </CardContent>
    </Card>
  );
}; 