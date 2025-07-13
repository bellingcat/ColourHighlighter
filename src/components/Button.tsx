// Button.tsx (Square button component)
import React from "react";
import styled from "styled-components";
import Tooltip from "./Tooltip";

export interface StyledButtonProps {
  $bgColor?: string | undefined;
  $showBorder?: boolean;
  $size?: number;
  $disabled?: boolean;
}

const StyledButton = styled.button<StyledButtonProps>`
  width: ${({ $size }) => $size || 48}px;
  height: ${({ $size }) => $size || 48}px;
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin: 0;
  background: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  outline: none;
  box-shadow: ${(props) => props.theme.shadows.small};
  transition: all 0.3s ease;
  color: ${(props) => props.theme.colors.text};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  &:hover {
    box-shadow: ${(props) => props.$disabled ? props.theme.shadows.small : props.theme.shadows.medium};
    background: ${(props) => props.$disabled ? props.theme.colors.background : props.theme.colors.backgroundSecondary};
  }

  &:focus {
    outline: ${({ $disabled, theme }) => ($disabled ? 'none' : `2px solid ${theme.colors.primary}`)};
    outline-offset: 2px;
  }

  &:active {
    box-shadow: ${(props) => props.theme.shadows.small};
  }
`;

// 1) Container to stack button + label
const Container = styled.div<{ $size: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// 2) Label text underneath
const Label = styled.span<{ $fontSize?: number; $color?: string }>`
  margin-top: 4px;
  font-size: ${({ $fontSize }) => $fontSize || 12}px;
  color: ${({ $color }) => $color || "#333"};
  text-align: center;
`;

interface ButtonProps {
  icon?: React.ReactNode;
  iconColor?: string;
  showBorder?: boolean;
  onClick?: () => void;
  bgColor?: string;
  size?: number;
  disabled?: boolean;

  /** New props for label */
  label?: string;
  labelColor?: string;
  labelFontSize?: number;
  
  /** Tooltip props */
  tooltip?: string;
  'aria-label'?: string;
}

const Button: React.FC<ButtonProps> = ({
  icon = null,
  iconColor,
  showBorder = true, // Keep for backward compatibility but doesn't affect styling
  onClick = () => {},
  bgColor = undefined, // Provide explicit undefined default
  size = 48,
  disabled = false,
  label,
  labelColor,
  labelFontSize,
  tooltip,
  'aria-label': ariaLabel,
}) => {
  const buttonContent = (
    <Container $size={size}>
      <StyledButton
        $showBorder={showBorder}
        $bgColor={bgColor}
        $size={size}
        $disabled={disabled}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        type="button"
        aria-label={ariaLabel || tooltip}
      >
        {icon && iconColor && React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<Record<string, unknown>>, { 
              color: iconColor,
              style: { color: iconColor },
              size: Math.floor((size || 48) * 0.45) // Scale icon size based on button size
            })
          : icon}
      </StyledButton>
      {label && (
        <Label
          {...(labelColor !== undefined ? { $color: labelColor } : {})}
          {...(labelFontSize !== undefined ? { $fontSize: labelFontSize } : {})}
        >
          {label}
        </Label>
      )}
    </Container>
  );

  return tooltip ? (
    <Tooltip content={tooltip} position="bottom">
      {buttonContent}
    </Tooltip>
  ) : (
    buttonContent
  );
};

export default Button;
