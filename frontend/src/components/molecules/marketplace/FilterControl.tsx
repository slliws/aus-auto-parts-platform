import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../../styles/theme';

/**
 * Filter control types
 */
export type FilterControlType = 'select' | 'checkbox' | 'range' | 'radio';

/**
 * Filter option interface
 */
export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

/**
 * FilterControl Props
 */
export interface FilterControlProps {
  type: FilterControlType;
  label: string;
  options?: FilterOption[];
  value?: string | number | boolean | [number, number];
  onChange: (value: any) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Container for filter control
 */
const FilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

/**
 * Filter Label
 */
const Label = styled.label`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.semiBold};
  color: ${theme.colors.neutral.black};
`;

/**
 * Select Dropdown
 */
const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.neutral.mediumGray};
  border-radius: 6px;
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.neutral.black};
  background-color: ${theme.colors.neutral.white};
  cursor: pointer;
  transition: border-color 0.2s;
  
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
 * Checkbox Container
 */
const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/**
 * Checkbox Label
 */
const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.black};
  
  &:hover {
    color: ${theme.colors.facebook.primary};
  }
`;

/**
 * Checkbox Input
 */
const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${theme.colors.facebook.primary};
`;

/**
 * Option Count Badge
 */
const OptionCount = styled.span`
  margin-left: auto;
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.neutral.darkGray};
`;

/**
 * Range Input Container
 */
const RangeContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

/**
 * Range Input
 */
const RangeInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.neutral.mediumGray};
  border-radius: 6px;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.black};
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.facebook.primary};
    box-shadow: 0 0 0 2px ${theme.colors.alpha.primaryAlpha10};
  }
`;

/**
 * Range Separator
 */
const RangeSeparator = styled.span`
  color: ${theme.colors.neutral.darkGray};
  font-size: ${theme.typography.fontSizes.sm};
`;

/**
 * Radio Button Container
 */
const RadioContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/**
 * Radio Label
 */
const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.neutral.black};
  
  &:hover {
    color: ${theme.colors.facebook.primary};
  }
`;

/**
 * Radio Input
 */
const RadioInput = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${theme.colors.facebook.primary};
`;

/**
 * FilterControl Component - Individual filter control
 * 
 * @example
 * // Select dropdown
 * <FilterControl
 *   type="select"
 *   label="Category"
 *   options={[
 *     { label: 'All Categories', value: '' },
 *     { label: 'Brake Parts', value: 'brakes' },
 *     { label: 'Engine Parts', value: 'engine' }
 *   ]}
 *   value={selectedCategory}
 *   onChange={setCategory}
 * />
 * 
 * // Price range
 * <FilterControl
 *   type="range"
 *   label="Price Range"
 *   value={[minPrice, maxPrice]}
 *   onChange={setPriceRange}
 *   min={0}
 *   max={1000}
 * />
 */
export const FilterControl: React.FC<FilterControlProps> = ({
  type,
  label,
  options = [],
  value,
  onChange,
  placeholder,
  min,
  max,
  step = 1,
}) => {
  const renderSelect = () => (
    <Select
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
          {option.count !== undefined && ` (${option.count})`}
        </option>
      ))}
    </Select>
  );

  const renderCheckbox = () => (
    <CheckboxContainer>
      {options.map((option) => (
        <CheckboxLabel key={option.value}>
          <CheckboxInput
            type="checkbox"
            checked={value === option.value}
            onChange={(e) => onChange(e.target.checked ? option.value : null)}
          />
          {option.label}
          {option.count !== undefined && <OptionCount>({option.count})</OptionCount>}
        </CheckboxLabel>
      ))}
    </CheckboxContainer>
  );

  const renderRange = () => {
    const rangeValue = (value as [number, number]) || [min || 0, max || 100];
    return (
      <RangeContainer>
        <RangeInput
          type="number"
          value={rangeValue[0]}
          min={min}
          max={max}
          step={step}
          placeholder="Min"
          onChange={(e) => onChange([Number(e.target.value), rangeValue[1]])}
        />
        <RangeSeparator>-</RangeSeparator>
        <RangeInput
          type="number"
          value={rangeValue[1]}
          min={min}
          max={max}
          step={step}
          placeholder="Max"
          onChange={(e) => onChange([rangeValue[0], Number(e.target.value)])}
        />
      </RangeContainer>
    );
  };

  const renderRadio = () => (
    <RadioContainer>
      {options.map((option) => (
        <RadioLabel key={option.value}>
          <RadioInput
            type="radio"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
          {option.count !== undefined && <OptionCount>({option.count})</OptionCount>}
        </RadioLabel>
      ))}
    </RadioContainer>
  );

  const renderControl = () => {
    switch (type) {
      case 'select':
        return renderSelect();
      case 'checkbox':
        return renderCheckbox();
      case 'range':
        return renderRange();
      case 'radio':
        return renderRadio();
      default:
        return null;
    }
  };

  return (
    <FilterContainer>
      <Label>{label}</Label>
      {renderControl()}
    </FilterContainer>
  );
};

export default FilterControl;