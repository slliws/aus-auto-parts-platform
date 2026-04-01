import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';

/**
 * Sort option interface
 */
export interface SortOption {
  label: string;
  value: string;
}

/**
 * SortSelector Props
 */
export interface SortSelectorProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/**
 * Container for sort selector
 */
const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * Sort Label
 */
const Label = styled.label`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${theme.colors.neutral.darkGray};
  white-space: nowrap;
`;

/**
 * Sort Select Dropdown
 */
const Select = styled.select`
  padding: 8px 32px 8px 12px;
  border: 1px solid ${theme.colors.neutral.mediumGray};
  border-radius: 6px;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${theme.colors.neutral.black};
  background-color: ${theme.colors.neutral.white};
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  
  &:hover {
    border-color: ${theme.colors.facebook.primary};
  }
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.facebook.primary};
    box-shadow: 0 0 0 2px ${theme.colors.alpha.primaryAlpha10};
  }
`;

/**
 * Icon for sort selector
 */
const SortIcon = styled.svg`
  width: 16px;
  height: 16px;
  fill: ${theme.colors.neutral.darkGray};
  flex-shrink: 0;
`;

/**
 * SortSelector Component - Sorting options dropdown
 * 
 * @example
 * <SortSelector
 *   label="Sort by"
 *   options={[
 *     { label: 'Price: Low to High', value: 'price_asc' },
 *     { label: 'Price: High to Low', value: 'price_desc' },
 *     { label: 'Newest First', value: 'date_desc' },
 *     { label: 'Most Relevant', value: 'relevance' }
 *   ]}
 *   value={sortOption}
 *   onChange={setSortOption}
 * />
 */
export const SortSelector: React.FC<SortSelectorProps> = ({
  options,
  value,
  onChange,
  label = 'Sort by',
}) => {
  return (
    <SortContainer>
      <SortIcon viewBox="0 0 24 24">
        <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
      </SortIcon>
      <Label htmlFor="sort-select">{label}:</Label>
      <Select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </SortContainer>
  );
};

export default SortSelector;