import React from "react";
import styled from "styled-components";
import { ArrowCounterClockwise } from "phosphor-react";

interface SliderProps {
  color: string;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onReset?: () => void;
}

const ControlLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const LabelLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ResetButton = styled.button<{ $color: string; $isDefault: boolean }>`
  background: none;
  border: 1px solid ${({ $isDefault, theme }) => $isDefault ? 'transparent' : `${theme.colors.primary}40`};
  border-radius: 4px;
  padding: 2px 4px;
  cursor: ${({ $isDefault }) => $isDefault ? 'default' : 'pointer'};
  color: ${({ $isDefault, theme }) => $isDefault ? '#9CA3AF' : `${theme.colors.primary}`};
  transition: all 0.2s ease;
  font-size: 10px;
  opacity: ${({ $isDefault }) => $isDefault ? 0.5 : 1};
  display: flex;
  align-items: center;
  gap: 2px;

  &:hover {
    background: ${({ $color, $isDefault }) => $isDefault ? 'none' : `${$color}12`};
    transform: ${({ $isDefault }) => $isDefault ? 'none' : 'scale(1.05)'};
  }

  &:active {
    transform: ${({ $isDefault }) => $isDefault ? 'none' : 'scale(1)'};
  }

  svg {
    width: 10px;
    height: 10px;
  }
`;



const SliderTrack = styled.div<{ $color: string; $isHue?: boolean }>`
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 8px;
  background: ${({ $color, $isHue }) => 
    $isHue 
      ? 'linear-gradient(to right, #ff0000 0%, #ffff00 16.66%, #00ff00 33.33%, #00ffff 50%, #0000ff 66.66%, #ff00ff 83.33%, #ff0000 100%)'
      : `linear-gradient(to right, ${$color}20 0%, ${$color}40 100%)`
  };
  border: 1px solid ${({ $color, $isHue }) => $isHue ? '#e5e7eb' : `${$color}22`};
  display: flex;
  align-items: center;
`;

const SliderThumb = styled.input<{ $color: string }>`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 18px;
  background: transparent;
  outline: none;
  cursor: pointer;
  position: relative;
  z-index: 2;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  &::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }

  &::-ms-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
  }
`;

const SliderValue = styled.span`
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
  margin-left: 8px;
`;

const ControlWrapper = styled.div`
  padding: 4px 0;
`;

const LabelToSliderSpacer = styled.div`
  height: 10px;
`;


const Slider: React.FC<SliderProps> = ({
  color,
  value,
  onChange,
  label = "Slider",
  min = 0,
  max = 1,
  step = 0.01,
  defaultValue,
  onReset,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const formatValue = (val: number) => {
    if (label === "Hue") {
      return `${Math.round(val)}°`;
    }
    return `${Math.round(val * 100)}%`;
  };

  const isAtDefault = defaultValue !== undefined && Math.abs(value - defaultValue) < step;

  const handleReset = () => {
    if (onReset && !isAtDefault) {
      onReset();
    }
  };

  return (
    <ControlWrapper>
      <ControlLabel>
        <LabelLeft>
          {label}
          <SliderValue>{formatValue(value)}</SliderValue>
        </LabelLeft>
        {onReset && defaultValue !== undefined && (
          <ResetButton 
            $color={color} 
            $isDefault={isAtDefault}
            onClick={handleReset}
            disabled={isAtDefault}
            title={isAtDefault ? 'Already at default value' : `Reset to ${formatValue(defaultValue)}`}
          >
            <ArrowCounterClockwise />
          </ResetButton>
        )}
      </ControlLabel>
      <LabelToSliderSpacer />
      <SliderTrack $color={color} $isHue={label === "Hue"}>
        <SliderThumb
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          $color={color}
        />
      </SliderTrack>
    </ControlWrapper>
  );
};

export default Slider;
