// src/components/Fab.tsx

import styled, { css } from "styled-components";

export interface FabProps {
  /** Which side of the viewport the button should appear on */
  side: "left" | "right";
}

/**
 * Fab is the floating action button for restoring the control panel.
 * It will appear on either left or right depending on the `side` prop.
 */
const Fab = styled.button<FabProps>`
  position: fixed;
  top: 16px;
  ${({ side }) =>
    side === "right"
      ? css`
          right: 16px;
          left: auto;
        `
      : css`
          left: 16px;
          right: auto;
        `}
  width: 48px;
  height: 48px;
  background: rgb(251, 180, 0);
  color: #111;
  border: none;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: 700;
  box-shadow: 0 4px 18px rgba(251, 180, 0, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  opacity: 1;
  transition:
    opacity 0.22s cubic-bezier(.4,0,.2,1),
    transform 0.34s cubic-bezier(.67,-0.35,.3,1.35);

  /* When showing, fully visible and interactive */
  &.show {
    opacity: 1;
    pointer-events: all;
  }

  /* When hiding, fade out and disable interactions */
  &.hide {
    opacity: 0;
    pointer-events: none;
    display: none;
  }
`;

export default Fab;
