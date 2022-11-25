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
          <ImageSelect title="Foreground" v-model="foregroundFileUrl" />
          <!-- <ImageSelect title="Background" v-model="backgroundFileUrl" /> -->
          <p class="info">Each individual pixel of your selected image will be used to generate the ugly sweater pattern. Images containing more than {{ maxAllowedPixels }}px in total will not work to avoid performance issues.</p>
        </div>
        <div class="background-container">
          <h2>Step 2: Output settings</h2>
          <div class="mb-4">
            <label class="dropdown-label">Texture Settings</label>
            <Dropdown class="dropdown" v-model="selectedTextureType" :options="textureTypeOptions" optionValue="value" optionLabel="name" placeholder="Select a texture type" />
          </div>
          <div class="mb-4">
            <input id="colorInputCheckbox" type="checkbox" @change="handleCheckboxChange" ref="colorInputCheckbox" />
            <label for="colorInputCheckbox">Enable fixed background color</label>
            <input type="color" @change="handleColorChange" ref="colorInput" value="#000000" class="color-input mb-2" v-show="!colorInputDisabled" />
            <p class="info">You can choose a fixed background color for your output image or leave it transparent if you like to give it a final touch yourself</p>
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
        <div class="btn mb-4" @click="downloadOutput('png')">Download (PNG)</div>
        <div class="btn mb-4" @click="downloadOutput('jpg')">Download (JPG)</div>
      </div>
      <canvas ref="canvas" />
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
import { computed } from "vue";
import { onMounted, ref } from "vue";
import Dropdown from 'primevue/dropdown';
import ImageSelect from "./components/ImageSelect.vue";
import { textureConfigs, UglySweater, type ImageOutputType, type TextureType } from "./model/UglySweater";
import { useStore } from "./store";

export type InputEventTarget = EventTarget & { value: string };
export type CheckboxEventTarget = EventTarget & { checked: boolean };

const store = useStore();
const foregroundFileUrl = ref("");
const canvas = ref<HTMLCanvasElement>();
const colorInput = ref<HTMLInputElement>();
const colorInputCheckbox = ref<HTMLInputElement>();
const generator = new UglySweater();
const backgroundColor = ref('#000000');
const backgroundColorEnabled = ref(false);
const selectedTextureType = ref<TextureType>('knitted');
const textureTypeOptions = textureConfigs.map(t => ({
  name: t.label,
  value: t.type
}));

onMounted(() => {
  if (canvas.value) {
    generator.init(canvas.value);
  }
});

const canRender = computed(() => {
  return !!foregroundFileUrl.value;
});

const colorInputDisabled = computed(() => {
  return !backgroundColorEnabled.value;
});

const maxAllowedPixels = computed(() => {
  return generator.getMaxAllowedPixels();
});

// const hasOutput = computed(() => {

// });

const handleRenderClick = (): void => {
  if (!canRender.value) return;

  generator.render({
    foregroundUrl: foregroundFileUrl.value,
    backgroundColorEnabled: backgroundColorEnabled.value,
    backgroundColor: backgroundColor.value,
    textureType: selectedTextureType.value
  });
};

const handleColorChange = (event: Event): void => {
  const target = event.target as InputEventTarget;
  backgroundColor.value = target?.value ?? '#000000';
};

const handleCheckboxChange = (event: Event): void => {
  const target = event.target as CheckboxEventTarget;
  backgroundColorEnabled.value = target.checked;
};

const downloadOutput = (outputOption: ImageOutputType): void => {
  generator.downloadOutput(outputOption);
};

</script>

<style lang="scss">
@import '@primer/css/utilities/index.scss';

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
      grid-template-columns: repeat(2, 1fr);
      grid-gap: 8px;
      max-width: 800px;

      > * {
        background-color: #191919;
        box-shadow: 0px 3px 10px rgba(black, 1);
        padding: 28px;
        transition: all .3s ease-out;

        .info {
          margin: 0;
          font-size: 12px;
          text-align: center;
        }

        .dropdown-label {
          text-transform: uppercase;
          font-weight: bold;
          font-size: 13px;
          letter-spacing: 2px;
          color: #7e7e7e;
        }

        .color-input,
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
