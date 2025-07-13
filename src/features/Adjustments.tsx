// src/features/ControlPanel/Adjustments.tsx
import React from "react";
import styled from "styled-components";

export const SliderWrapper = styled.div`
   background-color: rgba(40, 40, 40, 0.8);
  color: #ffffff;
  padding: 8px 12px;
  margin: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;

  &:hover {
    background-color: rgba(60, 60, 60, 0.9);
    transform: scale(1.03);
  }

  &:active {
    background-color: rgba(30, 30, 30, 0.9);
    transform: scale(0.97);
  }

  &.selected {
    background-color: rgba(80, 80, 80, 0.95);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  }
`;

export const Slider = styled.input.attrs({ type: "range" })<{ color: string }>`
  accent-color: ${(props) => props.color || "#4ecdc4"};
  border-radius: 8px;
  height: 8px;
  background: rgba(255, 255, 255);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
`;

export const Label = styled.label`
  margin-bottom: 8px;
  color: #fff;
`;

export interface AdjustmentsProps {
  /** Slider label (e.g. "Tolerance") */
  label: string;
  /** Current value (0–1 range if you like) */
  value: number;
  /** onChange handler, receives the new numeric value */
  onChange: (v: number) => void;
  /** Use to tint the slider track */
  color?: string;
  /** Customize min/max/step if you ever need a different range */
  min?: number;
  max?: number;
  step?: number;
}

const Adjustments: React.FC<AdjustmentsProps> = ({
  label,
  value,
  onChange,
  color = "#000",
  min = 0,
  max = 1,
  step = 0.01,
}) => (
  <SliderWrapper>
    <Label>
      {label}: {Math.round(value * 100)}%
    </Label>
    <Slider
      color={color}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(parseFloat(e.target.value))
      }
      aria-valuenow={value}
      aria-valuetext={`${label}: ${Math.round(value * 100)}%`}
    />
  </SliderWrapper>
);

export default Adjustments;
