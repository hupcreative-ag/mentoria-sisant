class ParticlesCanvas extends HTMLElement {
  constructor() {
    super();
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.circles = [];
    this.mouse = { x: 0, y: 0 };
    this.canvasSize = { w: 0, h: 0 };
    this.dpr = window.devicePixelRatio || 1;
    this.animationFrameId = null;

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        position: absolute;
        inset: 0;
        pointer-events: none;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    `;
    shadow.appendChild(style);
    shadow.appendChild(this.canvas);
  }

  get quantity() {
    return Number(this.dataset.quantity) || 60;
  }

  get staticity() {
    return Number(this.dataset.staticity) || 50;
  }

  get ease() {
    return Number(this.dataset.ease) || 50;
  }

  get color() {
    return this.dataset.color || "#3b82f6";
  }

  connectedCallback() {
    this._initialized = true;
    this.initCanvas();
    this.animate();

    this._resizeHandler = () => this.initCanvas();
    window.addEventListener("resize", this._resizeHandler);

    this._mouseMoveHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - this.canvasSize.w / 2;
      const y = e.clientY - rect.top - this.canvasSize.h / 2;
      const inside = x < this.canvasSize.w / 2 && x > -this.canvasSize.w / 2 && y < this.canvasSize.h / 2 && y > -this.canvasSize.h / 2;
      if (inside) {
        this.mouse.x = x;
        this.mouse.y = y;
      }
    };
    window.addEventListener("mousemove", this._mouseMoveHandler);
  }

  disconnectedCallback() {
    this._initialized = false;
    window.removeEventListener("resize", this._resizeHandler);
    window.removeEventListener("mousemove", this._mouseMoveHandler);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  initCanvas() {
    this.resizeCanvas();
    this.drawParticles();
  }

  resizeCanvas() {
    if (this.canvas && this.ctx) {
      this.circles = [];
      const rect = this.getBoundingClientRect();
      this.canvasSize.w = rect.width || this.offsetWidth || 300;
      this.canvasSize.h = rect.height || this.offsetHeight || 150;
      this.canvas.width = this.canvasSize.w * this.dpr;
      this.canvas.height = this.canvasSize.h * this.dpr;
      this.canvas.style.width = this.canvasSize.w + "px";
      this.canvas.style.height = this.canvasSize.h + "px";
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  circleParams() {
    const x = Math.floor(Math.random() * this.canvasSize.w);
    const y = Math.floor(Math.random() * this.canvasSize.h);
    const translateX = 0;
    const translateY = 0;
    const size = Math.random() * 2 + 0.5;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.7 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.15;
    const dy = (Math.random() - 0.5) * 0.15;
    const magnetism = 0.1 + Math.random() * 4;
    return {
      x,
      y,
      translateX,
      translateY,
      size,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism
    };
  }

  drawCircle(circle, update = false) {
    if (this.ctx) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      this.ctx.translate(translateX, translateY);
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, 2 * Math.PI);
      
      let colorStr = this.color;
      if (colorStr.startsWith("#")) {
        const r = parseInt(colorStr.slice(1, 3), 16);
        const g = parseInt(colorStr.slice(3, 5), 16);
        const b = parseInt(colorStr.slice(5, 7), 16);
        colorStr = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else if (colorStr.startsWith("rgb")) {
        if (colorStr.startsWith("rgba")) {
          colorStr = colorStr.replace(/[\d\.]+\)$/, `${alpha})`);
        } else {
          colorStr = colorStr.replace("rgb", "rgba").replace(")", `, ${alpha})`);
        }
      } else {
        colorStr = `rgba(59, 130, 246, ${alpha})`;
      }

      this.ctx.fillStyle = colorStr;
      this.ctx.fill();
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      if (!update) {
        this.circles.push(circle);
      }
    }
  }

  clearContext() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);
    }
  }

  drawParticles() {
    this.clearContext();
    const particleCount = this.quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = this.circleParams();
      this.drawCircle(circle);
    }
  }

  remapValue(value, start1, end1, start2, end2) {
    const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  }

  animate() {
    this.clearContext();
    this.circles.forEach((circle, i) => {
      const edge = [
        circle.x + circle.translateX - circle.size,
        this.canvasSize.w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size,
        this.canvasSize.h - circle.y - circle.translateY - circle.size
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(this.remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));
      
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }

      circle.x += circle.dx;
      circle.y += circle.dy;
      circle.translateX += (this.mouse.x / (this.staticity / circle.magnetism) - circle.translateX) / this.ease;
      circle.translateY += (this.mouse.y / (this.staticity / circle.magnetism) - circle.translateY) / this.ease;

      if (
        circle.x < -circle.size ||
        circle.x > this.canvasSize.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > this.canvasSize.h + circle.size
      ) {
        this.circles.splice(i, 1);
        const newCircle = this.circleParams();
        this.drawCircle(newCircle);
      } else {
        this.drawCircle(
          {
            ...circle,
            x: circle.x,
            y: circle.y,
            translateX: circle.translateX,
            translateY: circle.translateY,
            alpha: circle.alpha
          },
          true
        );
      }
    });

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}

if (!customElements.get("particles-canvas")) {
  customElements.define("particles-canvas", ParticlesCanvas);
}
