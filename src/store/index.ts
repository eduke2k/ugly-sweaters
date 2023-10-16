import { defineStore } from 'pinia';

type State = {
  imageType: 'image' | 'gif'
  busy: boolean;
  finished: boolean;
}

export const useStore = defineStore('main', {
  state: (): State => ({
    imageType: 'image',
    busy: false,
    finished: false,
  }),
  getters: {
    isBusy (): boolean {
      return this.busy;
    },
    isFinished (): boolean {
      return this.finished;
    },
  },
  actions: {
    setBusy (val: boolean): void {
      this.busy = val;
    },
    setFinished (val: boolean): void {
      this.finished = val;
    },
    setImageType (val: 'image' | 'gif'): void {
      this.imageType = val;
    }
  }
});