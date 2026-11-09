export type CashChartPoint = { date: string; balance: number };

/** Revela a linha por distância percorrida; a ponta permanece sobre os segmentos reais. */
export function traceCashLine(coordinates: { x: number; y: number }[], progress: number) {
  const first = coordinates[0];
  if (!first) return { path: "", tip: null };
  const lengths = coordinates.slice(1).map((point, index) => Math.hypot(point.x - coordinates[index].x, point.y - coordinates[index].y));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * Math.max(0, Math.min(1, progress));
  let path = `M ${first.x},${first.y}`;
  let tip = first;
  for (let index = 1; index < coordinates.length; index++) {
    const point = coordinates[index];
    const length = lengths[index - 1];
    if (remaining >= length) {
      path += ` L ${point.x},${point.y}`;
      tip = point;
      remaining -= length;
    } else {
      const previous = coordinates[index - 1];
      const fraction = length === 0 ? 0 : remaining / length;
      tip = { x: previous.x + (point.x - previous.x) * fraction, y: previous.y + (point.y - previous.y) * fraction };
      path += ` L ${tip.x},${tip.y}`;
      break;
    }
  }
  return { path, tip };
}

/** Escala única para saldos positivos e negativos, com margem para toda a espessura da linha. */
export function buildCashChart(points: CashChartPoint[], availableWidth: number) {
  const width = Math.max(180, availableWidth);
  const height = 176;
  const bounds = { left: 64, right: width - 12, top: 12, bottom: 144 };
  const low = Math.min(0, ...points.map(point => point.balance));
  const high = Math.max(0, ...points.map(point => point.balance));
  const padding = (high - low || 100) * 0.1;
  const min = low - padding;
  const max = high + padding;
  const y = (value: number) => bounds.bottom - (value - min) / (max - min) * (bounds.bottom - bounds.top);
  const coordinates = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? (bounds.left + bounds.right) / 2 : bounds.left + 4 + index / (points.length - 1) * (bounds.right - bounds.left - 8),
    y: y(point.balance),
  }));
  return {
    width, height, bounds, coordinates, zeroY: y(0),
    path: coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`).join(" "),
    ticks: Array.from({ length: 5 }, (_, index) => {
      const value = max - index / 4 * (max - min);
      return { value, y: y(value) };
    }),
  };
}
