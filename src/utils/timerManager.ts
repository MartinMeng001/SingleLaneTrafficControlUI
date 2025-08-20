// src/utils/timerManager.ts

/**
 * 定时器管理工具
 * 负责追踪和清理所有setTimeout和setInterval
 */
export class TimerManager {
  private static timeoutIds = new Set<number>();
  private static intervalIds = new Set<number>();

  static set(callback: (...args: unknown[]) => void, delay: number): number {
    const id = setTimeout(() => {
      this.timeoutIds.delete(id as unknown as number);
      callback();
    }, delay);
    this.timeoutIds.add(id as unknown as number);
    return id as unknown as number;
  }

  static interval(callback: (...args: unknown[]) => void, delay: number): number {
    const id = setInterval(callback, delay);
    this.intervalIds.add(id as unknown as number);
    return id as unknown as number;
  }

  static clearAll(): void {
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.intervalIds.forEach(id => clearInterval(id));
    this.timeoutIds.clear();
    this.intervalIds.clear();
  }
}
