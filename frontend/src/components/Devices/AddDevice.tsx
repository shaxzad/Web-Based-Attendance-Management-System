import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { AppModal } from '@/components/ui/modal';
import { useCustomToast } from '@/hooks/useCustomToast';
import { AttendanceService } from '@/client';
import type { ZKTecoDeviceCreate } from '@/client/types.gen';

interface AddDeviceProps {
  onDeviceAdded: () => void;
}

export const AddDevice: React.FC<AddDeviceProps> = ({ onDeviceAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useCustomToast();

  const [formData, setFormData] = useState<ZKTecoDeviceCreate>({
    device_name: '',
    device_ip: '',
    device_port: 4370,
    device_id: '',
    location: '',
    description: '',
    is_active: true,
    sync_interval: 5,
    device_status: 'offline'
  });

  const handleInputChange = (field: keyof ZKTecoDeviceCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      await AttendanceService.createZktecoDevice({
        requestBody: formData
      });
      
      showToast('Success', 'Device added successfully', 'success');
      handleClose();
      onDeviceAdded();
    } catch (error) {
      showToast('Error', 'Failed to add device', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({
      device_name: '',
      device_ip: '',
      device_port: 4370,
      device_id: '',
      location: '',
      description: '',
      is_active: true,
      sync_interval: 5,
      device_status: 'offline'
    });
  };

  return (
    <>
      <Button
        colorScheme="blue"
        size="lg"
        fontWeight="bold"
        onClick={() => setIsOpen(true)}
        _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
        transition="all 0.2s"
      >
        Add Device
      </Button>

      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add New ZKTeco Device"
        submitText="Add Device"
        cancelText="Cancel"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          <Text color="gray.600" fontSize="sm">
            Fill in the details to add a new ZKTeco device.
          </Text>
          
          <HStack gap={4}>
            <Field required label="Device Name">
              <Input
                value={formData.device_name || ''}
                onChange={(e) => handleInputChange('device_name', e.target.value)}
                placeholder="Enter device name"
              />
            </Field>
            
            <Field required label="Device IP">
              <Input
                value={formData.device_ip || ''}
                onChange={(e) => handleInputChange('device_ip', e.target.value)}
                placeholder="192.168.1.100"
              />
            </Field>
          </HStack>

          <HStack gap={4}>
            <Field label="Device Port">
              <Input
                type="number"
                value={formData.device_port?.toString() || ''}
                onChange={(e) => handleInputChange('device_port', parseInt(e.target.value) || 4370)}
                placeholder="4370"
              />
            </Field>
            
            <Field required label="Device ID">
              <Input
                value={formData.device_id || ''}
                onChange={(e) => handleInputChange('device_id', e.target.value)}
                placeholder="DEVICE-001"
              />
            </Field>
          </HStack>

          <Field label="Location">
            <Input
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Office Building, Floor 1"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Device description and notes"
              rows={3}
            />
          </Field>

          <HStack gap={4}>
            <Field label="Sync Interval (minutes)">
              <Input
                type="number"
                value={formData.sync_interval?.toString() || ''}
                onChange={(e) => handleInputChange('sync_interval', parseInt(e.target.value) || 5)}
                placeholder="5"
              />
            </Field>
            
            <Field label="Active Device">
              <HStack>
                <Checkbox
                  checked={formData.is_active || false}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Text fontSize="sm" color="gray.600">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Text>
              </HStack>
            </Field>
          </HStack>
        </VStack>
      </AppModal>
    </>
  );
}; 