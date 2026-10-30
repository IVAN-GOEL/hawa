import html2canvas from 'html2canvas';

export class Container {
  static instances = [];

  constructor(options = {}) {
    this.options = {
      type: 'rounded', // 'rounded' | 'circle' | 'pill'
      borderRadius: options.borderRadius || 16,
      tintOpacity: options.tintOpacity !== undefined ? options.tintOpacity : 0.25,
      warp: options.warp !== undefined ? options.warp : 0.5,
      ...options,
    };

    this.children = [];
    this.domElement = document.createElement('div');
    this.domElement.className = 'liquid-glass-container';
    
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'liquid-glass-canvas';
    this.domElement.appendChild(this.canvas);

    this.contentElement = document.createElement('div');
    this.contentElement.className = 'liquid-glass-content';
    this.domElement.appendChild(this.contentElement);

    this.applyStyles();
    Container.instances.push(this);
    this.initWebGL();
  }

  applyStyles() {
    const { type, borderRadius } = this.options;
    if (type === 'pill') {
      this.domElement.style.borderRadius = '9999px';
    } else if (type === 'circle') {
      this.domElement.style.borderRadius = '50%';
    } else {
      this.domElement.style.borderRadius = `${borderRadius}px`;
    }
  }

  initWebGL() {
    try {
      this.gl = this.canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      if (!this.gl) {
        this.ctx2d = this.canvas.getContext('2d');
      }
    } catch {
      this.ctx2d = this.canvas.getContext('2d');
    }
  }

  addChild(child) {
    this.children.push(child);
    if (child.domElement) {
      this.contentElement.appendChild(child.domElement);
    }
  }

  async sampleBackground(targetNode = document.body) {
    if (!this.domElement.parentElement) return;

    try {
      const rect = this.domElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;

      if (this.ctx2d) {
        // Render 2D simulated glass refraction with tint
        const ctx = this.ctx2d;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Soft tint gradient (baby-pink to subtle linen)
        const grad = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        grad.addColorStop(0, `rgba(245, 198, 210, ${this.options.tintOpacity})`);
        grad.addColorStop(1, `rgba(232, 223, 207, ${this.options.tintOpacity * 0.7})`);
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Highlight rim
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } catch (e) {
      console.warn('Glass capture notice:', e);
    }
  }

  destroy() {
    const idx = Container.instances.indexOf(this);
    if (idx !== -1) {
      Container.instances.splice(idx, 1);
    }
    if (this.gl) {
      const loseContext = this.gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
      this.gl = null;
    }
    this.children = [];
    if (this.domElement.parentElement) {
      this.domElement.parentElement.removeChild(this.domElement);
    }
  }
}
