import { defineStore } from 'pinia';

type State = {
  /** The currently selected layout */
  busy: boolean;
  finished: boolean;
}

export const useStore = defineStore('main', {
  state: (): State => ({
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
    }
  }
});