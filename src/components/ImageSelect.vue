<template>
  <div class="image-select">
    <div class="preview-container" v-if="fileUrl" >
      <img :src="fileUrl" />
    </div>
    <a class="btn" @click="input?.click">{{ action }} pixel art...</a>
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

  .btn {
    margin-bottom: 16px;
  }

  .preview-container {
    display: flex;
    flex-direction: column;
    background-color: black;
    padding: 4px;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .input {
    display: none;
  }

  h2 {
    margin: 0;
  }
}
</style>
