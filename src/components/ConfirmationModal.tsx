import React, { useCallback } from "react";
import styled from "styled-components";
import { X, Warning } from "phosphor-react";

/**
 * Reusable Confirmation Modal Component
 * 
 * Usage Example:
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 * 
 * const handleDangerousAction = () => {
 *   setShowModal(true);
 * };
 * 
 * const handleConfirm = () => {
 *   // Perform the dangerous action
 *   console.log('Action confirmed');
 * };
 * 
 * <ConfirmationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleConfirm}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   variant="danger"
 *   color="#ff0000"
 * />
 * ```
 */

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  color?: string;
  customContent?: React.ReactNode;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transition: all 0.2s ease;
  padding: 16px;
`;

const ModalContainer = styled.div<{ $variant: 'danger' | 'warning' | 'info'; $color?: string }>`
  background: ${(props) => props.theme.colors.background};
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: ${(props) => props.theme.shadows.large};
  border: 1px solid ${({ $variant, $color, theme }) => {
    if ($color) return `${$color}22`;
    if ($variant === 'danger') return `${theme.colors.error}22`;
    if ($variant === 'warning') return '#F59E0B22';
    return `${theme.colors.primary}22`;
  }};
  position: relative;
  transform: scale(0.9);
  animation: modalEnter 0.2s ease forwards;

  @keyframes modalEnter {
    to {
      transform: scale(1);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const ModalIcon = styled.div<{ $variant: 'danger' | 'warning' | 'info'; $color?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $variant, $color, theme }) => {
    if ($color) return `${$color}12`;
    if ($variant === 'danger') return `${theme.colors.error}12`;
    if ($variant === 'warning') return '#F59E0B12';
    return `${theme.colors.primary}12`;
  }};
  color: ${({ $variant, $color, theme }) => {
    if ($color) return $color;
    if ($variant === 'danger') return theme.colors.error;
    if ($variant === 'warning') return '#F59E0B';
    return theme.colors.primary;
  }};
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  line-height: 1.4;
`;

const ModalMessage = styled.p`
  margin: 0 0 24px 0;
  font-size: 14px;
  color: ${(props) => props.theme.colors.textMuted};
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ $variant: 'primary' | 'secondary'; $color?: string; $buttonVariant?: 'danger' | 'warning' | 'info' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  border: 1px solid;
  
  ${({ $variant, $color, $buttonVariant, theme }) => {
    if ($variant === 'primary') {
      const buttonColor = $color || ($buttonVariant === 'danger' ? theme.colors.error : 
                                   $buttonVariant === 'warning' ? '#F59E0B' : theme.colors.primary);
      return `
        background: ${buttonColor};
        color: #fff;
        border-color: ${buttonColor};
        
        &:hover {
          background: ${buttonColor}e6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        &:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      `;
    } else {
      return `
        background: ${theme.colors.background};
        color: ${theme.colors.textMuted};
        border-color: ${theme.colors.border};
        
        &:hover {
          background: ${theme.colors.backgroundSecondary};
          color: ${theme.colors.text};
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        &:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      `;
    }
  }}
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => props.theme.colors.textMuted};
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: ${(props) => props.theme.colors.text};
    background: ${(props) => props.theme.colors.backgroundSecondary};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'info',
  color,
  customContent,
}) => {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter' && event.ctrlKey) {
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleConfirm]);

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContainer $variant={variant} $color={color}>
        <CloseButton onClick={onClose}>
          <X />
        </CloseButton>
        
        <ModalHeader>
          <ModalIcon $variant={variant} $color={color}>
            <Warning />
          </ModalIcon>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        
        <ModalMessage>{message}</ModalMessage>
        
        {customContent && customContent}
        
        <ModalActions>
          <ModalButton $variant="secondary" onClick={onClose}>
            {cancelText}
          </ModalButton>
          <ModalButton 
            $variant="primary" 
            $color={color} 
            $buttonVariant={variant}
            onClick={handleConfirm}
          >
            {confirmText}
          </ModalButton>
        </ModalActions>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ConfirmationModal;
