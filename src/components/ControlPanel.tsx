// src/components/ControlPanel.tsx

import React, { FC, useState, Fragment } from "react";
import styled, { css } from "styled-components";
import { filterConfigs, FilterConfig } from "../configs";
import { setGLFilter } from "../webgl";

/**
 * Positions itself on the left or right of the viewport.
 */
const ControlPanel = styled.div<{ $side: "left" | "right" }>`
  position: fixed;
  top: 18px;
  ${({ $side }) =>
    $side === "right"
      ? css`right: 18px; left: auto;`
      : css`left: 18px; right: auto;`}
  min-width: 240px;
  max-width: 240px;
  background: #1a1a1a;
  color: #fff;
  padding: 24px 18px 18px;
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 18px;
  z-index: 100;
  transition: opacity 0.22s cubic-bezier(.4,0,.2,1),
              transform 0.32s cubic-bezier(.68,-0.6,.32,1.6);
  transform: scale(1) translateY(0);
  pointer-events: all;
  background-clip: padding-box;

  /* minimized state hides the panel */
  &.minimized {
    opacity: 0;
    transform: scale(0.6) translateY(-40px);
    pointer-events: none;
  }

  /* container for the top row buttons (minimize, move) */
  .panel-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: -12px -8px 8px -8px;
    min-height: 32px;
  }
`;

/**
 * Grid layout for filter buttons (2 columns).
 */
export const FilterButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

/**
 * Individual filter button.
 * Highlights when `.active` class applied or when focused.
 */
export const FilterButton = styled.button`
  padding: 8px 12px;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active,
  &:focus {
    background: linear-gradient(135deg, #facc15, #fb923c);
    color: #111;
    outline: none;
  }
`;

/**
 * Small round button used in the panel's top row
 * for minimizing or toggling panel side.
 */
export const PanelTopButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #333;
  color: #eee;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.13);
  transition: background 0.2s, box-shadow 0.2s;
  padding: 0;

  &:hover,
  &:focus {
    background: rgb(251, 180, 0);
    color: #222;
    outline: none;
  }
`;

/**
 * Button to toggle display of the settings modal.
 */
const SettingsButton = styled.button`
  padding: 10px;
  background: linear-gradient(135deg, #facc15, #fb923c);
  color: #111;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 10px rgba(251, 180, 0, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #ffe867, #fda65b);
    box-shadow: 0 4px 14px rgba(251, 180, 0, 0.4);
  }
`;

/**
 * Modal window for advanced filter settings (color correction / LUT).
 */
const SettingsModal = styled.div`
  background: #111;
  padding: 14px;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #eee;
  box-shadow: inset 0 0 0 1px #2a2a2a;
`;

/**
 * Container for the two tabs within the settings modal.
 */
const TabBar = styled.div`
  display: flex;
  margin-bottom: 12px;
  gap: 6px;
`;

/**
 * Individual tab button.
 * `active` prop controls styling.
 */
const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  background: ${({ active }) =>
    active
      ? "linear-gradient(135deg, #fb923c, #facc15)"
      : "#2a2a2a"};
  color: ${({ active }) => (active ? "#111" : "#eee")};
`;

/**
 * Wrapper for each slider + label pair in settings.
 */
const SliderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
`;

/**
 * Label for each slider control.
 */
const Label = styled.label`
  margin-bottom: 4px;
  color: #ccc;
  font-size: 0.88rem;
`;

/**
 * Range input styled as a slider.
 */
const Slider = styled.input.attrs({ type: "range" })`
  width: 100%;
  accent-color: #facc15;
