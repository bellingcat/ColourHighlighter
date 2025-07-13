import styled from "styled-components";

// Full-screen wrapper for the welcome overlay
export const WelcomeWrapper = styled.div`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  transition: background-color 0.3s ease, color 0.3s ease;
`;

// Top-center container for logo and title, with animated gradient text
export const TopCenter = styled.div`
  margin-top: 20px;
  text-align: center;

  img {
    margin: 0 auto 20px;
    display: block;
  }

  @keyframes shine {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

// Main content section
export const ContentSection = styled.div`
  max-width: 800px;
  width: 100%;
  margin-top: 30px;
`;

// Use case section
export const UseCaseTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.primary};
  margin: 0 0 10px 0;
  text-align: center;
  transition: color 0.3s ease;
`;

export const UseCaseDescription = styled.p`
  font-size: 1.02rem;
  color: ${(props) => props.theme.colors.textSecondary};
  text-align: center;
  margin: 0 0 26px 0;
  line-height: 1.55;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  transition: color 0.3s ease;
`;

// Steps container and components
export const StepsContainer = styled.div`
  display: grid;
  gap: 20px;
  margin-bottom: 30px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
`;

export const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: ${(props) => props.theme.colors.backgroundSecondary};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors.backgroundTertiary};
    box-shadow: ${(props) => props.theme.shadows.medium};
  }
`;

export const StepNumber = styled.div`
  background: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.primaryText};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  transition: background 0.3s ease;
`;

export const StepContent = styled.div`
  flex: 1;
`;

export const StepTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
`;

export const StepDescription = styled.p`
  font-size: 0.95rem;
  color: ${(props) => props.theme.colors.textMuted};
  margin: 0;
  line-height: 1.5;
  transition: color 0.3s ease;
`;

// Tip section
export const TipSection = styled.div`
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 40px;
  text-align: center;
`;

export const TipTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #a5b4fc;
  margin: 0 0 12px 0;
`;

export const TipText = styled.p`
  font-size: 0.95rem;
  color: #d1d5db;
  margin: 0;
  line-height: 1.6;
`;

// Text block below the title
export const WelcomeText = styled.div`
  margin-top: 16px;
  font-size: 1rem;
  color: #333;
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.03em;
`;

// Primary button on the landing page
export const WelcomeButton = styled.button`
  background: linear-gradient(135deg, #facc15, #fb923c);
  color: #111;
  outline: none;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 14px 20px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(251, 180, 0, 0.3);
  transition: all 0.25s ease;

  &:hover,
  &:focus {
    background: linear-gradient(135deg, #ffe867, #fda65b);
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(251, 180, 0, 0.4);
  }
`;

export const BigButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  border-radius: 24px;
  width: clamp(110px, 16vw, 170px);
  height: clamp(110px, 16vw, 170px);
  background: ${(props) => props.theme.gradients.primary};
  box-shadow: ${(props) => props.theme.shadows.glow};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-top: 36px;
  margin-bottom: 16px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover,
  &:focus {
    transform: scale(1.05) translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows.large},
      ${(props) => props.theme.shadows.glow};
    filter: brightness(1.1);
  }

  &:hover::before {
    left: 100%;
  }

  &:active {
    transform: scale(1.02) translateY(0px);
  }

  svg {
    font-size: clamp(4rem, 5vw, 6rem);
    color: ${(props) => props.theme.colors.primaryText};
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    z-index: 1;
  }
`;

export const StartLabel = styled.div`
  margin-top: 24px;
  font-size: clamp(1.4rem, 3vw, 2.4rem);
  font-weight: 700;
  color: ${(props) => props.theme.colors.text};
  text-align: center;
  transition: color 0.3s ease;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: linear-gradient(
    90deg,
    #ff6ec4,
    #7873f5,
    #4ade80,
    #facc15,
    #fb923c,
    #f43f5e
  );
  background-size: 400% 100%;
  animation: shine 6s ease-in-out infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 10px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
`;

export const SubText = styled.div`
  margin-top: 16px;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  color: ${(props) => props.theme.colors.textMuted};
  text-align: center;
  font-weight: 400;
  max-width: 90vw;
  transition: color 0.3s ease;
`;

// Requirement section
export const RequirementSection = styled.div`
  background: ${(props) => props.theme.colors.backgroundSecondary};
  border: 1px solid ${(props) => props.theme.colors.warning};
  border-radius: 12px;
  padding: 20px;
  margin-top: 40px;
  text-align: center;
  transition: all 0.3s ease;
`;

export const RequirementTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.warning};
  margin: 0 0 12px 0;
  transition: color 0.3s ease;
`;

export const RequirementText = styled.p`
  font-size: 0.95rem;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
  line-height: 1.6;
  transition: color 0.3s ease;
`;
