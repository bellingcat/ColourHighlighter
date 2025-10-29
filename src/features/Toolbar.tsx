// src/features/Toolbar.tsx

import React from "react";
import styled from "styled-components";

/**
 * Toolbar component with guaranteed center alignment
 *
 * Uses CSS Grid with 1fr auto 1fr layout to ensure the center slot
 * is always perfectly centered regardless of the content in left/right slots.
 * This is more robust than flexbox for this use case.
 */

// the grid container - full width with theme background
const ToolbarWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* Equal flex space on sides, auto-sized center */
  align-items: center;
  padding: 8px;
  min-height: 72px; /* Ensure enough height for 48px buttons + padding */
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  background: ${(props) => props.theme.colors.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  box-sizing: border-box;
  box-shadow: ${(props) => props.theme.shadows.small};
  transition: all 0.3s ease;
`;

// Left slot - left aligned
const LeftSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0; /* Allow shrinking */
`;

// Center slot - always centered regardless of side content
const CenterSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  position: relative;
  min-width: 0; /* Allow shrinking */
`;

// Right slot - right aligned
const RightSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0; /* Allow shrinking */
  position: relative; /* Allow dropdowns to position correctly */
`;

// the "compound" component API
export interface ToolbarProps {
  children?: React.ReactNode;
}
type C = React.ReactElement<{ children?: React.ReactNode }> | null;

const Toolbar: React.FC<ToolbarProps> & {
  Left: React.FC<{ children?: React.ReactNode }>;
  Center: React.FC<{ children?: React.ReactNode }>;
  Right: React.FC<{ children?: React.ReactNode }>;
} = ({ children }) => {
  const arr = React.Children.toArray(children) as C[];

  // collect whatever was passed in each named slot
  const leftItems = arr
    .filter(
      (c): c is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(c) && c.type === Toolbar.Left
    )
    .flatMap((c) => React.Children.toArray(c.props.children));
  const centerItems = arr
    .filter(
      (c): c is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(c) && c.type === Toolbar.Center
    )
    .flatMap((c) => React.Children.toArray(c.props.children));
  const rightItems = arr
    .filter(
      (c): c is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(c) && c.type === Toolbar.Right
    )
    .flatMap((c) => React.Children.toArray(c.props.children));

  return (
    <ToolbarWrapper>
      <LeftSlot>{leftItems}</LeftSlot>
      <CenterSlot>{centerItems}</CenterSlot>
      <RightSlot>{rightItems}</RightSlot>
    </ToolbarWrapper>
  );
};

// these are just markers — they don't render DOM
const ToolbarLeft: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
ToolbarLeft.displayName = "Toolbar.Left";
Toolbar.Left = ToolbarLeft;

function ToolbarCenter({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
ToolbarCenter.displayName = "Toolbar.Center";
Toolbar.Center = ToolbarCenter;

function ToolbarRight({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
ToolbarRight.displayName = "Toolbar.Right";
Toolbar.Right = ToolbarRight;

export default Toolbar;
