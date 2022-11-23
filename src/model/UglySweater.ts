import { useStore } from '@/store';
import type { Store } from 'pinia';

export type RenderProps = {
  foregroundUrl: string;
  knitImageUrl: string;
  knitXGap: number;
  knitYGap: number;
  backgroundColorEnabled: boolean;
  backgroundColor: string;
};

export class UglySweater {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;

  private bufferCanvas = document.createElement('canvas');

  private foregroundImage?: MarvinImage;
  private knitImage?: MarvinImage;

  private renderProps?: RenderProps;
  private store = useStore();

  private maxAllowedPixels = 30000;

  public init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Missing 2d rendering context on canvas");
    this.ctx = ctx;
  }

  public getMaxAllowedPixels (): number {
    return this.maxAllowedPixels;
  }

  public render(payload: RenderProps): void {
    this.renderProps = payload;
    const foreGroundImage = new MarvinImage();
    foreGroundImage.load(payload.foregroundUrl, () => {
      this.foregroundImage = foreGroundImage;

      console.log(this.foregroundImage.width, this.foregroundImage.height);
      const density = this.foregroundImage.width * this.foregroundImage.height;
      if (density > this.maxAllowedPixels) {
        window.alert(`Your pixel art may not exceed ${this.maxAllowedPixels} pixels in total. It currently has ${density} pixels`);
        return;
      }

      const knitImage = new MarvinImage();
      knitImage.load(payload.knitImageUrl, () => {
        this.knitImage = knitImage;
        this.generateResult();
      });
    });
    // this.store.setBusy(false);
  }

  public downloadOutput (): void {
    if (!this.canvas) return;

    const link = document.createElement('a');
    link.download = 'download.png';
    link.href = this.canvas.toDataURL();
    link.click();
  }

  private generateResult() {
    if (!this.foregroundImage || !this.knitImage || !this.canvas || !this.ctx || !this.renderProps) return;

    const knitOffsetX = (this.knitImage.width - (this.knitImage.width - this.renderProps.knitXGap));
    const knitOffsetY = (this.knitImage.height - (this.knitImage.height - this.renderProps.knitYGap));

    const canvasWidth = (this.foregroundImage.width * knitOffsetX) + this.knitImage.width - knitOffsetX;
    const canvasHeight = (this.foregroundImage.height * knitOffsetY)  + this.knitImage.height - knitOffsetY;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Setup buffer
    this.bufferCanvas.width = this.knitImage.width;
    this.bufferCanvas.height = this.knitImage.height;
    const bufferContext = this.bufferCanvas.getContext("2d");
    if (!bufferContext) throw new Error("Missing 2d rendering context on canvas");

    if (this.renderProps.backgroundColorEnabled) {
      this.ctx.fillStyle = `${this.renderProps.backgroundColor}`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);  
    }

    for(let y = 0; y < this.foregroundImage.height; y++) {
      for(let x = 0; x < this.foregroundImage.width; x++) {

        const actualY = y;
        
        const red = this.foregroundImage.getIntComponent0(x,actualY);
        const green = this.foregroundImage.getIntComponent1(x,actualY);
        const blue = this.foregroundImage.getIntComponent2(x,actualY);
        // const alpha = this.foregroundImage.getAlphaComponent(x,actualY);

        // Create colored knit in buffer
        bufferContext.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
        bufferContext.globalCompositeOperation = 'source-over';
        bufferContext.drawImage(this.knitImage.image, 0, 0);
        bufferContext.globalCompositeOperation = 'multiply';
        bufferContext.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        bufferContext.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

        const vary = 128 + ((Math.random() - 0.5) * 50);
        bufferContext.globalCompositeOperation = 'soft-light';
        bufferContext.fillStyle = `rgb(${vary}, ${vary}, ${vary})`;
        bufferContext.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

        bufferContext.globalCompositeOperation = 'destination-in';
        bufferContext.drawImage(this.knitImage.image, 0, 0);

        this.ctx.drawImage(this.bufferCanvas, x * knitOffsetX, y * knitOffsetY);
        this.store.setFinished(true);
      }
    }
  }
}
