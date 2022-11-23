<template>
  <main>
    <section class="uploads">
      <div class="upload-container">
        <ImageSelect title="Foreground" v-model="foregroundFileUrl" />
        <ImageSelect title="Background" v-model="backgroundFileUrl" />
      </div>
      <div class="action">
        <input
          :disabled="!canRender"
          type="button"
          value="Submit"
          @click="handleRenderClick"
        />
      </div>
    </section>
    <section class="rendering">
      <canvas ref="canvas" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { onMounted, ref } from "vue";

import ImageSelect from "./components/ImageSelect.vue";
import { UglySweater } from "./model/UglySweater";

const foregroundFileUrl = ref("");
const backgroundFileUrl = ref("");
const canvas = ref<HTMLCanvasElement>();
const generator = new UglySweater();

onMounted(() => {
  if (canvas.value) {
    generator.init(canvas.value);
  }
});

const canRender = computed(() => {
  return !!foregroundFileUrl.value;
});

const handleRenderClick = (): void => {
  generator.render({
    foregroundUrl: foregroundFileUrl.value,
    backgroundUrl: foregroundFileUrl.value,
    knitImageUrl: "/knit2.png",
    knitXGap: 48,
    knitYGap: 39,
  });
};
</script>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #3b3b3b;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: white;
}

#app {
  main {
    > section {
      border-bottom: 1px solid white;
    }
  }

  .uploads {
    .upload-container {
      display: flex;
    }
  }
}
</style>
