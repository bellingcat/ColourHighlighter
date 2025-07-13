import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Eye, EyeSlash, ArrowCounterClockwise, Trash } from "phosphor-react";
import Tooltip from "./Tooltip";
import Slider from "./Slider";

interface ColorSettingsProps {
  color: string;
  displayColor?: string;
  onClose?: () => void;
  onToggleVisibility?: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  onDisplayColorChange?: (color: string) => void;
  isVisible?: boolean;
  children: React.ReactNode;
}

interface SliderControlProps {
  color: string;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onReset?: () => void;
}

const ControlContainer = styled.div<{ $chipColor: string }>`
  background: ${(props) => props.theme.colors.background};
  backdrop-filter: blur(20px);
  padding: 16px;
  border-radius: 12px;
  box-shadow: ${(props) => props.theme.shadows.large};
  border: 1px solid ${({ $chipColor }) => $chipColor}22;
  width: calc(100vw - 32px);
  max-width: 600px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
  margin-bottom: 100px;
`;

const CloseButton = styled.button<{ $color: string }>`
  background: ${(props) => props.theme.colors.background};
  border: 1px solid ${({ $color }) => $color}20;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${(props) => props.theme.colors.textMuted};
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${({ $color }) => $color}12;
    color: ${(props) => props.theme.colors.text};
    transform: scale(1.05);
    border-color: ${({ $color }) => $color}40;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const HeaderContainer = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
  background: ${(props) => props.theme.colors.background};
  border: 1px solid ${({ $color }) => $color}30;
  position: relative;

  &:hover {
    border-color: ${({ $color }) => $color}50;
    background: ${({ $color }) => $color}08;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  padding-top: 4px;
  position: relative;
`;

const TopButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
`;

const HeaderButton = styled.button<{
  $color: string;
  $variant?: "primary" | "secondary" | "danger";
}>`
  background: ${({ $variant, theme }) => {
    if ($variant === "primary") return theme.colors.primary;
    if ($variant === "danger") return theme.colors.error;
    return theme.colors.backgroundSecondary || '#f3f4f6';
  }};
  border: 1px solid
    ${({ $variant, theme }) => {
      if ($variant === "primary") return theme.colors.primary;
      if ($variant === "danger") return theme.colors.error;
      return theme.colors.border || '#d1d5db';
    }};
  color: ${({ $variant, theme }) => {
    if ($variant === "primary" || $variant === "danger") return "#fff";
    return theme.colors.text;
  }};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-width: 0;

  &:hover {
    background: ${({ $variant, theme }) => {
      if ($variant === "primary") return theme.colors.primaryHover || theme.colors.primary;
      if ($variant === "danger") return theme.colors.error;
      return '#e5e7eb';
    }};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:focus {
    outline: none;
    border-color: ${({ $variant, theme }) => {
      if ($variant === "primary") return theme.colors.primary;
      if ($variant === "danger") return theme.colors.error;
      return theme.colors.primary;
    }};
  }

  &:active {
    background: ${({ $variant, theme }) => {
      if ($variant === "primary") return theme.colors.primary;
      if ($variant === "danger") return theme.colors.error;
      return '#e5e7eb';
    }};
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const DeleteButton = styled(HeaderButton)`
  margin-top: 16px;
  justify-content: center;
  width: auto;
  margin-left: auto;
  margin-right: auto;
`;

// Color swatch for showing which color is being deleted
const ColorSwatchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: ${(props) => props.theme.colors.backgroundSecondary};
  margin: 8px 0;
`;

const ColorSwatch = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
`;

const ColorInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const ColorLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.textMuted};
`;

const ColorValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  font-family: monospace;
`;

// Swatch for inside the Change Color button
const ColorButtonSwatch = styled.span<{ $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  display: inline-block;
  margin-right: 6px;
`;

const SliderGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 8px;
`;

// Delete Modal Components
const DeleteModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const DeleteModalContent = styled.div`
  background: ${(props) => props.theme.colors.background};
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: ${(props) => props.theme.shadows.large};
  border: 1px solid ${(props) => props.theme.colors.border || '#e5e7eb'};
`;

const DeleteModalHeader = styled.div`
  margin-bottom: 16px;
`;

const DeleteModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const DeleteModalBody = styled.div`
  margin-bottom: 24px;
`;

const DeleteModalMessage = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: ${(props) => props.theme.colors.textMuted};
  line-height: 1.5;
`;

const DeleteModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

// Main container component that can hold multiple controls
const ColorSettings: React.FC<ColorSettingsProps> = ({
  color,
  displayColor,
  onClose,
  onToggleVisibility,
  onReset,
  onDelete,
  onDisplayColorChange,
  isVisible = true,
  children,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        onClose
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    if (onDelete) {
      // Call onDelete directly since we've already confirmed
      onDelete();
    }
  };

  return (
    <ControlContainer ref={panelRef} $chipColor={color}>
      <HeaderActions>
        <TopButtonsContainer>
          {onDisplayColorChange && (
            <Tooltip
              content="Change the display color for this filter"
              position="top"
            >
              <HeaderButton
                $color={color}
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                <ColorButtonSwatch $color={displayColor || color} />
                {showColorPicker ? "Hide Colors" : "Change Color"}
              </HeaderButton>
            </Tooltip>
          )}
          {onToggleVisibility && (
            <Tooltip
              content={
                isVisible ? "Hide color from filter" : "Show color in filter"
              }
              position="top"
            >
              <HeaderButton $color={color} onClick={onToggleVisibility}>
                {isVisible ? <Eye /> : <EyeSlash />}
                {isVisible ? "Hide" : "Show"}
              </HeaderButton>
            </Tooltip>
          )}


          {onReset && (
            <Tooltip content="Reset all settings to default" position="top">
              <HeaderButton $color={color} onClick={onReset}>
                <ArrowCounterClockwise />
                Reset
              </HeaderButton>
            </Tooltip>
          )}
        </TopButtonsContainer>

        {onClose && (
          <Tooltip
            content="Close color adjustment panel"
            position="left"
            preserveLayout
          >
            <HeaderButton $color={color} style={{ flex: 'unset', width: 'auto', minWidth: 0 }} onClick={onClose}>
              Close
            </HeaderButton>
          </Tooltip>
        )}
      </HeaderActions>

      {showColorPicker && onDisplayColorChange && (
        <HeaderContainer $color={color}>
          <ColorPickerContainer>
            <ColorPickerRow>
              {onReset && (
                <Tooltip
                  content="Reset all settings to defaults"
                  position="top"
                >
                  <ResetButton
                    $originalColor={color}
                    onClick={() => {
                      onReset();
                      setShowColorPicker(false);
                    }}
                  >
                    Reset Settings
                  </ResetButton>
                </Tooltip>
              )}
            </ColorPickerRow>
            <HighContrastColors>
              {[
                color,
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#FF00FF",
                "#00FFFF",
                "#FFFFFF",
                "#000000",
                "#FF8000",
                "#8000FF",
              ].map((colorOption, index) => (
                <Tooltip
                  key={colorOption}
                  content={
                    index === 0
                      ? "Original picked color"
                      : `Set to ${colorOption}`
                  }
                  position="top"
                >
                  <ColorPreset
                    $color={colorOption}
                    $isSelected={
                      (displayColor || color).toLowerCase() ===
                      colorOption.toLowerCase()
                    }
                    $isOriginal={index === 0}
                    onClick={() => {
                      onDisplayColorChange(colorOption);
                      setShowColorPicker(false); // Hide colors after selection
                    }}
                  />
                </Tooltip>
              ))}
            </HighContrastColors>
          </ColorPickerContainer>
        </HeaderContainer>
      )}

      <SliderGrid>{children}</SliderGrid>

      {onDelete && (
        <Tooltip content="Delete this color from filter" position="top">
          <DeleteButton
            $color={color}
            $variant="danger"
            onClick={handleDeleteClick}
          >
            <Trash />
            Delete Color
          </DeleteButton>
        </Tooltip>
      )}

      {showDeleteModal && (
        <DeleteModalOverlay>
          <DeleteModalContent>
            <DeleteModalHeader>
              <DeleteModalTitle>Delete Color</DeleteModalTitle>
            </DeleteModalHeader>
            
            <DeleteModalBody>
              <DeleteModalMessage>
                Are you sure you want to delete this color from the filter? This action cannot be undone.
              </DeleteModalMessage>
              
              <ColorSwatchContainer>
                <ColorSwatch $color={color} />
                <ColorInfo>
                  <ColorLabel>Color to delete:</ColorLabel>
                  <ColorValue>{color}</ColorValue>
                </ColorInfo>
              </ColorSwatchContainer>
            </DeleteModalBody>
            
            <DeleteModalActions>
              <HeaderButton 
                $color={color} 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </HeaderButton>
              <HeaderButton 
                $color={color} 
                $variant="danger" 
                onClick={handleDeleteConfirm}
              >
                Delete
              </HeaderButton>
            </DeleteModalActions>
          </DeleteModalContent>
        </DeleteModalOverlay>
      )}
    </ControlContainer>
  );
};

// Enhanced ColorPicker Components
const ColorPickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
`;

const ColorPickerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 32px;
`;

const HighContrastColors = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const ColorPreset = styled.button<{
  $color: string;
  $isSelected: boolean;
  $isOriginal?: boolean;
}>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid
    ${({ $isSelected }) =>
      $isSelected ? "#4F46E5" : "rgba(255, 255, 255, 0.9)"};
  background: ${({ $color }) => $color};
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;

  ${({ $isOriginal }) =>
    $isOriginal &&
    `
    &::before {
      content: '';
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border: 2px dashed rgba(0, 0, 0, 0.4);
      border-radius: 6px;
      pointer-events: none;
    }
  `}

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ResetButton = styled.button<{ $originalColor: string }>`
  padding: 4px 8px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 10px;
  color: #1f2937;
  transition: all 0.2s ease;
  min-width: 50px;
  font-weight: 500;
  outline: none;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 1);
  }

  &:focus {
    outline: none;
    border-color: rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: scale(1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

// Individual tolerance control component
const ToleranceControl: React.FC<SliderControlProps> = ({
  color,
  value,
  onChange,
  label = "Tolerance",
  min = 0.001,
  max = 0.1,
  step = 0.001,
  defaultValue,
  onReset,
}) => {
  return (
    <Slider
      color={color}
      value={value}
      onChange={onChange}
      label={label}
      min={min}
      max={max}
      step={step}
      defaultValue={defaultValue}
      onReset={onReset}
    />
  );
};

// Individual saturation control component
const SaturationControl: React.FC<SliderControlProps> = ({
  color,
  value,
  onChange,
  label = "Saturation",
  min = 0.01,
  max = 0.5,
  step = 0.01,
  defaultValue,
  onReset,
}) => {
  return (
    <Slider
      color={color}
      value={value}
      onChange={onChange}
      label={label}
      min={min}
      max={max}
      step={step}
      defaultValue={defaultValue}
      onReset={onReset}
    />
  );
};

// Individual value control component
const ValueControl: React.FC<SliderControlProps> = ({
  color,
  value,
  onChange,
  label = "Value",
  min = 0.01,
  max = 0.5,
  step = 0.01,
  defaultValue,
  onReset,
}) => {
  return (
    <Slider
      color={color}
      value={value}
      onChange={onChange}
      label={label}
      min={min}
      max={max}
      step={step}
      defaultValue={defaultValue}
      onReset={onReset}
    />
  );
};

// Individual hue control component
const HueControl: React.FC<SliderControlProps> = ({
  color,
  value,
  onChange,
  label = "Hue",
  min = 0,
  max = 60,
  step = 1,
  defaultValue,
  onReset,
}) => {
  return (
    <Slider
      color={color}
      value={value}
      onChange={onChange}
      label={label}
      min={min}
      max={max}
      step={step}
      defaultValue={defaultValue}
      onReset={onReset}
    />
  );
};

// Export all components
export {
  ColorSettings,
  ToleranceControl,
  SaturationControl,
  ValueControl,
  HueControl,
};
export default ColorSettings;
