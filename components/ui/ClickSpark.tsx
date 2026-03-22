'use client';
import { useRef, useState, useCallback } from 'react';

interface Spark { id: number; x: number; y: number; angle: number; }

interface ClickSparkProps {
  children: React.ReactNode;
  sparkColor?: string;
  sparkCount?: number;
  enabled?: boolean;
}

export function ClickSpark({ children, sparkColor = '#4DFFED', sparkCount = 8, enabled = true }: ClickSparkProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const counterRef = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
      id: ++counterRef.current, x, y, angle: (360 / sparkCount) * i,
    }));
    setSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => setSparks(prev => prev.filter(s => !newSparks.find(ns => ns.id === s.id))), 600);
  }, [enabled, sparkCount]);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} onClick={handleClick}>
      {children}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        {sparks.map(spark => (
          <line key={spark.id}
            x1={spark.x} y1={spark.y}
            x2={spark.x + Math.cos((spark.angle * Math.PI) / 180) * 18}
            y2={spark.y + Math.sin((spark.angle * Math.PI) / 180) * 18}
            stroke={sparkColor} strokeWidth={2} strokeLinecap="round"
            style={{ animation: 'spark-fade 0.6s ease-out forwards' }}
          />
        ))}
      </svg>
      <style>{`@keyframes spark-fade { 0%{opacity:1;stroke-width:2} 100%{opacity:0;stroke-width:0} }`}</style>
    </div>
  );
}
