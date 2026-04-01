import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';
import { FilterControl, FilterOption } from '../../molecules/marketplace/FilterControl';
import { Button } from '../../atoms/Button';

/**
 * Filter configuration interface
 */
export interface FilterConfig {
  type: 'select' | 'checkbox' | 'range' | 'radio';
  label: string;
  key: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
  placeholder?: string;
}

/**
 * FilterPanel Props
 */
export interface FilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  onApply?: () => void;
  title?: string;
}

/**
 * Panel Container
 */
const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${theme.colors.neutral.white};
  border-radius: 8px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 80px;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    position: relative;
    top: 0;
  }
`;

/**
 * Panel Header
 */
const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${theme.colors.neutral.lightGray};
`;

/**
 * Panel Title
 */
const Title = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.neutral.black};
  margin: 0;
`;

/**
 * Clear Button
 */
const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.facebook.primary};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.semiBold};
  cursor: pointer;
  padding: 4px 8px;
  
  &:hover {
    text-decoration: underline;
  }
`;

/**
 * Filters Container
 */
const FiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
  max-height: 500px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${theme.colors.neutral.lightGray};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.neutral.mediumGray};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.neutral.darkGray};
  }
`;

/**
 * Filter Divider
 */
const Divider = styled.div`
  height: 1px;
  background-color: ${theme.colors.neutral.lightGray};
  margin: 8px 0;
`;

/**
 * Actions Container
 */
const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid ${theme.colors.neutral.lightGray};
`;

/**
 * FilterPanel Component - Sidebar with all filter controls
 * 
 * @example
 * <FilterPanel
 *   title="Filters"
 *   filters={[
 *     {
 *       type: 'select',
 *       label: 'Category',
 *       key: 'category',
 *       options: categories,
 *       placeholder: 'All Categories'
 *     },
 *     {
 *       type: 'range',
 *       label: 'Price Range',
 *       key: 'priceRange',
 *       min: 0,
 *       max: 1000
 *     },
 *     {
 *       type: 'radio',
 *       label: 'Condition',
 *       key: 'condition',
 *       options: [
 *         { label: 'All', value: '' },
 *         { label: 'New', value: 'new' },
 *         { label: 'Used', value: 'used' }
 *       ]
 *     }
 *   ]}
 *   values={filterValues}
 *   onChange={handleFilterChange}
 *   onClear={handleClearFilters}
 * />
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onClear,
  onApply,
  title = 'Filters',
}) => {
  const handleFilterChange = (key: string, value: any) => {
    onChange(key, value);
  };

  const hasActiveFilters = Object.values(values).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return value !== null && value !== undefined && value !== '';
  });

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>{title}</Title>
        {hasActiveFilters && (
          <ClearButton onClick={onClear}>Clear All</ClearButton>
        )}
      </PanelHeader>
      
      <FiltersContainer>
        {filters.map((filter, index) => (
          <React.Fragment key={filter.key}>
            <FilterControl
              type={filter.type}
              label={filter.label}
              options={filter.options}
              value={values[filter.key]}
              onChange={(value) => handleFilterChange(filter.key, value)}
              placeholder={filter.placeholder}
              min={filter.min}
              max={filter.max}
            />
            {index < filters.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </FiltersContainer>
      
      {onApply && (
        <ActionsContainer>
          <Button variant="primary" fullWidth onClick={onApply}>
            Apply Filters
          </Button>
        </ActionsContainer>
      )}
    </PanelContainer>
  );
};

export default FilterPanel;