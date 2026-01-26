import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';

interface Metric {
  label: string;
  value: number; // 0 to 100
}

interface RadarChartProps {
  metrics: Metric[];
  size?: number;
  color?: string;
}

export function RadarChart({ metrics, size = 200, color = '#6366f1' }: RadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.7; // Leave some space for labels
  const angleStep = (Math.PI * 2) / metrics.length;

  // Calculate coordinates for a given value and index
  const getCoordinates = (value: number, index: number) => {
    const r = (value / 100) * radius;
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate the polygon points for the data
  const points = metrics.map((m, i) => {
    const { x, y } = getCoordinates(m.value, i);
    return `${x},${y}`;
  }).join(' ');

  // Generate the background grid (concentric circles/polygons)
  const gridLevels = [25, 50, 75, 100];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background Grid */}
        {gridLevels.map((level) => (
          <Polygon
            key={level}
            points={metrics.map((_, i) => {
              const { x, y } = getCoordinates(level, i);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#374151"
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines */}
        {metrics.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return (
            <Line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#374151"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <Polygon
          points={points}
          fill={`${color}44`}
          stroke={color}
          strokeWidth="2"
        />

        {/* Data Points */}
        {metrics.map((m, i) => {
          const { x, y } = getCoordinates(m.value, i);
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={color}
            />
          );
        })}
      </Svg>

      {/* Labels */}
      {metrics.map((m, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + (radius + 25) * Math.cos(angle);
        const y = center + (radius + 15) * Math.sin(angle);
        
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x - 40,
              top: y - 10,
              width: 80,
              alignItems: 'center',
            }}
          >
            <Text className="text-[10px] font-bold text-onSurfaceVariant uppercase">
              {m.label}
            </Text>
            <Text className="text-[10px] font-bold text-primary">
              ({m.value})
            </Text>
          </View>
        );
      })}
    </View>
  );
}
