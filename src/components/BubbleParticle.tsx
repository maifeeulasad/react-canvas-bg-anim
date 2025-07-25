import React, { useEffect, useRef, useCallback } from 'react';

interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  
  update(dt: number): void;
  bounds(): { x: number; y: number; w: number; h: number };
  keepInBounds(other: { x: number; y: number; w: number; h: number }): void;
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

  keepInBounds(other: { x: number; y: number; w: number; h: number }): void {
    const me = this.bounds();
    
    if (me.x < other.x) {
      this.x += other.x - me.x;
      this.vx = -this.vx;
    } else if (me.x + me.w > other.x + other.w) {
      this.x += (other.x + other.w) - (me.x + me.w);
      this.vx = -this.vx;
    }
    
    if (me.y < other.y) {
      this.y += other.y - me.y;
      this.vy = -this.vy;
    } else if (me.y + me.h > other.y + other.h) {
      this.y += (other.y + other.h) - (me.y + me.h);
      this.vy = -this.vy;
    }
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

interface Mouse {
  x: number;
  y: number;
  isDefined(): boolean;
}

const BubbleParticle: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // @ts-expect-error fix later todo
  const animationRef = useRef<number>();
  // @ts-expect-error fix later todo
  const mouseRef = useRef<Mouse>({ x: -1, y: -1, isDefined: () => mouseRef.current.x !== -1 });
  const objectsRef = useRef<Circle[]>([]);
  const timeRef = useRef({ start: 0, current: 0, dt: 0 });

  // Animation parameters
  const params = {
    objectsCount: 1000,
    mouseDistance: 150,
    minRadius: 10,
    maxRadius: 40,
    radiusAnimSpeed: 50,
    velocityRange: 50,
    clearColor: '#2D373D',
    colors: [
      '#46B29D',
      '#F0CA4D',
      '#E37B40',
      '#F53855'
    ]
  };

  const mouseDistanceSquared = params.mouseDistance * params.mouseDistance;

  const createCircle = useCallback((radius: number, colors: string[], velocityRange: number, filled = true, weight = 1): Circle => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    const circle = new Circle(
      Math.floor(Math.random() * canvas.width),
      Math.floor(Math.random() * canvas.height),
      radius,
      colors[Math.floor(Math.random() * colors.length)],
      filled,
      weight
    );
    
    circle.vx = Math.random() * velocityRange - velocityRange / 2;
    circle.vy = Math.random() * velocityRange - velocityRange / 2;
    
    return circle;
  }, []);

  const initializeBubbles = useCallback(() => {
    const objects: Circle[] = [];
    
    for (let i = 0; i < params.objectsCount; i++) {
      objects.push(createCircle(params.minRadius, params.colors, params.velocityRange, true, 5));
    }
    
    objectsRef.current = objects;
  }, [params.objectsCount, params.minRadius, params.colors, params.velocityRange, createCircle]);

  const updateBubbles = useCallback((width: number, height: number, dt: number) => {
    const screenBounds = { x: 0, y: 0, w: width, h: height };

    for (const o of objectsRef.current) {
      if (mouseRef.current.isDefined()) {
        const diffX = o.x - mouseRef.current.x;
        const diffY = o.y - mouseRef.current.y;
        const distSquared = (diffX * diffX) + (diffY * diffY);
        
        if (distSquared <= mouseDistanceSquared) {
          o.radius += dt * params.radiusAnimSpeed;
          if (o.radius > params.maxRadius) {
            o.radius = params.maxRadius;
          }
        } else {
          o.radius -= dt * params.radiusAnimSpeed;
          if (o.radius < params.minRadius) {
            o.radius = params.minRadius;
          }
        }
      }
      
      o.update(dt);
      o.keepInBounds(screenBounds);
    }
  }, [mouseDistanceSquared, params.radiusAnimSpeed, params.maxRadius, params.minRadius]);

  const drawBubbles = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const o of objectsRef.current) {
      o.draw(ctx);
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

    // Update bubbles
    updateBubbles(canvas.width, canvas.height, timeRef.current.dt);

    // Clear canvas with background color
    ctx.fillStyle = params.clearColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bubbles
    drawBubbles(ctx);

    animationRef.current = requestAnimationFrame(animate);
  }, [updateBubbles, drawBubbles, params.clearColor]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.x = -1;
    mouseRef.current.y = -1;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Resize existing bubbles proportionally
    if (objectsRef.current.length > 0 && oldWidth > 0 && oldHeight > 0) {
      for (const o of objectsRef.current) {
        o.x = (o.x / oldWidth) * canvas.width;
        o.y = (o.y / oldHeight) * canvas.height;
      }
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = params.clearColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Initialize bubbles if they don't exist
    if (objectsRef.current.length === 0) {
      initializeBubbles();
    }
  }, [initializeBubbles, params.clearColor]);

  useEffect(() => {
    resizeCanvas();
    
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [resizeCanvas, animate]);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#2D373D',
      margin: 0,
      padding: 0
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          cursor: 'pointer'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ 
            fontSize: '7rem',
            fontWeight: 'bold',
            margin: '0 0 1rem 0',
            color: '#F0F0F1',
            fontFamily: 'Lobster, cursive',
            textShadow: '0 0 0.5em rgba(0, 0, 0, 1)'
          }}>
            Interactive Bubbles
          </h1>
          <h2 style={{ 
            fontSize: '3rem',
            fontWeight: 'bold',
            margin: 0,
            color: '#F0F0F1',
            fontFamily: 'Lobster, cursive',
            textShadow: '0 0 0.5em rgba(0, 0, 0, 1)'
          }}>
            React TypeScript
          </h2>
        </div>
      </div>
    </div>
  );
};

export default BubbleParticle;