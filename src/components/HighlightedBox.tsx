import React, { useEffect, useRef, useCallback, useState } from 'react';

interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  
  update(dt: number): void;
  bounds(): { x: number; y: number; w: number; h: number };
}

class BaseEntity implements Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  forces: Map<string, [number, number]>;

  constructor(x: number, y: number, vx = 0, vy = 0, ax = 0, ay = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.ax = ax;
    this.ay = ay;
    this.forces = new Map();
  }

  setForce(name: string, value: [number, number]): void {
    this.forces.set(name, value);
  }

  update(dt: number): void {
    let ax = this.ax;
    let ay = this.ay;
    
    for (const [, [x, y]] of this.forces) {
      ax += x;
      ay += y;
    }
    
    this.x += ax * dt * dt / 2 + this.vx * dt;
    this.vx += ax * dt;
    
    this.y += ay * dt * dt / 2 + this.vy * dt;
    this.vy += ay * dt;
  }

  bounds(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: 1, h: 1 };
  }
}

class Circle extends BaseEntity {
  radius: number;
  color: string;
  filled: boolean;
  stroke: number;

  constructor(x: number, y: number, radius: number, color: string, filled = true, weight = 1) {
    super(x, y);
    this.radius = radius;
    this.color = color;
    this.filled = filled;
    this.stroke = weight;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    if (this.filled) {
      ctx.fillStyle = this.color;
      ctx.fill();
    } else {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.stroke;
      ctx.stroke();
    }
  }

  bounds(): { x: number; y: number; w: number; h: number } {
    return { 
      x: this.x - this.radius, 
      y: this.y - this.radius, 
      w: this.radius * 2, 
      h: this.radius * 2 
    };
  }
}

class Path {
  points: [number, number][];
  distances: number[];
  totalDistance: number;

  constructor(p1: [number, number], p2: [number, number]) {
    this.points = [];
    this.distances = [];
    this.totalDistance = 0;
    this.reset(p1, p2);
  }

  reset([x0, y0]: [number, number], [x1, y1]: [number, number]): void {
    const dx = x0 - x1;
    const dy = y0 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);

    this.points = [[x0, y0], [x1, y1]];
    this.distances = [d, d];
    this.totalDistance = d * 2;
  }

  addPoint([x, y]: [number, number]): void {
    const [afterX, afterY] = this.points[0];
    const dxAfter = afterX - x;
    const dyAfter = afterY - y;
    const distAfter = Math.sqrt(dxAfter * dxAfter + dyAfter * dyAfter);

    const [beforeX, beforeY] = this.points[this.points.length - 1];
    const dxBefore = beforeX - x;
    const dyBefore = beforeY - y;
    const distBefore = Math.sqrt(dxBefore * dxBefore + dyBefore * dyBefore);

    this.points.push([x, y]);

    this.totalDistance += distAfter + distBefore - this.distances[this.distances.length - 1];

    this.distances[this.distances.length - 1] = distBefore;
    this.distances.push(distAfter);
  }

  getPoint(alpha: number): [number, number] {
    let targetDist = this.totalDistance * (alpha % 1);
    
    for (let i = 0; i < this.distances.length; i++) {
      const dist = this.distances[i];
      if (targetDist < dist) {
        const t = targetDist / dist;
        const [bx, by] = this.points[i];
        const [ax, ay] = this.points[(i + 1) % this.points.length];
        return [
          (ax - bx) * t + bx,
          (ay - by) * t + by
        ];
      }
      targetDist -= dist;
    }
    
    return this.points[0]; // Fallback
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = ctx.fillStyle = '#00ff00';
    let prev = this.points[this.points.length - 1];
    
    for (const p of this.points) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(prev[0], prev[1]);
      ctx.stroke();
      prev = p;
    }
  }
}

class ParticleFollowPath {
  circle: Circle;
  path: Path;
  pos: number;
  velocity: number;

  constructor(path: Path, velocity: number, radius: number, color: string, filled = true, weight = 1) {
    this.circle = new Circle(0, 0, radius, color, filled, weight);
    this.path = path;
    this.pos = 0;
    this.velocity = velocity;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const [x, y] = this.path.getPoint(this.pos);
    this.circle.x = x;
    this.circle.y = y;
    this.circle.draw(ctx);
  }

  update(dt: number): void {
    this.pos += this.velocity * dt;
  }
}

interface BoxElement {
  getBoundingClientRect(): DOMRect;
  classList: DOMTokenList;
}

