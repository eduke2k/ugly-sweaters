<template>
  <header class="mb-5">
    <img class="logo" src="/header.jpg">
  </header>
  <main>
    <section class="uploads mb-8">
      <div class="explanation">
        <h1>Pixel art goes in, ugly sweater pattern comes out</h1>
        <p>Select your pixel art to generate a high resolution ugly sweater pattern for further use. So easy! And free!</p>
      </div>
      <div class="action-containers mb-4">
        <div class="upload-container">
          <h2>Step 1: Choose Pixel Art</h2>
          <ImageSelect title="Foreground" v-model="foregroundFile" />
          <!-- <ImageSelect title="Background" v-model="backgroundFileUrl" /> -->
          <p class="info">Each individual pixel of your selected image will be used to generate the ugly sweater pattern</p>
        </div>
        <div class="scale-container">
          <h2 class="mb-4">Step 2: Scaling</h2>
          <div class="mb-10">
            <p class="text-overline mb-2">Pixel art size</p>
            <div class="d-flex align-center">
              <v-text-field
                v-model="inputWidth"
                variant="outlined"
                density="compact"
                label="Width"
                class="mr-2"
                type="number"
                hide-details
                @change="handleInputWidthChange"
                :disabled="!foregroundFile"
                :step="1"
              />
              <span class="mr-2 info text-grey">x</span>
              <v-text-field
                v-model="inputHeight"
                variant="outlined"
                density="compact"
                label="Height"
                type="number"
                class="mr-2"
                hide-details
                @change="handleInputHeightChange"
                :disabled="!foregroundFile"
                :step="1"
              />
              <span class="info text-grey">px</span>
            </div>
          </div>
          <div>
            <p class="text-overline mb-2">Rendered image scale</p>
            <p class="info mb-4">The final rendering size can be enormous depending on the input image size and texture type. Please start with lower rendering scales before trying 100% to not crash your browser!</p>
            <div class="d-flex align-center">
              <v-slider color="green" :hint="`${Math.round(renderedScale * 100)}% of original size`" v-model="renderedScale" :min="0.01" :max="1"></v-slider>
            </div>
          </div>
        </div>
        <div class="background-container">
          <h2 class="mb-4">Step 3: Ugly style</h2>
          <div class="mb-4">
            <v-select
              label="Select a texture type"
              density="compact"
              variant="outlined"
              :disabled="!foregroundFile"
              hide-details
              v-model="selectedTextureType"
              :items="textureTypeOptions"
            ></v-select>
            <!-- <Dropdown class="dropdown" v-model="selectedTextureType" :options="textureTypeOptions" optionValue="value" optionLabel="name" placeholder="Select a texture type" /> -->
          </div>
          <div class="mb-4">
            <v-checkbox
              variant="dense"
              :disabled="!foregroundFile"
              hide-details
              v-model="backgroundColorEnabled"
            >
              <template v-slot:label>
                <div class="d-flex align-center">
                  <input type="color" @change="handleColorChange" ref="colorInput" value="#000000" class="color-input" :disabled="colorInputDisabled" />
                  <label class="v-label flex-grow-1">Fixed background color</label>
                </div>
              </template>
            </v-checkbox>
            <p class="info text-left">You can choose a fixed background color for your output image or leave it transparent if you like to give it a final touch yourself</p>
          </div>
          <!-- <div>
            <label class="dropdown-label">Target image format</label>
            <Dropdown label class="dropdown" v-model="selectedOutputType" :options="outputTypeOptions" optionValue="value" optionLabel="name" placeholder="Select an output type" />
          </div> -->
        </div>
      </div>

      <div class="action">
        <div
          v-if="!store.isBusy"
          class="btn large"
          v-bind:class="{ disabled: !canRender}"
          type="button"
          value="Submit"
          @click="handleRenderClick"
        >Render Ugly Sweater</div>
      </div>
    </section>
    <section class="rendering mb-2" v-show="store.isFinished">
      <h2>Your ugly sweater is ready!</h2>
      <p class="subtitle">Image resolution: {{ canvas?.width }} x {{ canvas?.height }} px</p>
      <div class="download-actions mb-4">
        <template v-if="isGif">
          <div class="btn mb-4" @click="downloadOutput('gif')">Download (GIF)</div>
        </template>
        <template v-else>
          <div class="btn mb-4" @click="downloadOutput('png')">Download (PNG)</div>
          <div class="btn mb-4" @click="downloadOutput('jpg')">Download (JPG)</div>
        </template>
      </div>
      <canvas ref="canvas" v-show="!isGif" />
      <img v-if="isGif && store.isFinished" :src="getGifDownloadUrl()"  />
    </section>
  </main>
  <footer>
    <div class="footer-part">
      <p><b>Responsible for this release</b></p>
      <p>Eduard But • Im Ellingsfeld 27 D-53347 Alfter • <a target="_href" href="https://www.edutastic.de">www.edutastic.de</a></p>
    </div>
    <div class="footer-part">
      <p><b>Data privacy and Terms of Service</b></p>
      <p>This app does not want your data! It does not use any cookies to track you and none of your personal data is queried nor collected. Any images you select and generate here do not leave your browser session.</p>
      <p>You can use the generated images for personal or commercial use. If you like this app, feel free to share it around! Merry Christmas!</p>
    </div>
    <div class="footer-part">
      <p>You can find the source code on <a target="_blank" href="https://github.com/eduke2k/ugly-sweaters">github</a> since it's open source!</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { onMounted, ref } from "vue";
