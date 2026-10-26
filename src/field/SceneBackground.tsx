import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import { GROUND_SHADE, SCENE_COLORS, SKY, SceneId, TimeOfDay } from './scenes';

interface Props {
  scene: SceneId;
  time: TimeOfDay;
  width: number;
  height: number;
  /** Fraction of the height, from the top, where the ground starts. */
  horizon: number;
}

/** Hand-drawn scene: sky that follows the time of day, ground, and a few scene details. */
export function SceneBackground({
  scene,
  time,
  width: w,
  height: h,
  horizon,
}: Props) {
  const colors = SCENE_COLORS[scene];
  const [skyTop, skyBottom] = SKY[time];
  const groundY = h * horizon;
  const night = time === 'night';
  const celestial = night
    ? '#F5F3CE'
    : time === 'evening'
    ? '#FFB36B'
    : '#FFE27A';

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={skyTop} />
          <Stop offset="1" stopColor={skyBottom} />
        </LinearGradient>
        <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.ground[0]} />
          <Stop offset="1" stopColor={colors.ground[1]} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={groundY + 2} fill="url(#sky)" />
      {night &&
        STARS.map(([sx, sy, r], i) => (
          <Circle
            key={i}
            cx={sx * w}
            cy={sy * groundY}
            r={r}
            fill="#FFFFFF"
            opacity={0.8}
          />
        ))}
      <Circle cx={w * 0.8} cy={groundY * 0.28} r={w * 0.08} fill={celestial} />
      {!night && <Clouds w={w} y={groundY * 0.35} />}

      {scene === 'meadow' && <Hills w={w} y={groundY} color={colors.detail} />}
      {scene === 'forest' && (
        <Trees w={w} y={groundY} color={colors.accent} trunk={colors.detail} />
      )}
      {scene === 'beach' && <Sea w={w} y={groundY} color={colors.accent} />}
      {scene === 'snow' && (
        <Mountains w={w} y={groundY} color={colors.accent} />
      )}

      <Rect
        x={0}
        y={groundY}
        width={w}
        height={h - groundY}
        fill="url(#ground)"
      />
      {scene === 'meadow' && (
        <Flowers w={w} y={groundY} h={h} color={colors.accent} />
      )}
      {scene === 'beach' && <Shells w={w} y={groundY} h={h} />}
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill="#000020"
        opacity={GROUND_SHADE[time]}
      />
    </Svg>
  );
}

const STARS: [number, number, number][] = [
  [0.1, 0.2, 1.5],
  [0.25, 0.1, 1],
  [0.4, 0.3, 1.8],
  [0.55, 0.15, 1.2],
  [0.65, 0.45, 1],
  [0.15, 0.55, 1.2],
  [0.92, 0.6, 1.5],
  [0.35, 0.65, 1],
];

function Clouds({ w, y }: { w: number; y: number }) {
  return (
    <>
      <Ellipse
        cx={w * 0.22}
        cy={y}
        rx={w * 0.12}
        ry={w * 0.04}
        fill="#FFFFFF"
        opacity={0.85}
      />
      <Ellipse
        cx={w * 0.3}
        cy={y - w * 0.03}
        rx={w * 0.08}
        ry={w * 0.04}
        fill="#FFFFFF"
        opacity={0.85}
      />
      <Ellipse
        cx={w * 0.6}
        cy={y + w * 0.08}
        rx={w * 0.1}
        ry={w * 0.03}
        fill="#FFFFFF"
        opacity={0.7}
      />
    </>
  );
}

function Hills({ w, y, color }: { w: number; y: number; color: string }) {
  return (
    <Path
      d={`M0 ${y} Q ${w * 0.2} ${y - w * 0.18} ${w * 0.45} ${y} Q ${w * 0.7} ${
        y - w * 0.22
      } ${w} ${y} Z`}
      fill={color}
      opacity={0.6}
    />
  );
}

function Trees({
  w,
  y,
  color,
  trunk,
}: {
  w: number;
  y: number;
  color: string;
  trunk: string;
}) {
  const xs = [0.05, 0.2, 0.38, 0.62, 0.8, 0.95];
  return (
    <>
      {xs.map((x, i) => {
        const size = w * (i % 2 ? 0.13 : 0.17);
        const cx = x * w;
        return (
          <React.Fragment key={i}>
            <Rect
              x={cx - size * 0.08}
              y={y - size * 0.5}
              width={size * 0.16}
              height={size * 0.5}
              fill={trunk}
            />
            <Polygon
              points={`${cx - size / 2},${y - size * 0.4} ${cx + size / 2},${
                y - size * 0.4
              } ${cx},${y - size * 1.8}`}
              fill={color}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

function Sea({ w, y, color }: { w: number; y: number; color: string }) {
  const band = w * 0.12;
  return (
    <>
      <Rect x={0} y={y - band} width={w} height={band} fill={color} />
      <Path
        d={`M0 ${y} Q ${w * 0.125} ${y - 8} ${w * 0.25} ${y} T ${
          w * 0.5
        } ${y} T ${w * 0.75} ${y} T ${w} ${y} V ${y + 6} H 0 Z`}
        fill="#FFFFFF"
        opacity={0.8}
      />
    </>
  );
}

function Mountains({ w, y, color }: { w: number; y: number; color: string }) {
  return (
    <>
      <Polygon
        points={`0,${y} ${w * 0.3},${y - w * 0.35} ${w * 0.6},${y}`}
        fill={color}
      />
      <Polygon
        points={`${w * 0.22},${y - w * 0.27} ${w * 0.3},${y - w * 0.35} ${
          w * 0.38
        },${y - w * 0.27}`}
        fill="#FFFFFF"
      />
      <Polygon
        points={`${w * 0.4},${y} ${w * 0.75},${y - w * 0.28} ${w * 1.1},${y}`}
        fill={color}
        opacity={0.8}
      />
    </>
  );
}

function Flowers({
  w,
  y,
  h,
  color,
}: {
  w: number;
  y: number;
  h: number;
  color: string;
}) {
  const spots: [number, number][] = [
    [0.1, 0.2],
    [0.3, 0.6],
    [0.55, 0.3],
    [0.8, 0.75],
    [0.9, 0.15],
    [0.45, 0.85],
  ];
  return (
    <>
      {spots.map(([sx, sy], i) => (
        <Circle
          key={i}
          cx={sx * w}
          cy={y + sy * (h - y)}
          r={4}
          fill={i % 2 ? '#FFFFFF' : color}
        />
      ))}
    </>
  );
}

function Shells({ w, y, h }: { w: number; y: number; h: number }) {
  return (
    <>
      <Ellipse
        cx={w * 0.2}
        cy={y + (h - y) * 0.7}
        rx={6}
        ry={4}
        fill="#F7A7A0"
      />
      <Ellipse
        cx={w * 0.75}
        cy={y + (h - y) * 0.4}
        rx={5}
        ry={3}
        fill="#FFFFFF"
      />
    </>
  );
}
