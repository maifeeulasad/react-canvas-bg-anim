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

class Comet {
  ball: Circle;
  oldY: number;
  dy: number;

  constructor(x: number, y: number) {
    this.ball = new Circle(x, y, 5, '#ffffff');
    this.oldY = y;
    this.dy = 0;
    this.ball.vx = Math.random() * 400 + 700;
    this.ball.vy = -150;
    this.ball.setForce('gravity', [0, 150]);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw comet tail
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(this.ball.x, this.ball.y - 5);
    ctx.lineTo(this.ball.x - 50, this.ball.y + this.dy);
    ctx.lineTo(this.ball.x, this.ball.y + 5);
    ctx.fill();
    
    // Draw comet head
    this.ball.draw(ctx);
    
    ctx.shadowBlur = 0;
  }

  update(dt: number): void {
    this.oldY = this.ball.y;
    this.ball.update(dt);
    this.dy = this.oldY - this.ball.y;
  }
}

class Star extends Circle {
  color2: string;

  constructor(x: number, y: number, radius: number, color: string, color2: string) {
    super(x, y, radius, color);
    this.color2 = color2;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw star glow
    ctx.shadowColor = this.color2;
    ctx.shadowBlur = 5;
    ctx.fillStyle = this.color2;
    
    const d = this.radius * 5;
    const p = this.radius;
    
    // Draw 8-pointed star
    ctx.beginPath();
    ctx.moveTo(this.x - d, this.y);
    ctx.lineTo(this.x - p, this.y + p);
    ctx.lineTo(this.x, this.y + d);
    ctx.lineTo(this.x + p, this.y + p);
    ctx.lineTo(this.x + d, this.y);
    ctx.lineTo(this.x + p, this.y - p);
    ctx.lineTo(this.x, this.y - d);
    ctx.lineTo(this.x - p, this.y - p);
    ctx.lineTo(this.x - d, this.y);
    ctx.fill();
    
    // Draw star center
    super.draw(ctx);
    
    ctx.shadowBlur = 0;
  }
}

const MeteorParticle: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const objectsRef = useRef<(Comet | Star)[]>([]);
  const timeRef = useRef({ start: 0, current: 0, dt: 0 });

  // Animation parameters
  const params = {
    cometCount: 20,
    starCount: 40,
    clearColor: '#232334'
  };

  const createComet = useCallback((width: number, height: number): Comet => {
    return new Comet(
      Math.random() * width - 10,
      (Math.random() + 0.20) * (height / 10 * 8)
    );
  }, []);

  const createStar = useCallback((width: number, height: number): Star => {
    return new Star(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 2,
      '#FFC31E66',
      '#FFC31E66'
    );
  }, []);

  const initializeObjects = useCallback((width: number, height: number) => {
    const objects: (Comet | Star)[] = [];
    
    // Create comets
    for (let i = 0; i < params.cometCount; i++) {
      objects.push(createComet(width, height));
    }
    
    // Create stars
    for (let i = 0; i < params.starCount; i++) {
      objects.push(createStar(width, height));
    }
    
    objectsRef.current = objects;
  }, [params.cometCount, params.starCount, createComet, createStar]);

  const updateObjects = useCallback((width: number, height: number, dt: number) => {
    for (const obj of objectsRef.current) {
      obj.update(dt);
      
      // Reset comets when they go off screen
      if (obj instanceof Comet && obj.ball.x > width + 50) {
        obj.ball.x = (obj.ball.x % width) - 50;
        obj.oldY = obj.ball.y = (Math.random() + 0.20) * (height / 10 * 8);
        obj.dy = 0;
        obj.ball.vy = -150;
      }
    }
  }, []);

  const drawObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const obj of objectsRef.current) {
      obj.draw(ctx);
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

    // Update objects
    updateObjects(canvas.width, canvas.height, timeRef.current.dt);

    // Clear canvas with background color
    ctx.fillStyle = params.clearColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw objects
    drawObjects(ctx);

    animationRef.current = requestAnimationFrame(animate);
  }, [updateObjects, drawObjects, params.clearColor]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Resize existing objects proportionally
    if (objectsRef.current.length > 0 && oldWidth > 0 && oldHeight > 0) {
      for (const obj of objectsRef.current) {
        if (obj instanceof Comet) {
          obj.ball.x = (obj.ball.x / oldWidth) * canvas.width;
          obj.ball.y = (obj.ball.y / oldHeight) * canvas.height;
        } else if (obj instanceof Star) {
          obj.x = (obj.x / oldWidth) * canvas.width;
          obj.y = (obj.y / oldHeight) * canvas.height;
        }
      }
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = params.clearColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Initialize objects if they don't exist
    if (objectsRef.current.length === 0) {
      initializeObjects(canvas.width, canvas.height);
    }
  }, [initializeObjects, params.clearColor]);

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
      backgroundColor: '#232334',
      margin: 0,
      padding: 0
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          cursor: 'default'
        }}
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
            Meteor Shower
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

export default MeteorParticle;