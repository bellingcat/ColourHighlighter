"use client";

import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@/contexts';

const ThemeStatusContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: ${(props) => props.theme.colors.backgroundSecondary};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.85rem;
  color: ${(props) => props.theme.colors.textMuted};
  box-shadow: ${(props) => props.theme.shadows.small};
  transition: all 0.3s ease;
  z-index: 1000;
  max-width: 200px;
  
  &:hover {
    background: ${(props) => props.theme.colors.backgroundTertiary};
  }
`;

const ThemeIndicator = styled.div<{ $isDark: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $isDark }) => $isDark ? '#3b82f6' : '#f59e0b'};
  margin-right: 8px;
`;

const ThemeStatus: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <ThemeStatusContainer>
      <div>
        <ThemeIndicator $isDark={isDark} />
        {isDark ? 'Dark' : 'Light'} Mode
      </div>
      <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
        Follows system preference
      </div>
    </ThemeStatusContainer>
  );
};

export default ThemeStatus;
