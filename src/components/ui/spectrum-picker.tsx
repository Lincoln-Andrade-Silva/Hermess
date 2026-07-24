"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Seletor de cor próprio, sem o seletor nativo do sistema operacional: uma área
 * de saturação/brilho e um slider de matiz, ambos arrastáveis. Trabalha em HSV
 * porque é o espaço em que essas duas superfícies são intuitivas - a matiz num
 * eixo, saturação e brilho num plano.
 */
export function SpectrumPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const matizRef = useRef<HTMLDivElement>(null);

  const [, sAtual, vAtual] = rgbParaHsv(hexParaRgb(value));
  // A matiz é guardada à parte: em cinza (saturação 0) ou preto (brilho 0) ela
  // some do hex, e sem memória o cursor pularia para vermelho ao mexer.
  const [matiz, setMatiz] = useState(() => rgbParaHsv(hexParaRgb(value))[0]);

  function arrastar(
    onMove: (clientX: number, clientY: number) => void,
  ): (e: React.PointerEvent) => void {
    return (evento) => {
      evento.preventDefault();
      onMove(evento.clientX, evento.clientY);
      const mover = (e: PointerEvent) => onMove(e.clientX, e.clientY);
      const soltar = () => {
        window.removeEventListener("pointermove", mover);
        window.removeEventListener("pointerup", soltar);
      };
      window.addEventListener("pointermove", mover);
      window.addEventListener("pointerup", soltar);
    };
  }

  const moverArea = arrastar((clientX, clientY) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = clamp((clientX - rect.left) / rect.width);
    const v = 1 - clamp((clientY - rect.top) / rect.height);
    onChange(rgbParaHex(hsvParaRgb(matiz, s, v)));
  });

  const moverMatiz = arrastar((clientX) => {
    const rect = matizRef.current?.getBoundingClientRect();
    if (!rect) return;
    const h = clamp((clientX - rect.left) / rect.width) * 360;
    setMatiz(h);
    onChange(rgbParaHex(hsvParaRgb(h, sAtual, vAtual)));
  });

  return (
    <div className={cn("space-y-3 select-none", className)}>
      <div
        ref={areaRef}
        onPointerDown={moverArea}
        className="relative h-40 w-full cursor-crosshair rounded-xl border border-line"
        style={{
          backgroundColor: `hsl(${matiz} 100% 50%)`,
          backgroundImage:
            "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
        }}
      >
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${sAtual * 100}%`, top: `${(1 - vAtual) * 100}%`, backgroundColor: value }}
        />
      </div>

      <div
        ref={matizRef}
        onPointerDown={moverMatiz}
        className="relative h-4 w-full cursor-pointer rounded-full border border-line"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
      >
        <span
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${(matiz / 360) * 100}%`, backgroundColor: `hsl(${matiz} 100% 50%)` }}
        />
      </div>
    </div>
  );
}

function clamp(valor: number): number {
  return Math.min(1, Math.max(0, valor));
}

type Rgb = [number, number, number];

function hexParaRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbParaHex([r, g, b]: Rgb): string {
  const canal = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

/** RGB (0-255) para HSV com matiz em graus e saturação/brilho de 0 a 1. */
function rgbParaHsv([r, g, b]: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : delta / max;
  return [h, s, max];
}

/** HSV (matiz em graus, s/v de 0 a 1) de volta para RGB 0-255. */
function hsvParaRgb(h: number, s: number, v: number): Rgb {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rgb: Rgb;
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return [(rgb[0] + m) * 255, (rgb[1] + m) * 255, (rgb[2] + m) * 255];
}