import ImageSelect, { type ForegroundFile } from "./components/ImageSelect.vue";
import { textureConfigs, UglySweater, type ImageOutputType, type TextureType } from "./model/UglySweater";
import { useStore } from "./store";

export type InputEventTarget = EventTarget & { value: string };
export type CheckboxEventTarget = EventTarget & { checked: boolean };

const store = useStore();
const foregroundFile = ref<ForegroundFile | null>(null);
const canvas = ref<HTMLCanvasElement>();
const colorInput = ref<HTMLInputElement>();
const generator = new UglySweater();
const backgroundColor = ref('#000000');
const backgroundColorEnabled = ref(false);
const inputWidth = ref(1);
const inputHeight = ref(1);
const renderedScale = ref(0.25);
const selectedTextureType = ref<TextureType>('knitted');
const textureTypeOptions = textureConfigs.map(t => ({
  title: t.label,
  value: t.type
}));

onMounted(() => {
  if (canvas.value) {
    generator.init(canvas.value);
  }
});

watch(foregroundFile, async (newFile) => {
  if (newFile) {
    inputWidth.value = newFile.width;
    inputHeight.value = newFile.height;
  }
});

const canRender = computed(() => {
  return !!foregroundFile.value?.fileUrl;
});

const inputRatio = computed(() => {
  return (foregroundFile.value?.width || 1) / (foregroundFile.value?.height || 1);
});

const isGif = computed(() => {
  return store.imageType === 'gif';
});

const colorInputDisabled = computed(() => {
  return !backgroundColorEnabled.value;
});

const handleInputWidthChange = (event: InputEvent): void => {
  const target = event.target as InputEventTarget;
  inputHeight.value = Math.round(parseInt(target.value) / inputRatio.value);
};

const handleInputHeightChange = (event: InputEvent): void => {
  const target = event.target as InputEventTarget;
  inputWidth.value = Math.round(parseInt(target.value) * inputRatio.value);
};

const handleRenderClick = (): void => {
  if (!canRender.value) return;
  if (!foregroundFile.value) return;

  store.setFinished(false);

  generator.render({
    isGif: foregroundFile.value.type === 'gif',
    foregroundUrl: foregroundFile.value.fileUrl,
    foregroundWidth: inputWidth.value,
    foregroundHeight: inputHeight.value,
    renderScale: renderedScale.value,
    backgroundColorEnabled: backgroundColorEnabled.value,
    backgroundColor: backgroundColor.value,
    textureType: selectedTextureType.value
  });
};

