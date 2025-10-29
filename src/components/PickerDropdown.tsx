import React, { useState, useRef, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { Eyedropper, CaretDown } from 'phosphor-react';
import Button from '@/components/Button';
import Tooltip from '@/components/Tooltip';

export interface PickerOption {
  id: string;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  description?: string;
}

interface PickerDropdownProps {
  options: PickerOption[];
  hasPicked: boolean;
  className?: string;
}

const PickerDropdown: React.FC<PickerDropdownProps> = ({ 
  options, 
  hasPicked, 
  className 
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
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
      // Create shortcut key combinations for each option
      options.forEach(option => {
        if (option.disabled) return; // Skip disabled options
        
        const keys = option.shortcut.toLowerCase().split('+');
        const requiredKeys = {
          ctrl: keys.includes('ctrl'),
          shift: keys.includes('shift'),
          alt: keys.includes('alt'),
          key: keys[keys.length - 1] // Last key is the main key
        };

        const matches = 
          event.ctrlKey === requiredKeys.ctrl &&
          event.shiftKey === requiredKeys.shift &&
          event.altKey === requiredKeys.alt &&
          event.key.toLowerCase() === requiredKeys.key;

        if (matches) {
          event.preventDefault();
          option.action();
          setIsOpen(false);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options]);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: PickerOption) => {
    if (option.disabled) return;
    option.action();
    setIsOpen(false);
  };

  return (
    <DropdownContainer ref={dropdownRef} className={className}>
      {hasPicked ? (
        <StaticButtonWrapper>
          <DropdownButton onClick={handleToggleDropdown}>
            <Button
              bgColor="#fff"
              size={48}
              icon={<Eyedropper size={28} color={theme.colors.primary} weight="fill" />}
              aria-label="Color picker options"
              iconColor={theme.colors.primary}
              showBorder={true}
              tooltip="Color picker options"
            />
            <DropdownArrow>
              <CaretDown size={12} color={theme.colors.primary} />
            </DropdownArrow>
          </DropdownButton>
        </StaticButtonWrapper>
      ) : (
        <AnimatedButtonWrapper>
          <PulseRing />
          <DropdownButton onClick={handleToggleDropdown}>
            <Button
              bgColor="#fff"
              size={48}
              icon={<Eyedropper size={28} color={theme.colors.primary} weight="fill" />}
              aria-label="Color picker options"
              iconColor={theme.colors.primary}
              showBorder={false}
              tooltip="Pick colors from the stream"
            />
            <DropdownArrow>
              <CaretDown size={12} color={theme.colors.primary} />
            </DropdownArrow>
          </DropdownButton>
        </AnimatedButtonWrapper>
      )}

      {isOpen && (
        <DropdownMenu>
          {options.map((option) => (
            <Tooltip
              key={option.id}
              content={option.description || option.label}
              position="right"
              delay={300}
            >
              <DropdownOption
                onClick={() => handleOptionClick(option)}
                className={option.disabled ? 'disabled' : ''}
              >
                <OptionIcon>{option.icon}</OptionIcon>
                <OptionContent>
                  <OptionLabel>{option.label}</OptionLabel>
                  <OptionShortcut>{option.shortcut}</OptionShortcut>
                </OptionContent>
              </DropdownOption>
            </Tooltip>
          ))}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
};

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const StaticButtonWrapper = styled.div`
  /* Static styling when has picked */
`;

const AnimatedButtonWrapper = styled.div`
  position: relative;
`;

const PulseRing = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  transform: translate(-50%, -50%);
  animation: pulse 1.8s cubic-bezier(0.4,0,0.2,1) infinite;
  pointer-events: none;
  z-index: 0;

  @keyframes pulse {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 1;
    }
    60% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
  }
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

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
`;

const DropdownOption = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover:not(.disabled) {
    background: #f8fafc;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }
`;

const OptionIcon = styled.div`
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

const OptionContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const OptionLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.2;
`;

const OptionShortcut = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
`;

export default PickerDropdown;
