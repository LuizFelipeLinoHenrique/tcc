import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { buildCashChart, CashChartPoint, traceCashLine } from "@/src/lib/cashChart";
import { displayDate } from "@/src/lib/cashFlow";
import { Colors } from "@/src/theme/colors";

export function CashLineChart({ points, width }: { points: CashChartPoint[]; width: number }) {
  const clipId = `cashPlot${useId().replace(/:/g, "")}`;
  const pointsKey = points.map(point => `${point.date}:${point.balance}`).join("|");
  const chart = useMemo(() => buildCashChart(points, width), [pointsKey, width]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const previousKey = useRef(pointsKey);
  const [reveal, setReveal] = useState({ key: pointsKey, progress: 1 });
  const progress = reduceMotion ? 1 : reveal.key === pointsKey ? reveal.progress : 0;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      previousKey.current = pointsKey;
      setReveal({ key: pointsKey, progress: 1 });
      return;
    }
    if (previousKey.current === pointsKey) return;
    previousKey.current = pointsKey;
    let frame: number;
    let start: number | undefined;
    const advance = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 800);
      setReveal({ key: pointsKey, progress });
      if (progress < 1) frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [pointsKey, reduceMotion]);

  const { bounds, coordinates } = chart;
  const line = traceCashLine(coordinates, progress);
  if (coordinates.length === 0) return null;
  const labelIndices = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));

  return <Svg testID="cash-line-plot" width="100%" height={chart.height} viewBox={`0 0 ${chart.width} ${chart.height}`}>
    <Defs><ClipPath id={clipId}><Rect x={bounds.left} y={bounds.top} width={bounds.right - bounds.left} height={bounds.bottom - bounds.top} /></ClipPath></Defs>
    {chart.ticks.map((tick, index) => <G key={index}>
      <Line x1={bounds.left} x2={bounds.right} y1={tick.y} y2={tick.y} stroke={Colors.hexE2EBF0} strokeDasharray="4,4" />
      <SvgText x={bounds.left - 8} y={tick.y + 4} textAnchor="end" fontSize={10} fill={Colors.hex64748B}>{(tick.value / 100).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })}</SvgText>
    </G>)}
    <Line x1={bounds.left} x2={bounds.right} y1={chart.zeroY} y2={chart.zeroY} stroke={Colors.hex94A3B8} strokeDasharray="4,4" />
    <G clipPath={`url(#${clipId})`}>
      <Path testID="cash-line" d={line.path} fill="none" stroke={Colors.hex0B4F6C} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={coordinates[0].x} cy={coordinates[0].y} r={3} fill={Colors.hex0B4F6C} />
      {line.tip && <Circle testID="cash-line-tip" cx={line.tip.x} cy={line.tip.y} r={3} fill={Colors.hex0B4F6C} />}
    </G>
    {labelIndices.map((index, position) => <SvgText key={index} x={coordinates[index].x} y={166} textAnchor={position === 0 ? "start" : position === labelIndices.length - 1 ? "end" : "middle"} fontSize={10} fill={Colors.hex64748B}>{displayDate(points[index].date).slice(0, 5)}</SvgText>)}
  </Svg>;
}
