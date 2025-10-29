import React from 'react';
import styled from 'styled-components';
import { Moon, Sun, EyeSlash, Eye } from 'phosphor-react';
import { useTheme } from '@/contexts/ThemeProvider';

interface DevToolbarProps {
  isAutoHideDisabled: boolean;
  onToggleAutoHide: () => void;
}

const DevToolbar: React.FC<DevToolbarProps> = ({
  isAutoHideDisabled,
  onToggleAutoHide,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <ToolbarContainer>
      <ToolbarLabel>DEV TOOLBAR</ToolbarLabel>
      
      <ToolbarButton 
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
        <ButtonText>{isDark ? 'Light' : 'Dark'}</ButtonText>
      </ToolbarButton>

      <ToolbarButton 
        onClick={onToggleAutoHide}
        title={isAutoHideDisabled ? 'Enable Auto-Hide on Unfocus' : 'Disable Auto-Hide on Unfocus'}
        $active={isAutoHideDisabled}
      >
        {isAutoHideDisabled ? <EyeSlash size={16} /> : <Eye size={16} />}
        <ButtonText>Auto-Hide</ButtonText>
      </ToolbarButton>
    </ToolbarContainer>
  );
};

const ToolbarContainer = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: ${(props) => props.theme.shadows.medium};
  backdrop-filter: blur(10px);
  z-index: 9999;
  font-size: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows.large};
  }
`;

const ToolbarLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${(props) => props.theme.colors.textMuted};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-right: 4px;
`;

const ToolbarButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid ${(props) => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 4px;
  background: ${(props) => props.$active ? props.theme.colors.primary + '20' : props.theme.colors.background};
  color: ${(props) => props.$active ? props.theme.colors.primary : props.theme.colors.text};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
    background: ${(props) => props.$active ? props.theme.colors.primary + '30' : props.theme.colors.backgroundSecondary};
    border-color: ${(props) => props.theme.colors.primary};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ButtonText = styled.span`
  white-space: nowrap;
`;

export default DevToolbar;
