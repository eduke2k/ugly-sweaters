import { getRandomItem } from '@/functions';
import { useStore } from '@/store';

export type ImageOutputType = 'png' | 'jpg';
export type TextureType = 'knitted' | 'cross-stitched';
export type TextureConfig = {
  label: string;
  type: TextureType;
  knitImageUrls: string[];
  knitBackgroundUrls?: string[];
  knitXGap: number;
  knitYGap: number;
  skipWhite: boolean;
  globalCompositeOperation: GlobalCompositeOperation;
}

export type RenderProps = {
  foregroundUrl: string;
  backgroundColorEnabled: boolean;
  backgroundColor: string;
  textureType: TextureType
};

export const textureConfigs: TextureConfig[] = [
  {
    label: 'Knitted (Default)',
    type: 'knitted',
    knitImageUrls: ["/textures/knitted/knit01.png"],
    knitXGap: 0,
    knitYGap: -30,
    skipWhite: false,
    globalCompositeOperation: 'multiply'
  },
  {
    label: 'Cross Stitch',
    type: 'cross-stitched',
    knitImageUrls: [
      "/textures/cross-stitched/stitch01.png",
      "/textures/cross-stitched/stitch02.png",
      "/textures/cross-stitched/stitch03.png"
    ],
    knitBackgroundUrls: ["/textures/cross-stitched/bg01.jpg"],
    knitXGap: -29,
    knitYGap: -29,
    skipWhite: true,
    globalCompositeOperation: 'overlay'
  }
];

export class UglySweater {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;

  private bufferCanvas = document.createElement('canvas');

  private foregroundImage?: MarvinImage;
  private knitImages?: MarvinImage[];
  private knitBackgroundImages?: MarvinImage[];

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

  private loadImage (url: string): Promise<MarvinImage> {
    return new Promise ((resolve) => {
      const image = new MarvinImage();
      image.load(url, () => {
        resolve(image);
      });
    });
  }

  private loadImages (urls: string[]): Promise<MarvinImage[]> {
    const promises = urls.map(u => this.loadImage(u));
    return Promise.all(promises);
  }

  private reset (): void {
    this.knitBackgroundImages = undefined;
    this.knitImages = undefined;
    this.foregroundImage = undefined;
  }


  public async render(payload: RenderProps): Promise<void> {
    this.reset();
    this.renderProps = payload;

    const textureConfig = textureConfigs.find(t => t.type === payload.textureType);
    if (!textureConfig) throw new Error(`Could not find texture type for corresponding texture type '${payload.textureType}'`);

    const promises = [
      this.loadImage(payload.foregroundUrl),
      this.loadImages(textureConfig.knitImageUrls)
    ];

    if (textureConfig.knitBackgroundUrls) {
      promises.push(this.loadImages(textureConfig.knitBackgroundUrls));
    }

    const results = await Promise.all(promises);
    
    if (results[0] && !Array.isArray(results[0])) this.foregroundImage = results[0];
    if (results[1] && Array.isArray(results[1])) this.knitImages = results[1];
    if (results[2] && Array.isArray(results[2])) this.knitBackgroundImages = results[2];

    if (this.foregroundImage) {
      const density = this.foregroundImage.width * this.foregroundImage.height;
      if (density > this.maxAllowedPixels) {
        window.alert(`Your pixel art may not exceed ${this.maxAllowedPixels} pixels in total. It currently has ${density} pixels`);
        return;
      }
    }

    this.generateResult(textureConfig);
  }

  public downloadOutput (imageType: ImageOutputType): void {
    if (!this.canvas) return;

    const link = document.createElement('a');
    link.download = `download.${this.getImageExtension(imageType)}`;
    console.log(imageType, this.getImageOutputType(imageType));
    link.href = this.canvas.toDataURL(this.getImageOutputType(imageType), 0.8);
    link.click();
  }

  private getImageExtension(imageType: ImageOutputType): string {
    switch (imageType) {
      case 'png': return 'png';
      default: return 'jpg';
    }
  }

  private getImageOutputType(imageType: ImageOutputType): string {
    switch (imageType) {
      case 'png': return 'image/png';
      default: return 'image/jpeg';
    }
  }

  private generateResult(textureConfig: TextureConfig) {
    if (!this.foregroundImage || !this.knitImages || !this.canvas || !this.ctx || !this.renderProps) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const knitOffsetX = (this.knitImages[0].width + (textureConfig.knitXGap));
    const knitOffsetY = (this.knitImages[0].height + (textureConfig.knitYGap));

    const canvasWidth = (this.foregroundImage.width * knitOffsetX) + this.knitImages[0].width - knitOffsetX;
    const canvasHeight = (this.foregroundImage.height * knitOffsetY)  + this.knitImages[0].height - knitOffsetY;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Setup buffer
    this.bufferCanvas.width = this.knitImages[0].width;
    this.bufferCanvas.height = this.knitImages[0].height;
    const bufferContext = this.bufferCanvas.getContext("2d");
    if (!bufferContext) throw new Error("Missing 2d rendering context on canvas");

    if (this.renderProps.backgroundColorEnabled) {
      this.ctx.fillStyle = `${this.renderProps.backgroundColor}`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);  
    }

    if (this.knitBackgroundImages) {
      for(let y = 0; y < this.foregroundImage.height; y++) {
        for(let x = 0; x < this.foregroundImage.width; x++) {
          const random = getRandomItem(this.knitBackgroundImages);
          this.ctx.drawImage(random.image, x * random.image.width, y * random.image.height);
        }
      }
    }

    for(let y = 0; y < this.foregroundImage.height; y++) {
      for(let x = 0; x < this.foregroundImage.width; x++) {

        const actualY = y;
        
        const red = this.foregroundImage.getIntComponent0(x,actualY);
        const green = this.foregroundImage.getIntComponent1(x,actualY);
        const blue = this.foregroundImage.getIntComponent2(x,actualY);
        const alpha = this.foregroundImage.getAlphaComponent(x,actualY);

        const isWhite = (red === 255 && green === 255 && blue === 255);
        const isTransparent = alpha === 0;

        if ((!textureConfig.skipWhite || !isWhite) && !isTransparent) {
          const random = getRandomItem(this.knitImages);

          // Create colored knit in buffer
          bufferContext.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
          bufferContext.globalCompositeOperation = 'source-over';
          bufferContext.drawImage(random.image, 0, 0);
          bufferContext.globalCompositeOperation = textureConfig.globalCompositeOperation;
          bufferContext.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          bufferContext.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

          const vary = 128 + ((Math.random() - 0.5) * 50);
          bufferContext.globalCompositeOperation = 'soft-light';
          bufferContext.fillStyle = `rgb(${vary}, ${vary}, ${vary})`;
          bufferContext.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

          bufferContext.globalCompositeOperation = 'destination-in';
          bufferContext.drawImage(random.image, 0, 0);
          this.ctx.drawImage(this.bufferCanvas, x * knitOffsetX, y * knitOffsetY);
        }

        this.store.setFinished(true);
      }
    }
  }
}
