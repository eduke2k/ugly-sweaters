<template>
  <div class="image-select">
    <div class="preview-container" v-bind:class="{ filled: !!fileUrl }">
      <div class="ar"></div>
      <div class="btn-container">
        <a class="btn" @click="input?.click">{{ action }} pixel art...</a>
      </div>
      <img v-if="fileUrl" :src="fileUrl" />
    </div>
    <input ref="input" class="input" type="file" accept="image/*" @change="handleInputChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
export type FileEventTarget = EventTarget & { files: FileList };

const emit = defineEmits(["update:modelValue"]);
const input = ref<HTMLInputElement>();

const fileUrl = ref("");
const handleInputChange = (event: Event): void => {
  const target = event.target as FileEventTarget;
  fileUrl.value = URL.createObjectURL(target.files[0]);
  emit("update:modelValue", fileUrl.value);
};

const action = computed(() => {
  return fileUrl.value ? 'Change' : 'Select';
});
</script>

<style lang="scss">
.image-select {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;

  .preview-container {
    position: relative;
    background-color: black;
    padding: 4px;
    border-radius: 4px;
    margin-bottom: 8px;
    width: 100%;

    .ar {
      padding-top: 100%;
    }

    .btn-container {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 100%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 5;
    }

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      z-index: 4;
    }

    &.filled {
      .btn-container {
        .btn {
          opacity: 0;
        }
      }

      &:hover {
        .btn-container {
          .btn {
            opacity: 1;
          }
        }
      }
    }
  }

  .input {
    display: none;
  }

  h2 {
    margin: 0;
  }
}
</style>
