import { makeAutoObservable } from "mobx";
import { ReactNode } from "react";

export type NotifyAction = "info" | "success" | "warning" | "error" | "muted";

export type NotifyPayload = {
  message: string;
  action?: NotifyAction;
  icon?: ReactNode;
};

const DISPLAY_DURATION = 2500;
const QUEUE_DELAY = 150;

class NotifyStore {
  current: NotifyPayload | null = null;
  queue: NotifyPayload[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  show = (payload: NotifyPayload) => {
    this.queue.push(payload);
    if (!this.current) this.next();
  };

  next = () => {
    const payload = this.queue.shift();
    if (!payload) return;

    this.current = payload;
    this.timer = setTimeout(this.dismiss, DISPLAY_DURATION);
  };

  dismiss = () => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.current = null;

    if (this.queue.length > 0) {
      setTimeout(this.next, QUEUE_DELAY);
    }
  };

  reset = () => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.current = null;
    this.queue = [];
  };
}

export const notifyStore = new NotifyStore();