`;

/**
 * Props for the ControlPanelWrapper component.
 */
interface ControlPanelWrapperProps {
  side: "left" | "right"; // Which side of the screen the panel appears on
  activeIdx: number;      // Currently selected filter index
  setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
  onSelectFilter: (
    filter: FilterConfig,
    idx: number,
    setActiveIdx: React.Dispatch<React.SetStateAction<number>>,
    setGLFilter: (cfg: FilterConfig) => Promise<void>
  ) => void;
  togglePanelSide: () => void;        // Switch panel from left to right
  handleMinimizePanel: () => void;    // Collapse/hide the panel
}

/**
 * Main component rendering the control panel UI:
 * - Top row with minimize/move buttons
 * - Filter selection grid
 * - Settings toggle and modal with tabs/sliders
 */
const ControlPanelWrapper: FC<ControlPanelWrapperProps> = ({
  side,
  activeIdx,
  setActiveIdx,
  onSelectFilter,
  togglePanelSide,
  handleMinimizePanel,
}) => {
  // Toggle whether advanced settings modal is shown
  const [showSettings, setShowSettings] = useState(false);
  // Track which tab is active: "color" corrections or "lut" settings
  const [tab, setTab] = useState<"color" | "lut">("color");

  return (
    <ControlPanel $side={side}>
      {/* Top row: minimize and move buttons */}
      <div className="panel-top-row">
        {side === "left" ? (
          <Fragment>
            <PanelTopButton title="Minimize panel" onClick={handleMinimizePanel}>
              &minus;
            </PanelTopButton>
            <PanelTopButton title="Move panel" onClick={togglePanelSide}>
              ⇄
            </PanelTopButton>
          </Fragment>
        ) : (
          <Fragment>
            <PanelTopButton title="Move panel" onClick={togglePanelSide}>
              ⇄
            </PanelTopButton>
            <PanelTopButton title="Minimize panel" onClick={handleMinimizePanel}>
              &minus;
            </PanelTopButton>
          </Fragment>
        )}
      </div>

      {/* Logo and title */}
      <div style={{ textAlign: "center" }}>
        <img
          src={`${process.env.PUBLIC_URL}/assets/logo.svg`}
          alt="Logo"
          style={{
            width: "100%",
            maxWidth: 160,
            marginBottom: 18,
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
        <h3>Colour Highlighter</h3>
      </div>

      {/* Filter button selection */}
      <div>
        <div id="filterButtons" style={{ marginBottom: 6 }}>
          Select Highlighter:
        </div>
        <FilterButtonGrid>
          {filterConfigs.map((filter, idx) => (
            <FilterButton
              key={filter.id}
              className={activeIdx === idx ? "active" : ""}
              onClick={() =>
                onSelectFilter(filter, idx, setActiveIdx, setGLFilter)
              }
              tabIndex={0}
            >
              {filter.name}
            </FilterButton>
          ))}
        </FilterButtonGrid>
      </div>

      {/* Toggle for advanced settings */}
      <SettingsButton onClick={() => setShowSettings((s) => !s)}>
        Settings
      </SettingsButton>

      {/* Advanced settings modal */}
      {showSettings && (
        <SettingsModal>
          <TabBar>
            <Tab active={tab === "color"} onClick={() => setTab("color")}>
              Color Correction
            </Tab>
            <Tab active={tab === "lut"} onClick={() => setTab("lut")}>
              Filter Settings
            </Tab>
          </TabBar>

          {/* Color correction sliders */}
          {tab === "color" && (
            <>
              {[
                "Gamma",
                "Contrast",
                "Brightness",
                "Saturation",
                "Hue Shift",
                "Tint",
              ].map((name) => (
                <SliderWrapper key={name}>
                  <Label>{name}</Label>
                  <Slider min={-1} max={1} step={0.01} />
                </SliderWrapper>
              ))}
            </>
          )}

          {/* LUT parameter sliders */}
          {tab === "lut" && (
            <>
              {[
                "Amount",
                "Similarity",
                "Smoothness",
                "Key Colour Spill Reduction",
              ].map((name) => (
                <SliderWrapper key={name}>
                  <Label>{name}</Label>
                  <Slider min={-1} max={1} step={0.01} />
                </SliderWrapper>
              ))}
            </>
          )}
        </SettingsModal>
      )}
    </ControlPanel>
  );
};

export default ControlPanelWrapper;
