import React from "react";
import styled from "styled-components";
import { SlidersHorizontal, X, Eye, EyeSlash } from "phosphor-react";
import Tooltip from "./Tooltip";

// Types for chip data
export interface ChipData {
  id: string;
  color: string;
  active: boolean;
  tolerance: number; // Individual tolerance for this chip
  saturation: number; // Individual saturation range for this chip
  value: number; // Individual value range for this chip
  hue: number; // Individual hue range for this chip
  displayColor: string; // Color used for display (can be different from picked color)
  mode: 'include' | 'exclude'; // Whether this color should be included or excluded
  hsv?: {
    h: number;
    s: number;
    v: number;
  };
  confidence?: number; // Smart sampling confidence level (0-1)
}

interface ChipsProps {
  chips: ChipData[];
  onChipRemove: (id: string) => void;
  onChipEdit?: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  editingId?: string | null;
}

// Styled components
const ChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  position: fixed;
  top: 86px;
  z-index: 999;
  padding: 0;
  max-width: calc(50vw - 32px);
`;

const IncludeChipContainer = styled(ChipContainer)`
  left: 8px;
  justify-content: flex-start;
`;

const ExcludeChipContainer = styled(ChipContainer)`
  right: 8px;
  justify-content: flex-end;
`;

const Chip = styled.div<{ $active: boolean; $selected: boolean; $mode: 'include' | 'exclude' }>`
  display: inline-flex;
  align-items: center;
  background: #fff;;
  padding: 8px 16px;
  border-radius: 8px; 
  border: 1px solid #e5e7eb; 
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); 
  cursor: pointer;
  transition: box-shadow 0.15s, opacity 0.2s; 
  opacity: ${({ $active }) => ($active ? 1 : 0.7)};
  outline: ${({ $selected, theme }) =>
    $selected ? `2px solid ${theme.colors.primary}` : "transparent"}; 

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); 
    border: 1px solid ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary}33;
    outline-offset: 2px;
  }
`;

const Swatch = styled.span<{ $color: string; $originalColor: string; $isModified: boolean; $mode: 'include' | 'exclude' }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
  background: ${({ $originalColor }) => $originalColor}; 
  border: 3px solid ${({ $isModified, $color }) => {
    return $isModified ? $color : 'none';
  }}; 
  position: relative;
`;

const ChipLabel = styled.span<{ $mode: 'include' | 'exclude' }>`
  font-size: 14px;
  color: ${({ $mode, theme }) => $mode === 'exclude' ? theme.colors.error : '#374151'}; 
  margin-right: 8px;
  font-weight: 500;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-decoration: ${({ $mode }) => $mode === 'exclude' ? 'line-through' : 'none'}; 
`;

const Icon = styled.span`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* opacity: 0.6; */
  margin-left: 4px;
  transition: opacity 0.15s; 
  border-radius: 4px; 

  &:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.04); 
    border: 1px solid ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Chips: React.FC<ChipsProps> = ({
  chips,
  onChipRemove,
  onChipEdit,
  onToggleVisibility,
  editingId = null,
}) => {
  if (chips.length === 0) {
    return null;
  }

  // Separate chips by mode
  const includeChips = chips.filter(chip => chip.mode === 'include');
  const excludeChips = chips.filter(chip => chip.mode === 'exclude');

  const renderChip = (chip: ChipData) => (
    <Chip
      key={chip.id}
      $active={chip.active}
      $selected={editingId === chip.id}
      $mode={chip.mode}
      onClick={() => onChipEdit?.(chip.id)}
    >
      <Swatch 
        $color={chip.displayColor} 
        $originalColor={chip.color}
        $isModified={chip.displayColor.toLowerCase() !== chip.color.toLowerCase()}
        $mode={chip.mode}
      />
      <ChipLabel $mode={chip.mode}>{chip.color}</ChipLabel>
      
      {onChipEdit && (
        <Tooltip content="Edit color tolerances and settings" position="top">
          <Icon
            onClick={(e) => {
              e.stopPropagation();
              onChipEdit(chip.id);
            }}
          >
            <SlidersHorizontal 
              size={16} 
              // Use the editingId to conditionally change color. use primary color if editing this chip
              color={editingId === chip.id ? "#3241e2" : "#6b7280"}
            />
          </Icon>
        </Tooltip>
      )}
      
      <Tooltip content={chip.active ? "Hide this color" : "Show this color"} position="top">
        <Icon
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(chip.id);
          }}
        >
          {chip.active ? (
            <Eye size={16} color="#6b7280" />
          ) : (
            <EyeSlash size={16} color="#6b7280" />
          )}
        </Icon>
      </Tooltip>
      
      <Tooltip content="Remove this color from filter" position="top">
        <Icon
          onClick={(e) => {
            e.stopPropagation();
            onChipRemove(chip.id);
          }}
        >
          <X size={16} color="#6b7280" />
        </Icon>
      </Tooltip>
    </Chip>
  );

  return (
    <>
      {/* Include chips on the left */}
      {includeChips.length > 0 && (
        <IncludeChipContainer>
          {includeChips.map(renderChip)}
        </IncludeChipContainer>
      )}
      
      {/* Exclude chips on the right */}
      {excludeChips.length > 0 && (
        <ExcludeChipContainer>
          {excludeChips.map(renderChip)}
        </ExcludeChipContainer>
      )}
    </>
  );
};

export default Chips;
