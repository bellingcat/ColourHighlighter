// src/components/LandingPage.tsx

import React, { FC, ReactNode } from "react";
import styled from "styled-components";

// Full-screen wrapper for the welcome overlay
const WelcomeWrapper = styled.div`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #fff;
  color: #111;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

// Top-center container for logo and title, with animated gradient text
const TopCenter = styled.div`
  position: fixed;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 1001;

  h1 {
    font-size: 3rem;
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
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  }

  img {
    width: 80%;
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

// Text block below the title (used in landing page)
export const WelcomeText = styled.div`
  margin-top: 220px;
  font-size: 1.3rem;
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
  padding: 14px 42px;
  cursor: pointer;
  font-weight: 700;
  margin-top: 24px;
  box-shadow: 0 4px 16px rgba(251, 180, 0, 0.3);
  transition: all 0.25s ease;

  &:hover,
  &:focus {
    background: linear-gradient(135deg, #ffe867, #fda65b);
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(251, 180, 0, 0.4);
  }
`;

interface LandingPageProps {
  /** Nested components: typically <WelcomeText> and <WelcomeButton> */
  children: ReactNode;
}

/**
 * LandingPage displays the full-screen welcome screen with logo and title,
 * then renders any children (welcome text, button, etc.) below.
 */
const LandingPage: FC<LandingPageProps> = ({ children }) => (
  <WelcomeWrapper>
    <TopCenter>
      <img
        src={`/assets/logo_dark.svg`}
        alt="Logo"
      />
      <h1>Colour Highlighter</h1>
    </TopCenter>
    {children}
  </WelcomeWrapper>
);

export default LandingPage;
