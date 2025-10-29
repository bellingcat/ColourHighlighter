import React, { useEffect, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import Button from "@/components/Button";
import Picker from "@/features/Picker";
import { Eyedropper } from "phosphor-react";

// Rainbow spin animation
const hueRotate = keyframes`
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }
`;

// Styled container for eyedropper button / hover preview
type ContainerProps = { $picking: boolean; $fillColor: string };
const Container = styled.div<ContainerProps>`
  position: fixed;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: ${({ $picking, $fillColor }) =>
    $picking
      ? $fillColor
      : `repeating-conic-gradient(
          #ff6b6b 0deg 45deg,
          #ffe66d 45deg 90deg,
          #4ecdc4 90deg 135deg,
          #556270 135deg 180deg
        )`};
  background-size: 32px 32px;
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $picking }) =>
    !$picking &&
    css`
      animation: ${hueRotate} 8s linear infinite;
    `}
`;

export interface ColorPickerProps {
  eyedropper: boolean;
  setEyedropper: (on: boolean) => void;
  customHex: string;
  customSimilarity: number;
  onSimilarityChange: (v: number) => void;
  onStartPicking: () => void;
  onEscape: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  eyedropper,
  setEyedropper,
  customHex,
  onStartPicking,
  onEscape,
}) => {
  const [hoveredColor, setHoveredColor] = useState(customHex);

  // Track hover color when in eyedropper mode
  useEffect(() => {
    if (!eyedropper) {
      setHoveredColor(customHex);
      return;
    }
    const offscreen = document.createElement("canvas");
    const ctx = offscreen.getContext("2d")!;

    function onMouseMove(e: MouseEvent) {
      const video = document.querySelector("video") as HTMLVideoElement;
      if (!video || video.readyState < 2) return;
      offscreen.width = video.videoWidth;
      offscreen.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const canvasEl = document.getElementById("glcanvas")!;
      const rect = canvasEl.getBoundingClientRect();
      const x = Math.floor(
        ((e.clientX - rect.left) / rect.width) * offscreen.width
      );
      const y = Math.floor(
        ((e.clientY - rect.top) / rect.height) * offscreen.height
      );
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      const hex =
        "#" +
        [r, g, b].map((v) => (v ?? 0).toString(16).padStart(2, "0")).join("");
      setHoveredColor(hex);
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [eyedropper, customHex]);

  return (
    <>
      {/* Eyedropper toggle */}
      {!eyedropper && (
        <Container $picking={eyedropper} $fillColor={hoveredColor}>
          <Button
            bgColor="#ffffff"
            showBorder={false}
            size={74}
            icon={<Eyedropper size={36} color="#000000" />}
            onClick={() => {
              onStartPicking();
              setEyedropper(true);
            }}
            tooltip="Start color picker mode"
          />
        </Container>
      )}

      {/* Active picker overlay */}
      {eyedropper && (
        <Picker
          borderWidth={8}
          color={hoveredColor}
          onPositionChange={() => {}}
          onEscape={onEscape}
        />
      )}
    </>
  );
};

export default ColorPicker;
