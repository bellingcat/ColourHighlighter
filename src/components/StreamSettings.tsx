import React, { useState, useRef, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { Sliders, CaretDown, ArrowCounterClockwise } from 'phosphor-react';
import Button from './Button';

export interface StreamSettingsState {
  brightness: number;    // -100 to 100
  contrast: number;      // -100 to 100
  temperature: number;   // -100 to 100 (cool to warm)
  gamma: number;         // 0.5 to 2.0
}

interface StreamSettingsProps {
  settings: StreamSettingsState;
  onSettingsChange: (settings: StreamSettingsState) => void;
  className?: string;
}

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.div`
  position: relative;
  cursor: pointer;
  display: inline-block;
`;

const DropdownArrow = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const DropdownMenu = styled.div<{ $alignRight?: boolean }>`
  position: absolute;
  top: 100%;
  ${({ $alignRight }) => $alignRight ? 'right: 0;' : 'left: 50%; transform: translateX(-50%);'}
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.15);
  padding: 20px;
  margin-top: 8px;
  min-width: 280px;
  z-index: 1000;
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    ${({ $alignRight }) => $alignRight ? 'right: 24px;' : 'left: 50%; transform: translateX(-50%);'}
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid rgba(255, 255, 255, 0.98);
  }
`;

const MenuHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const MenuTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const SettingGroup = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const SettingLabelLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SettingResetButton = styled.button<{ $isDefault: boolean }>`
  background: none;
  border: 1px solid ${({ $isDefault }) => $isDefault ? 'transparent' : '#6b7280'};
  border-radius: 4px;
  padding: 2px 4px;
  cursor: ${({ $isDefault }) => $isDefault ? 'default' : 'pointer'};
  color: ${({ $isDefault }) => $isDefault ? '#9CA3AF' : '#6b7280'};
  transition: all 0.2s ease;
  font-size: 10px;
  opacity: ${({ $isDefault }) => $isDefault ? 0.5 : 1};
  display: flex;
  align-items: center;

  &:hover {
    background: ${({ $isDefault }) => $isDefault ? 'none' : '#f3f4f6'};
    transform: ${({ $isDefault }) => $isDefault ? 'none' : 'scale(1.05)'};
  }

  &:active {
    transform: ${({ $isDefault }) => $isDefault ? 'none' : 'scale(1)'};
  }

  svg {
    width: 10px;
    height: 10px;
  }
`;

const SettingValue = styled.span`
  color: #6b7280;
  font-size: 13px;
  min-width: 40px;
  text-align: right;
`;

const Slider = styled.input.attrs({ type: 'range' })`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, ${({ theme }) => theme.colors.border} 0%, ${({ theme }) => theme.colors.primary} 50%, ${({ theme }) => theme.colors.border} 100%);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  &::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ResetButton = styled.button`
  width: 100%;
  padding: 10px 16px;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const StreamSettings: React.FC<StreamSettingsProps> = ({
  settings,
  onSettingsChange,
  className
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen]);

  const handleToggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      // Check if dropdown would go off-screen when opening
      const rect = dropdownRef.current.getBoundingClientRect();
      const menuWidth = 280; // min-width of dropdown
      const spaceOnRight = window.innerWidth - rect.right;
      const spaceOnLeft = rect.left;
      
      // If not enough space on the right, align right
      if (spaceOnRight < menuWidth && spaceOnLeft > spaceOnRight) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleSettingChange = (key: keyof StreamSettingsState, value: number) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleReset = () => {
    onSettingsChange({
      brightness: 0,
      contrast: 0,
      temperature: 0,
      gamma: 1.0
    });
  };

  const defaultValues = {
    brightness: 0,
    contrast: 0,
    temperature: 0,
    gamma: 1.0
  };

  const handleIndividualReset = (key: keyof StreamSettingsState) => {
    onSettingsChange({
      ...settings,
      [key]: defaultValues[key]
    });
  };

  const isAtDefault = (key: keyof StreamSettingsState) => {
    return settings[key] === defaultValues[key];
  };

  const formatValue = (key: keyof StreamSettingsState, value: number): string => {
    if (key === 'gamma') {
      return value.toFixed(1);
    }
    return value > 0 ? `+${value}` : value.toString();
  };

  const hasChanges = settings.brightness !== 0 || 
                   settings.contrast !== 0 || 
                   settings.temperature !== 0 || 
                   settings.gamma !== 1.0;

  return (
    <DropdownContainer ref={dropdownRef} className={className}>
      <DropdownButton onClick={handleToggleDropdown}>
        <Button
          bgColor="#fff"
          size={48}
          icon={<Sliders size={24} color={hasChanges ? theme.colors.primary : theme.colors.textSecondary} />}
          iconColor={hasChanges ? theme.colors.primary : theme.colors.textSecondary}
          showBorder={true}
          tooltip="Stream display settings"
        />
        <DropdownArrow>
          <CaretDown size={12} color={hasChanges ? theme.colors.primary : theme.colors.textSecondary} />
        </DropdownArrow>
      </DropdownButton>

      {isOpen && (
        <DropdownMenu $alignRight={alignRight}>
          <MenuHeader>
            <Sliders size={18} color={theme.colors.primary} />
            <MenuTitle>Stream Display Settings</MenuTitle>
          </MenuHeader>

          <SettingGroup>
            <SettingLabel>
              <SettingLabelLeft>
                Brightness
                <SettingValue>{formatValue('brightness', settings.brightness)}</SettingValue>
              </SettingLabelLeft>
              <SettingResetButton
                $isDefault={isAtDefault('brightness')}
                onClick={() => handleIndividualReset('brightness')}
                disabled={isAtDefault('brightness')}
                title={isAtDefault('brightness') ? 'Already at default value' : `Reset to ${formatValue('brightness', defaultValues.brightness)}`}
              >
                <ArrowCounterClockwise />
              </SettingResetButton>
            </SettingLabel>
            <Slider
              min="-100"
              max="100"
              step="5"
              value={settings.brightness}
              onChange={(e) => handleSettingChange('brightness', parseInt(e.target.value))}
            />
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>
              <SettingLabelLeft>
                Contrast
                <SettingValue>{formatValue('contrast', settings.contrast)}</SettingValue>
              </SettingLabelLeft>
              <SettingResetButton
                $isDefault={isAtDefault('contrast')}
                onClick={() => handleIndividualReset('contrast')}
                disabled={isAtDefault('contrast')}
                title={isAtDefault('contrast') ? 'Already at default value' : `Reset to ${formatValue('contrast', defaultValues.contrast)}`}
              >
                <ArrowCounterClockwise />
              </SettingResetButton>
            </SettingLabel>
            <Slider
              min="-100"
              max="100"
              step="5"
              value={settings.contrast}
              onChange={(e) => handleSettingChange('contrast', parseInt(e.target.value))}
            />
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>
              <SettingLabelLeft>
                Temperature
                <SettingValue>{formatValue('temperature', settings.temperature)}</SettingValue>
              </SettingLabelLeft>
              <SettingResetButton
                $isDefault={isAtDefault('temperature')}
                onClick={() => handleIndividualReset('temperature')}
                disabled={isAtDefault('temperature')}
                title={isAtDefault('temperature') ? 'Already at default value' : `Reset to ${formatValue('temperature', defaultValues.temperature)}`}
              >
                <ArrowCounterClockwise />
              </SettingResetButton>
            </SettingLabel>
            <Slider
              min="-100"
              max="100"
              step="5"
              value={settings.temperature}
              onChange={(e) => handleSettingChange('temperature', parseInt(e.target.value))}
            />
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>
              <SettingLabelLeft>
                Gamma
                <SettingValue>{formatValue('gamma', settings.gamma)}</SettingValue>
              </SettingLabelLeft>
              <SettingResetButton
                $isDefault={isAtDefault('gamma')}
                onClick={() => handleIndividualReset('gamma')}
                disabled={isAtDefault('gamma')}
                title={isAtDefault('gamma') ? 'Already at default value' : `Reset to ${formatValue('gamma', defaultValues.gamma)}`}
              >
                <ArrowCounterClockwise />
              </SettingResetButton>
            </SettingLabel>
            <Slider
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.gamma}
              onChange={(e) => handleSettingChange('gamma', parseFloat(e.target.value))}
            />
          </SettingGroup>

          {hasChanges && (
            <ResetButton onClick={handleReset}>
              Reset to Defaults
            </ResetButton>
          )}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
};

export default StreamSettings;
