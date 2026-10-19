"use client";
import { type ReactNode, useRef, useState } from "react";
import { boundPoint, type Point } from "@/lib/models/canvasLayout";
import s from "./CanvasLayout.module.css";
export function MovableNode({
  position,
  onMove,
  label,
  children,
}: {
  position: Point;
  onMove: (point: Point) => void;
  label: string;
  children: ReactNode;
}) {
  const drag = useRef<{ origin: Point; point: Point } | null>(null);
  const [moving, setMoving] = useState<Point>();
  const point = moving ?? position;
  return (
    <div
      className={s.movable}
      style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
    >
      <button
        type="button"
        className={s.handle}
        aria-label={label}
        aria-describedby="canvas-move-guidance"
        onKeyDown={(event) => {
          const delta: Record<string, Point> = {
            ArrowLeft: { x: -10, y: 0 },
            ArrowRight: { x: 10, y: 0 },
            ArrowUp: { x: 0, y: -10 },
            ArrowDown: { x: 0, y: 10 },
          };
          const step = delta[event.key];
          if (!step) return;
          event.preventDefault();
          onMove(
            boundPoint({ x: position.x + step.x, y: position.y + step.y }),
          );
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            origin: { x: event.clientX, y: event.clientY },
            point: position,
          };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (start)
            setMoving(
              boundPoint({
                x: start.point.x + event.clientX - start.origin.x,
                y: start.point.y + event.clientY - start.origin.y,
              }),
            );
        }}
        onPointerUp={(event) => {
          if (!drag.current) return;
          const start = drag.current;
          onMove(
            boundPoint({
              x: start.point.x + event.clientX - start.origin.x,
              y: start.point.y + event.clientY - start.origin.y,
            }),
          );
          drag.current = null;
          setMoving(undefined);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setMoving(undefined);
        }}
      >
        ↔{" "}
        <span aria-hidden="true">
          {point.x}, {point.y}
        </span>
      </button>
      {children}
    </div>
  );
}