const HighlightedBox = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // @ts-expect-error fix later todo
  const animationRef = useRef<number>();
  const particlesRef = useRef<ParticleFollowPath[]>([]);
  const targetBoxRef = useRef<BoxElement | null>(null);
  const timeRef = useRef({ start: 0, current: 0, dt: 0 });
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);

  // Animation parameters
  const params = {
    particlesCount: 30,
    particleVelocity: 0.1,
    particleRadius: 2,
    particleColor: '#ff0000',
    pathOffset: 10
  };

  const createPathAround = useCallback((box: BoxElement, diff = 20): Path => {
    const bounds = box.getBoundingClientRect();
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    const canvasRect = canvas.getBoundingClientRect();

    const left = bounds.x - canvasRect.x - diff;
    const top = bounds.y - canvasRect.y - diff;
    const right = bounds.x - canvasRect.x + bounds.width + diff;
    const bottom = bounds.y - canvasRect.y + bounds.height + diff;

    const path = new Path([left, top], [right, top]);
    path.addPoint([right, bottom]);
    path.addPoint([left, bottom]);
    
    return path;
  }, []);

  const setTargetTo = useCallback((box: BoxElement) => {
    if (targetBoxRef.current !== null) {
      return;
    }
    
    targetBoxRef.current = box;
    const path = createPathAround(targetBoxRef.current, params.pathOffset);
    const particles: ParticleFollowPath[] = [];

    for (let i = 0; i < params.particlesCount; i++) {
      const particle = new ParticleFollowPath(
        path, 
        params.particleVelocity, 
        params.particleRadius, 
        params.particleColor
      );
      particle.pos = i / (params.particlesCount - 1);
      particles.push(particle);
    }

    particlesRef.current = particles;
  }, [createPathAround, params.particlesCount, params.particleVelocity, params.particleRadius, params.particleColor, params.pathOffset]);

  const removeTarget = useCallback(() => {
    targetBoxRef.current = null;
    particlesRef.current = [];
    setHoveredBox(null);
  }, []);

  const updateParticles = useCallback((dt: number) => {
    for (const p of particlesRef.current) {
      p.update(dt);
    }
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const p of particlesRef.current) {
      p.draw(ctx);
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now() / 1000;
    if (timeRef.current.start === 0) {
      timeRef.current.start = now;
    }

    const newTime = now - timeRef.current.start;
    timeRef.current.dt = newTime - timeRef.current.current;
    timeRef.current.current = newTime;

    // Update particles
    updateParticles(timeRef.current.dt);

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    drawParticles(ctx);

    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles, drawParticles]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // @ts-expect-error fix later todo
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Check if mouse is over any box
    const elements = document.elementsFromPoint(x, y);
    for (const elem of elements) {
      if (elem.classList.contains('highlight-box')) {
        const boxIndex = parseInt(elem.getAttribute('data-box-index') || '0');
        setHoveredBox(boxIndex);
        setTargetTo(elem as BoxElement);
        return;
      }
    }
    
    removeTarget();
  }, [setTargetTo, removeTarget]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    resizeCanvas();
    
    const handleResize = () => resizeCanvas();
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const mockEvent = {
        clientX: e.clientX,
        clientY: e.clientY
      } as React.MouseEvent;
      handleMouseMove(mockEvent);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [resizeCanvas, animate, handleMouseMove]);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f0f0f0',
      margin: 0,
      padding: 0
    }}>
      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
      
      {/* Demo content with highlightable boxes */}
      <div style={{
        padding: '50px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '2rem',
          textAlign: 'center',
          color: '#333'
        }}>
          Path Following Particles Demo
        </h1>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div
              key={num}
              className="highlight-box"
              data-box-index={num}
              style={{
                padding: '2rem',
                backgroundColor: hoveredBox === num ? '#e3f2fd' : '#fff',
                border: '2px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                transform: hoveredBox === num ? 'translateY(-2px)' : 'translateY(0)'
              }}
            >
              <h3 style={{
                margin: '0 0 1rem 0',
                color: '#333',
                fontSize: '1.5rem'
              }}>
                Box {num}
              </h3>
              <p style={{
                margin: 0,
                color: '#666',
                lineHeight: '1.5'
              }}>
                Hover over this box to see particles follow a path around its border. 
                The particles will trace the perimeter with smooth animation.
              </p>
            </div>
          ))}
        </div>
        
        <div style={{
          marginTop: '3rem',
          textAlign: 'center',
          color: '#666'
        }}>
          <p>Move your mouse over the boxes above to see the particle trail effect!</p>
        </div>
      </div>
    </div>
  );
};

export default HighlightedBox;