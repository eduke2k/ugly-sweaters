<template>
  <div class="image-select">
    <h2>{{ props.title }}</h2>
    <div class="preview-container">
      <img v-if="fileUrl" :src="fileUrl" width="100" />
    </div>
    <div class="input-container">
      <input type="file" accept="image/*" @change="handleInputChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
export type FileEventTarget = EventTarget & { files: FileList };

const props = defineProps({
  title: { type: String, required: true },
});

const emit = defineEmits(["update:modelValue"]);

const fileUrl = ref("");
const handleInputChange = (event: Event): void => {
  const target = event.target as FileEventTarget;
  fileUrl.value = URL.createObjectURL(target.files[0]);
  emit("update:modelValue", fileUrl.value);
};
</script>

<style lang="scss">
.image-select {
  display: flex;
  flex-direction: column;

  h2 {
    margin: 0;
  }
}
</style>
