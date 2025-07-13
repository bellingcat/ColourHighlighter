"use client";

import { FC, ReactNode } from "react";
import { useTheme } from "styled-components";
import { 
  WelcomeWrapper, 
  TopCenter, 
  BigButton, 
  StartLabel, 
  ContentSection,
  StepsContainer,
  Step,
  StepNumber,
  StepContent,
  StepTitle,
  StepDescription,
  UseCaseDescription,
  RequirementSection,
  RequirementTitle,
  RequirementText
} from "./LandingPage.styles";
import Image from "next/image";
import { MonitorPlay } from "phosphor-react";

export interface LandingPageProps {
  children: ReactNode;
  onStart?: () => void;
}


const LandingPage: FC<LandingPageProps> = ({ children, onStart }) => {
  const theme = useTheme();
  // You can use a more robust check if you have a theme.mode or similar
  const isDark = theme.colors.background === "#0f172a";

  return (
    <WelcomeWrapper>
      <TopCenter>
        <Image
          src={isDark ? "/assets/logo.svg" : "/assets/logo_dark.svg"}
          alt="GeoRadar Logo"
          width={200}
          height={30}
        />
        <h1>Color Highlighter</h1>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "64px",
          marginBottom: "12px"
        }}>
          <BigButton onClick={onStart} aria-label="Start Screen Capture">
            <MonitorPlay />
          </BigButton>
          <StartLabel>Start Capture</StartLabel>
        </div>
        <UseCaseDescription>
          Highlight specific colors in any window.
        </UseCaseDescription>
      </TopCenter>
      <ContentSection>
        <StepsContainer>
          <Step>
            <StepNumber>1</StepNumber>
            <StepContent>
              <StepTitle>Screen Capture</StepTitle>
              <StepDescription>
                Start capturing a tab, window or your screen.
              </StepDescription>
            </StepContent>
          </Step>
          <Step>
            <StepNumber>2</StepNumber>
            <StepContent>
              <StepTitle>Pick Colors</StepTitle>
              <StepDescription>
                Click on colors you want to highlight and filter.
              </StepDescription>
            </StepContent>
          </Step>
          <Step>
            <StepNumber>3</StepNumber>
            <StepContent>
              <StepTitle>Use Second Window</StepTitle>
              <StepDescription>
                Keep both windows open to interact while filtering.
              </StepDescription>
            </StepContent>
          </Step>
        </StepsContainer>
        <RequirementSection>
          <RequirementTitle>⚠️ Important</RequirementTitle>
          <RequirementText>
            Keep this tool window open alongside your target application. 
            You need both windows visible to interact with your application while the color filtering is active.
          </RequirementText>
        </RequirementSection>
      </ContentSection>
      {children}
    </WelcomeWrapper>
  );
};

export default LandingPage;