const handleColorChange = (event: Event): void => {
  const target = event.target as InputEventTarget;
  backgroundColor.value = target?.value ?? '#000000';
};

// const handleCheckboxChange = (event: Event): void => {
//   const target = event.target as CheckboxEventTarget;
//   backgroundColorEnabled.value = target.checked;
// };

const downloadOutput = (outputOption: ImageOutputType): void => {
  generator.downloadOutput(outputOption);
};

const getGifDownloadUrl = (): string => {
  return generator.getGifDownloadUrl();
};

</script>

<style lang="scss">
@keyframes boing {
  15%, 40%, 75%, 100% {
      transform-origin: center center;
  }
  15% {
      transform: scale(1.2, 1.1);
  }
  40% {
      transform: scale(0.95, 0.95);
  }
  75% {
      transform: scale(1.05, 1);
  }
  100% {
      transform: scale(1, 1);
  }
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: url('/bg.gif') center;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: white;
}

a {
  color: #2dc54d;
  text-decoration: none;
}

.btn {
  text-transform: uppercase;
  background-color: #2dc54d;
  color: white;
  border-radius: 99px;
  font-weight: bold;
  text-align: center;
  padding: 10px 18px;
  cursor: pointer;
  text-shadow: 0px 1px 3px rgba(black, .5);
  transition: all .2s ease-out;

  &:not(.disabled):hover {
    background-color: #15a782;
    animation: boing 300ms ease-in-out;
  }

  &.large {
    padding: 15px 24px;
    background-color: #c8263d;

    &:not(.disabled):hover {
      background-color: #a11e81;
    }
  }

  &.disabled {
    cursor: not-allowed;
    background-color: #292929;
    color: #4d4d4d;
    text-shadow: none;
  }
}

h1 {
  font-family: 'Margarine', cursive;
  font-size: 36px;
}

h2 {
  font-family: 'Margarine', cursive;
  font-size: 18px;
  margin: 0;
  margin-bottom: 8px;
  color: #999999;
}

p {
  color: #999999;
}

#app {
  header {
    height: 200px;
    background: url('/header-bg.jpg') repeat-x center;
    background-size: contain;
    overflow: hidden;
    display: flex;
    justify-content: center;

    > .logo {
      height: 200px;
      object-position: center;
    }
  }

  main {
    padding-left: 28px;
    padding-right: 28px;
    padding-bottom: 28px;

    .explanation {
      text-align: center;
      margin-bottom: 36px;

      h1 {
        margin-bottom: 0;
      }

      p {
        margin: 0;
      }
    }
  }

  footer {
    padding: 28px;
    text-align: center;
    font-size: 12px;

    p {
      margin: 0;
    }

    .footer-part {
      margin-bottom: 16px;
    }
  }

  .rendering {
    background-color: #191919;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    h2 {
      margin: 0;
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      margin-bottom: 16px;
    }

    .download-actions {
      display: flex;

      > * {
        margin-right: 8px;

        &:last-child {
          margin-right: 0;
        }
      }
    }

    canvas {
      max-width: 100%;
      max-height: 500px;
    }
  }

  .uploads {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    
    .action-containers {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-gap: 8px;
      max-width: 1000px;

      > * {
        background-color: #191919;
        box-shadow: 0px 3px 10px rgba(black, 1);
        padding: 28px;
        transition: all .3s ease-out;

        .info {
          margin: 0;
          font-size: 12px;
        }

        .dropdown-label {
          text-transform: uppercase;
          font-weight: bold;
          font-size: 13px;
          letter-spacing: 2px;
          color: #7e7e7e;
        }

        .color-input {
          width: 36px;
          height: 36px;
          margin-right: 6px;
        }

        .dropdown {
          width: 100%;
        }

        &:hover {
          background-color: #1f1f1f;
        }
      }
    }
  }
}
</style>
