// src/features/ColorBar.tsx

import React from "react";
import styled from "styled-components";

// the grid container
const ColorBarWrapper = styled.div`
  display: grid;
  grid-template-columns:
    minmax(48px, auto) /* left slot never collapses below 48px */
    minmax(0, 1fr) /* center slot flexes but never below 0 */
    minmax(48px, auto); /* right slot never collapses below 48px */
  align-items: center;
  gap: 64px;
  padding: 16px;
  position: fixed;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  box-shadow: ${(props) => props.theme.shadows.medium};
  transition: all 0.3s ease;
`;

// simple flex wrapper for whatever lives in each slot
const Slot = styled.div`
display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  height: 100%;
`;

// the “compound” component API
export interface ColorBarProps {
  children?: React.ReactNode;
}
type C = React.ReactElement<{ children?: React.ReactNode }> | null;

const ColorBar: React.FC<ColorBarProps> & {
  Left: React.FC<{ children?: React.ReactNode }>;
  Center: React.FC<{ children?: React.ReactNode }>;
  Right: React.FC<{ children?: React.ReactNode }>;
} = ({ children }) => {
  const arr = React.Children.toArray(children) as C[];

  // collect whatever was passed in each named slot
  const leftItems = arr
    .filter(
      (c): c is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(c) && c.type === ColorBar.Left
    )
    .flatMap((c) => React.Children.toArray(c.props.children));
  const centerItems = arr
    .filter(
      (c): c is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(c) && c.type === ColorBar.Center
    )
    .flatMap((c) => React.Children.toArray(c.props.children));
  const rightItems = arr
    .filter(
      (c): c is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(c) && c.type === ColorBar.Right
    )
    .flatMap((c) => React.Children.toArray(c.props.children));

  return (
    <ColorBarWrapper>
      <Slot>{leftItems}</Slot>
      <Slot>{centerItems}</Slot>
      <Slot>{rightItems}</Slot>
    </ColorBarWrapper>
  );
};

// these are just markers — they don't render DOM
const ColorBarLeft: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
ColorBarLeft.displayName = "ColorBar.Left";
ColorBar.Left = ColorBarLeft;

function ColorBarCenter({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
ColorBarCenter.displayName = "ColorBar.Center";
ColorBar.Center = ColorBarCenter;

function ColorBarRight({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
ColorBarRight.displayName = "ColorBar.Right";
ColorBar.Right = ColorBarRight;

export default ColorBar;
