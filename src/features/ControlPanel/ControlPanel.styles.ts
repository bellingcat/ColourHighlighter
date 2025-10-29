import styled from "styled-components";

export const ControlPanelWrapper = styled.div<{ $isVisible?: boolean }>`
  z-index: 100;
  position: fixed;
  opacity: ${({ $isVisible = true }) => $isVisible ? 1 : 0};
  transition: opacity 0.4s ease;
  pointer-events: ${({ $isVisible = true }) => $isVisible ? 'all' : 'none'};
`;

export const PickerContainer = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${(props) => props.theme.colors.overlay};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Safari */
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  transition: all 0.3s ease;
`;

export const Columns = styled.div`
  display: flex;
  width: 100%;
  gap: 14px;
`;

export const ColorPreview = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

export const AnimatedChipsContainer = styled.div<{ $isVisible?: boolean }>`
  opacity: ${({ $isVisible = true }) => $isVisible ? 1 : 0};
  transition: opacity 0.4s ease;
  pointer-events: ${({ $isVisible = true }) => $isVisible ? 'all' : 'none'};
`;

export const AnimatedBottomBar = styled.div<{ $isVisible?: boolean }>`
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  flex-wrap: wrap;
  padding: 8px;
  z-index: 1000;
  border-radius: 8px;
  gap: 16px;
  opacity: ${({ $isVisible = true }) => $isVisible ? 1 : 0};
  transition: opacity 0.4s ease;
  pointer-events: ${({ $isVisible = true }) => $isVisible ? 'all' : 'none'};
`;