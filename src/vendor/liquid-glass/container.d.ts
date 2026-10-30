export declare class Container {
  static instances: Container[];
  domElement: HTMLDivElement;
  canvas: HTMLCanvasElement;
  contentElement: HTMLDivElement;
  constructor(options?: any);
  applyStyles(): void;
  initWebGL(): void;
  addChild(child: any): void;
  sampleBackground(targetNode?: HTMLElement): Promise<void>;
  destroy(): void;
}
