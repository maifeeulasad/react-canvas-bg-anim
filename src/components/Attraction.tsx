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

interface Mouse {
  x: number;
  y: number;
  isDefined(): boolean;
}

const Attraction: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef<Mouse>({ x: -1, y: -1, isDefined: () => mouseRef.current.x !== -1 });
  const objectsRef = useRef<Circle[]>([]);
  const timeRef = useRef({ start: 0, current: 0, dt: 0 });
  const mouseButtonsRef = useRef([false, false, false]);

  // Animation parameters
  const params = {
    particleCount: 300,
    radius: 2,
    dispersal: 300,
    range: 100,
    rangeExplosion: 1800,
    force: 800,
    explosionForce: 200,
    minVel: 10,
    maxVel: 150,
    colors: ['#EBF4F7', '#E00B27', '#2474A6', '#F2A30F']
  };

  const changeColorAlpha = useCallback((color: string, alpha: number): string => {
    return color.substr(0, 7) + Math.floor(alpha * 255).toString(16).padStart(2, '0');
  }, []);

  const initializeParticles = useCallback((width: number, height: number) => {
    const objects: Circle[] = [];
    
    for (let i = 0; i < params.particleCount; i++) {
      const rad = Math.random() * 2 * Math.PI;
      const circle = new Circle(
        Math.cos(rad) * Math.random() * width + width / 2,
        Math.sin(rad) * Math.random() * height + height / 2,
        params.radius,
        params.colors[Math.floor(Math.random() * params.colors.length)]
      );
      objects.push(circle);
    }
    
    objectsRef.current = objects;
  }, [params.particleCount, params.radius, params.colors]);

  const updateParticles = useCallback((width: number, height: number, dt: number) => {
    const minX = width * -1.5;
    const maxX = width * 2;
    const minY = height * -1.5;
    const maxY = height * 2;

    for (const o of objectsRef.current) {
      const applyForce = (dx: number, dy: number, norm: number) => {
        o.ax = o.vx * -0.5 + dx * 2 + Math.random() * params.dispersal - params.dispersal / 2;
        o.ay = o.vy * -0.5 + dy * 2 + Math.random() * params.dispersal - params.dispersal / 2;

        const size = Math.sqrt(o.ax * o.ax + o.ay * o.ay);
        if (size !== 0) {
          o.ax /= size;
          o.ay /= size;
        }

        o.ax *= norm * params.force;
        o.ay *= norm * params.force;
      };

      if (mouseRef.current.isDefined()) {
        const dx = mouseRef.current.x - o.x;
        const dy = mouseRef.current.y - o.y;

        let d = Math.sqrt(dx * dx + dy * dy) / params.range;
        if (d < 1) d = 1;

        applyForce(dx, dy, 1 / d);
      } else {
        applyForce(0, 0, 1);
      }

      o.update(dt);

      // Boundary constraints
      if (o.x > maxX) o.x = maxX;
      if (o.x < minX) o.x = minX;
      if (o.y > maxY) o.y = maxY;
      if (o.y < minY) o.y = minY;
    }
  }, [params.dispersal, params.range, params.force]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const o of objectsRef.current) {
      let vel = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
      if (vel > params.maxVel) vel = params.maxVel;
      if (vel < params.minVel) vel = params.minVel;
      
      const alpha = (vel - params.minVel) / (params.maxVel - params.minVel);
      o.color = changeColorAlpha(o.color, alpha);
      o.draw(ctx);
    }
  }, [params.minVel, params.maxVel, changeColorAlpha]);

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
    updateParticles(canvas.width, canvas.height, timeRef.current.dt);

    // Clear with semi-transparent background for trail effect
    ctx.fillStyle = '#23232377';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    drawParticles(ctx);

    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles, drawParticles]);

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

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && mouseRef.current.isDefined()) { // Left click
      for (const o of objectsRef.current) {
        const dx = mouseRef.current.x - o.x;
        const dy = mouseRef.current.y - o.y;
        const d = Math.sqrt(dx * dx + dy * dy) / params.rangeExplosion;
        const norm = 1 / d;

        const dir = Math.random() * 2 * Math.PI;
        o.ax = Math.cos(dir) * norm * params.explosionForce;
        o.ay = Math.sin(dir) * norm * params.explosionForce;

        o.update(timeRef.current.dt);
      }
    }
  }, [params.rangeExplosion, params.explosionForce]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#232323';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Reinitialize particles if they don't exist
    if (objectsRef.current.length === 0) {
      initializeParticles(canvas.width, canvas.height);
    }
  }, [initializeParticles]);

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
      backgroundColor: '#1f2937',
      margin: 0,
      padding: 0
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          cursor: 'crosshair'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
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
            Magnetic particles
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

export default Attraction;