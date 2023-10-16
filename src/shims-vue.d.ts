declare class MarvinImage {
  constructor(width?: number, height?: number);
  canvas: HTMLCanvasElement;
  colorModel: number;
  ctx: CanvasRenderingContext2D;
  data: null;
  height: number;
  width: number;
  image: HTMLImageElement;
  imageData: {
    data: Uint8ClampedArray;
    colorSpace: "srgb";
    height: number;
    width: number;
  };
  onload: () => void;
  load: (url: string, callback: () => void) => void;
  clone: () => MarvinImage;
  setIntColor: (x: number, y: number, a1: number, a2: number, a3: number, a4: number) => void;
  setIntColor1: (x: number, y: number, color: string) => void;
  setIntColor4: (x: number, y: number, alpha: number, r: number, g: number, b: number) => void;
  getIntComponent0: (x:number, y: number) => number;
  getIntComponent1: (x:number, y: number) => number;
  getIntComponent2: (x:number, y: number) => number;
  getAlphaComponent: (x:number, y: number) => number;
  update: () => void;
}

declare class Marvin {
  static create: (width: number, height: number) => MarvinImage;
  static grayScale: (original: MarvinImage, processed: MarvinImage) => void;
  static blackAndWhite: (original: MarvinImage, processed: MarvinImage, amount: number) => void;
  static sepia: (original: MarvinImage, processed: MarvinImage, amount: number) => void;
  static emboss: (original: MarvinImage, processed: MarvinImag) => void;
  static halftoneErrorDiffusion: (original: MarvinImage, processed: MarvinImage) => void;
  static scale: (original: MarvinImage, processed: MarvinImage, newWidth: number, newHeight: number) => void;
}

declare module 'gif-encoder-2';
declare module 'gifenc';
