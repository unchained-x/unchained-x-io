import { useCallback, useEffect, useRef } from "react";
import { useIsTouchDevice } from "~/hooks/useDevice";

interface Point {
  x: number;
  y: number;
}

const RING_SIZE = 32;
const HOVER_RING_SIZE = 80;
const TRAIL_LENGTH = 12;
const TRAIL_FADE_SPEED = 0.06;

export default function Cursor() {
  const isTouch = useIsTouchDevice();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pos = useRef<Point>({ x: -100, y: -100 });
  const trail = useRef<(Point & { opacity: number })[]>([]);
  const isHovering = useRef(false);
  const clickRipples = useRef<{ x: number; y: number; radius: number; opacity: number }[]>([]);
  const raf = useRef<number>(0);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      pos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      pos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const point =
        "touches" in e
          ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
          : { x: e.clientX, y: e.clientY };

      clickRipples.current.push({
        ...point,
        radius: 0,
        opacity: isTouch ? 0.3 : 0.8,
      });
    },
    [isTouch],
  );

  useEffect(() => {
    const checkHover = () => {
      const el = document.elementFromPoint(pos.current.x, pos.current.y);
      if (el) {
        const tag = el.tagName.toLowerCase();
        const interactive =
          tag === "a" ||
          tag === "button" ||
          el.closest("a") !== null ||
          el.closest("button") !== null ||
          el.getAttribute("role") === "button";
        isHovering.current = interactive;
      }
    };

    if (!isTouch) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("click", handleClick);
    }
    window.addEventListener("touchstart", handleClick);
    window.addEventListener("touchmove", handleMove);

    const hoverInterval = setInterval(checkHover, 50);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchstart", handleClick);
      window.removeEventListener("touchmove", handleMove);
      clearInterval(hoverInterval);
    };
  }, [isTouch, handleMove, handleClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isTouch) {
        // Trail
        trail.current.unshift({ ...pos.current, opacity: 0.6 });
        if (trail.current.length > TRAIL_LENGTH) trail.current.pop();

        for (let i = trail.current.length - 1; i >= 0; i--) {
          const t = trail.current[i];
          t.opacity -= TRAIL_FADE_SPEED;
          if (t.opacity <= 0) {
            trail.current.splice(i, 1);
            continue;
          }
          const size = (RING_SIZE * 0.3 * t.opacity) / 0.6;
          ctx.beginPath();
          ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 240, 255, ${t.opacity * 0.3})`;
          ctx.fill();
        }

        // Ring
        const ringSize = isHovering.current ? HOVER_RING_SIZE : RING_SIZE;
        const ringWidth = isHovering.current ? 2.5 : 1.5;

        ctx.beginPath();
        ctx.arc(pos.current.x, pos.current.y, ringSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${isHovering.current ? 0.9 : 0.6})`;
        ctx.lineWidth = ringWidth;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(pos.current.x, pos.current.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 240, 255, 0.9)";
        ctx.fill();

        // Glow on hover
        if (isHovering.current) {
          ctx.beginPath();
          ctx.arc(pos.current.x, pos.current.y, ringSize / 2 + 6, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
          ctx.lineWidth = 8;
          ctx.stroke();
        }
      }

      // Click ripples (works for both touch and mouse)
      for (let i = clickRipples.current.length - 1; i >= 0; i--) {
        const r = clickRipples.current[i];
        r.radius += 3;
        r.opacity -= 0.02;
        if (r.opacity <= 0) {
          clickRipples.current.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${r.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, [isTouch]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
