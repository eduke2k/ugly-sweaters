declare class MarvinImage {
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
  getIntComponent0: (x:number, y: number) => number;
  getIntComponent1: (x:number, y: number) => number;
  getIntComponent2: (x:number, y: number) => number;
  getAlphaComponent: (x:number, y: number) => number;
}
