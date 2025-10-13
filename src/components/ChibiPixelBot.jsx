// src/components/ChibiPixelBot.jsx
import React from 'react';

const PIXELS = [
  // [x, y, color]
  // Head outline
  ...Array.from({ length: 18 }, (_, i) => [10 + i, 4, '#0f172a']),
  ...Array.from({ length: 18 }, (_, i) => [10 + i, 20, '#0f172a']),
  ...Array.from({ length: 16 }, (_, i) => [9, 5 + i, '#0f172a']),
  ...Array.from({ length: 16 }, (_, i) => [28, 5 + i, '#0f172a']),
  // Head fill
  ...Array.from({ length: 14 }, (_, row) =>
    Array.from({ length: 16 }, (_, col) => [11 + col, 6 + row, '#1f2b4a'])
  ).flat(),
  // Visor
  ...Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => [13 + col, 9 + row, '#0a101d'])
  ).flat(),
  // Eyes
  [16, 12, '#4ddbe2'],
  [17, 12, '#4ddbe2'],
  [24, 12, '#4ddbe2'],
  [25, 12, '#4ddbe2'],
  // Cheeks
  [15, 15, '#13203d'],
  [26, 15, '#13203d'],
  // Body outline
  ...Array.from({ length: 16 }, (_, i) => [12 + i, 21, '#0f172a']),
  ...Array.from({ length: 12 }, (_, i) => [13 + i, 36, '#0f172a']),
  ...Array.from({ length: 15 }, (_, i) => [11, 22 + i, '#0f172a']),
  ...Array.from({ length: 15 }, (_, i) => [28, 22 + i, '#0f172a']),
  // Body fill
  ...Array.from({ length: 13 }, (_, row) =>
    Array.from({ length: 14 }, (_, col) => [12 + col, 22 + row, '#1d3a63'])
  ).flat(),
  ...Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => [13 + col, 23 + row, '#274a80'])
  ).flat(),
  // Hoodie pocket
  ...Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => [18 + col, 30 + row, '#1e3e74'])
  ).flat(),
  // Arms
  ...Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) => [9 + col, 25 + row, '#23345b'])
  ).flat(),
  ...Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) => [28 + col, 25 + row, '#23345b'])
  ).flat(),
  // Hands
  ...Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) => [8 + col, 31 + row, '#0f172a'])
  ).flat(),
  ...Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) => [31 + col, 31 + row, '#0f172a'])
  ).flat(),
  // Legs
  ...Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => [16 + col, 36 + row, '#13203d'])
  ).flat(),
  ...Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => [22 + col, 36 + row, '#13203d'])
  ).flat(),
  // Boots
  ...Array.from({ length: 2 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => [15 + col, 42 + row, '#0c1220'])
  ).flat(),
  ...Array.from({ length: 2 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => [22 + col, 42 + row, '#0c1220'])
  ).flat(),
];

const PIXEL_SIZE = 4;

export default function ChibiPixelBot({
  size = 128,
  animated = true,
  alt = 'ChibiBot mascot',
  className = '',
}) {
  const scale = size / (40 * PIXEL_SIZE);
  const isDecorative = alt === '';
  const composedClass = ['chibi-base', animated && 'chibi-animated', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={composedClass}
      style={{ '--chibi-scale': scale }}
      role="img"
      aria-label={isDecorative ? undefined : alt}
      aria-hidden={isDecorative ? 'true' : undefined}
    >
      <svg
        className="chibi-svg"
        viewBox="0 0 160 184"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect width="160" height="184" fill="transparent" />
        {PIXELS.map(([x, y, color], index) => (
          <rect
            key={index}
            x={x * PIXEL_SIZE}
            y={y * PIXEL_SIZE}
            width={PIXEL_SIZE}
            height={PIXEL_SIZE}
            fill={color}
          />
        ))}
        {/* Wave arm overlay */}
        {animated && (
          <g className="chibi-arm-wave">
            {Array.from({ length: 6 }, (_, row) =>
              Array.from({ length: 4 }, (_, col) => (
                <rect
                  key={`wave-${row}-${col}`}
                  x={(29 + col) * PIXEL_SIZE}
                  y={(20 + row) * PIXEL_SIZE}
                  width={PIXEL_SIZE}
                  height={PIXEL_SIZE}
                  fill="#23345b"
                />
              ))
            ).flat()}
            {Array.from({ length: 3 }, (_, row) =>
              Array.from({ length: 3 }, (_, col) => (
                <rect
                  key={`wave-hand-${row}-${col}`}
                  x={(32 + col) * PIXEL_SIZE}
                  y={(26 + row) * PIXEL_SIZE}
                  width={PIXEL_SIZE}
                  height={PIXEL_SIZE}
                  fill="#0f172a"
                />
              ))
            ).flat()}
          </g>
        )}
      </svg>
    </div>
  );
}
