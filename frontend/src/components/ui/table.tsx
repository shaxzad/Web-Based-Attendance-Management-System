import React from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Button,
  Input,
  Flex,
  Spinner,
} from '@chakra-ui/react';

interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface AppTableProps {
  data: any[];
  columns: TableColumn[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterOptions?: {
    label: string;
    value: string;
  }[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  onShowFilters?: () => void;
  showFilters?: boolean;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

export const AppTable: React.FC<AppTableProps> = ({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filterOptions,
  filterValue,
  onFilterChange,
  onShowFilters,
  showFilters = false,
  emptyMessage = "No data available",
  actions,
}) => {
  const renderCell = (column: TableColumn, row: any) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    return <Text>{value || '-'}</Text>;
  };

  return (
    <Box>
      {/* Search and Filters */}
      <Flex gap={4} mb={6} align="center" justify="space-between">
        <HStack gap={4} flex={1}>
          {onSearchChange && (
            <Box position="relative" flex={1}>
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                pr="40px"
              />
              <Box
                position="absolute"
                right={3}
                top="50%"
                transform="translateY(-50%)"
                color="gray.400"
              >
                🔍
              </Box>
            </Box>
          )}
          
          {filterOptions && onFilterChange && (
            <select
              value={filterValue}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFilterChange(e.target.value)}
              style={{
                width: '200px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {onShowFilters && (
            <Button
              variant="outline"
              onClick={onShowFilters}
            >
              <Box mr={2}>🔍</Box>
              Show Filters
            </Button>
          )}
        </HStack>
        
        {actions && (
          <Box>
            {actions}
          </Box>
        )}
      </Flex>

      {/* Table */}
      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.200" overflow="hidden">
        {isLoading ? (
          <Box p={8} textAlign="center">
            <Spinner size="lg" colorScheme="blue" />
            <Text mt={4} color="gray.500">Loading...</Text>
          </Box>
        ) : data.length === 0 ? (
          <Box p={8} textAlign="center">
            <Text color="gray.500">{emptyMessage}</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Box as="table" w="full" borderCollapse="collapse">
              <Box as="thead">
                <Box as="tr" bg="gray.50">
                  {columns.map((column) => (
                    <Box
                      as="th"
                      key={column.key}
                      width={column.width}
                      color="gray.700"
                      fontWeight="semibold"
                      fontSize="sm"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      p={4}
                      textAlign="left"
                    >
                      {column.label}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {data.map((row, index) => (
                  <Box
                    as="tr"
                    key={row.id || index}
                    _hover={{ bg: "gray.50" }}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                  >
                    {columns.map((column) => (
                      <Box
                        as="td"
                        key={column.key}
                        py={4}
                        px={4}
                        borderBottom="1px solid"
                        borderColor="gray.100"
                      >
                        {renderCell(column, row)}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Helper functions for common column types
export const createAvatarColumn = (key: string, label: string): TableColumn => ({
  key,
  label,
  render: (value: any) => renderAvatar(value),
});

export const createStatusColumn = (key: string, label: string): TableColumn => ({
  key,
  label,
  render: (value: any) => renderStatusBadge(value),
});

export const createActionsColumn = (key: string, label: string, actions: React.ReactNode): TableColumn => ({
  key,
  label,
  render: () => actions,
  width: "100px",
});

// Helper function for rendering avatar
const renderAvatar = (name: string): React.ReactNode => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <HStack gap={3}>
      <Box
        w="40px"
        h="40px"
        borderRadius="full"
        bg="purple.500"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="white" fontWeight="bold" fontSize="sm">
          {initials}
        </Text>
      </Box>
      <VStack align="start" gap={0}>
        <Text fontWeight="medium">{name}</Text>
        <Text fontSize="sm" color="gray.500">
          Hired: {new Date().toLocaleDateString()}
        </Text>
      </VStack>
    </HStack>
  );
};

// Helper function for rendering status badge
const renderStatusBadge = (status: string): React.ReactNode => {
  const colorScheme = status === 'active' || status === 'Active' ? 'green' : 'red';
  return (
    <Badge colorScheme={colorScheme} variant="subtle">
      {status}
    </Badge>
  );
}; 