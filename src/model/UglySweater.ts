import { getRandomItem } from '@/functions';
import { useStore } from '@/store';
import { GifReader } from 'omggif';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export type ImageOutputType = 'png' | 'jpg' | 'gif';
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
  isGif: boolean;
  foregroundUrl: string;
  foregroundWidth: number;
  foregroundHeight: number;
  renderScale: number;
  backgroundColorEnabled: boolean;
  backgroundColor: string;
  textureType: TextureType
};

export type LoadImageProps = {
  width: number;
  height: number;
}

export type MarvinGifData = {
  frames: MarvinImage[];
  processedFrames: MarvinImage[];
  frameInfos: any[];
}

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

  private marvinGifData?: MarvinGifData;
  private foregroundImage?: MarvinImage;
  private knitImages?: MarvinImage[];
  private knitBackgroundImages?: MarvinImage[];

  private renderProps?: RenderProps;
  private store = useStore();
  private gifDownloadUrl = '';

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

  public async loadGifFrameList (gifUrl: string): Promise<MarvinGifData> {
    const response = await fetch(gifUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const intArray = new Uint8Array(arrayBuffer);

    const reader = new GifReader(intArray as Buffer);
    const info = reader.frameInfo(0);

    const data: MarvinGifData = {
      frames: [],
      processedFrames: [],
      frameInfos: new Array(reader.numFrames()).fill(0).map((_, k) => JSON.parse(JSON.stringify(reader.frameInfo(k))))
    };

    data.frames = new Array(reader.numFrames()).fill(0).map((_, k) => {
      const imageData = new ImageData(info.width, info.height);
      const image = new MarvinImage(info.height, info.height);
      reader.decodeAndBlitFrameRGBA(k, imageData.data);
      const pixelLength = imageData.data.length / 4;
      [...Array(pixelLength)].forEach((p, i) => {
        const x = i % info.width;
        const y = Math.floor(i / info.width);
        const startIndex = i * 4;
        image.setIntColor4(x, y, imageData.data[startIndex + 3], imageData.data[startIndex], imageData.data[startIndex + 1], imageData.data[startIndex + 2]);
      });
      return image;
    });

    return data;
  }


  public async render(payload: RenderProps): Promise<void> {
    this.reset();
    this.renderProps = payload;

    const textureConfig = textureConfigs.find(t => t.type === payload.textureType);
    if (!textureConfig) throw new Error(`Could not find texture type for corresponding texture type '${payload.textureType}'`);

    if (payload.isGif) {
      this.marvinGifData = await this.loadGifFrameList(payload.foregroundUrl);
    }

    this.store.setImageType(payload.isGif ? 'gif' : 'image');

    const promises = [
      this.loadImage(payload.foregroundUrl),
      this.loadImages(textureConfig.knitImageUrls)
    ];

    if (textureConfig.knitBackgroundUrls) {
      promises.push(this.loadImages(textureConfig.knitBackgroundUrls));
    }

    const results = await Promise.all(promises);
    
    // Currently, image processing is done depending on available image data. Either gif or regular image.
    // This is rather dirty. Better implementation recommended
    if (this.marvinGifData) {
      // Process Foreground gif
      const marvinGifData = this.marvinGifData;
      this.marvinGifData.frames.forEach((image, index) => {
        const imageProcessed = image.clone(); 
        Marvin.scale(image, imageProcessed, payload.foregroundWidth, payload.foregroundHeight);
        marvinGifData.processedFrames.push(imageProcessed);
      });
      // Keeping foregroundImage around for backwards compatibility. Let's just punch in the first frame
      this.foregroundImage = marvinGifData.processedFrames[0];
    } else if (results[0] && !Array.isArray(results[0])) {
      // Process Foreground image 
      const image = results[0]; 
      const imageProcessed = image.clone(); 
      Marvin.scale(image, imageProcessed, payload.foregroundWidth, payload.foregroundHeight);
      this.foregroundImage = imageProcessed;
    }

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

    if (imageType === 'gif') {
      link.href = this.getGifDownloadUrl();
    } else {
      link.href = this.canvas.toDataURL(this.getImageOutputType(imageType), 0.8);
    }
    link.click();
  }

  private getImageExtension(imageType: ImageOutputType): string {
    switch (imageType) {
      case 'png': return 'png';
      case 'gif': return 'gif';
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
    const knitOffsetX = ((this.knitImages[0].width + (textureConfig.knitXGap))) * this.renderProps.renderScale;
    const knitOffsetY = ((this.knitImages[0].height + (textureConfig.knitYGap))) * this.renderProps.renderScale;
    const canvasWidth = ((this.foregroundImage.width * knitOffsetX) + (this.knitImages[0].width * this.renderProps.renderScale )  - knitOffsetX);
    const canvasHeight = ((this.foregroundImage.height * knitOffsetY) + (this.knitImages[0].height * this.renderProps.renderScale) - knitOffsetY);
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    const imagesToProcess = this.marvinGifData?.processedFrames ?? [this.foregroundImage];
    const drawToMainCTX = imagesToProcess.length === 1;
    const knitImages = this.knitImages;
    const renderProps = this.renderProps;

    this.bufferCanvas.width = knitImages[0].width * renderProps.renderScale;
    this.bufferCanvas.height = knitImages[0].height * renderProps.renderScale;

    if (drawToMainCTX) {
      this.draw(this.canvas, this.bufferCanvas, imagesToProcess[0], textureConfig, knitImages, knitOffsetX, knitOffsetY, this.renderProps);
    } else {
      const gif = GIFEncoder();

      imagesToProcess.forEach(image => {
        if (!this.canvas || !this.ctx) return;
        this.draw(this.canvas, this.bufferCanvas, image, textureConfig, knitImages, knitOffsetX, knitOffsetY, renderProps);
        const { data, width, height } = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, width, height, { palette });
      });

      gif.finish();
      const output = gif.bytes();

      const blob = new Blob([output], {
        type: 'image/gif'
      });

      this.gifDownloadUrl = window.URL.createObjectURL(blob);
    }
    this.store.setFinished(true);
  }

  public getGifDownloadUrl (): string {
    return this.gifDownloadUrl;
  }

  // private downloadURL = (data: string, fileName: string) => {
  //   const a = document.createElement('a');
  //   a.href = data;
  //   a.download = fileName;
  //   document.body.appendChild(a);
  //   a.style.setProperty('display', 'none');
  //   a.click();
  //   a.remove();
  // };

  // private downloadBlob = (data: Uint8ClampedArray, fileName: string, mimeType: string) => {
  //   const blob = new Blob([data], {
  //     type: mimeType
  //   });
  //   const url = window.URL.createObjectURL(blob);
  //   this.downloadURL(url, fileName);
  //   setTimeout(function() {
  //     return window.URL.revokeObjectURL(url);
  //   }, 1000);
  // };

  private draw (mainCanvas: HTMLCanvasElement, bufferCanvas: HTMLCanvasElement, image: MarvinImage, textureConfig: TextureConfig, knitImages: MarvinImage[], knitOffsetX: number, knitOffsetY: number, renderProps: RenderProps ): void {
    const ctx = mainCanvas.getContext("2d", { willReadFrequently: true });
    const bufferContext = this.bufferCanvas.getContext("2d");
    if (!bufferContext || !ctx) throw new Error("Missing 2d rendering context on canvas");

    // Reset
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    bufferContext.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

    if (renderProps?.backgroundColorEnabled) {
      ctx.fillStyle = `${renderProps.backgroundColor}`;
      ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);  
    }

    if (this.knitBackgroundImages) {
      for(let y = 0; y < image.height; y++) {
        for(let x = 0; x < image.width; x++) {
          const random = getRandomItem(this.knitBackgroundImages);
          ctx.drawImage(random.image, x * random.image.width * renderProps.renderScale, y * random.image.height * renderProps.renderScale, random.image.width * renderProps.renderScale, random.image.height * renderProps.renderScale);
        }
      }
    }

    for(let y = 0; y < image.height; y++) {
      for(let x = 0; x < image.width; x++) {

        const actualY = y;
        
        const red = image.getIntComponent0(x,actualY);
        const green = image.getIntComponent1(x,actualY);
        const blue = image.getIntComponent2(x,actualY);
        const alpha = image.getAlphaComponent(x,actualY);

        const isWhite = (red === 255 && green === 255 && blue === 255);
        const isTransparent = alpha === 0;

        if ((!textureConfig.skipWhite || !isWhite) && !isTransparent) {
          const random = getRandomItem(knitImages);

          // Create colored knit in buffer
          bufferContext.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
          bufferContext.globalCompositeOperation = 'source-over';
          bufferContext.drawImage(random.image, 0, 0, random.image.width * renderProps.renderScale, random.image.height * renderProps.renderScale);
          bufferContext.globalCompositeOperation = textureConfig.globalCompositeOperation;
          bufferContext.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          bufferContext.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

          const vary = 128 + ((Math.random() - 0.5) * 50);
          bufferContext.globalCompositeOperation = 'soft-light';
          bufferContext.fillStyle = `rgb(${vary}, ${vary}, ${vary})`;
          bufferContext.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

          bufferContext.globalCompositeOperation = 'destination-in';
          bufferContext.drawImage(random.image, 0, 0, random.image.width * renderProps.renderScale, random.image.height * renderProps.renderScale);
          ctx.drawImage(this.bufferCanvas, x * knitOffsetX, y * knitOffsetY);
        }
      }
    }
  }
}
