export function addLine(
  canvas: HTMLCanvasElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style?: string
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.beginPath();
  context.strokeStyle = style ? style : "white";
  context.lineWidth = style ? 3 : 1;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}
