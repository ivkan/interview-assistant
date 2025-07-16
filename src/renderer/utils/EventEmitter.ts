// Browser-compatible EventEmitter implementation
type EventListener = (...args: any[]) => void

export class EventEmitter {
  private events: { [key: string]: EventListener[] } = {}

  on(event: string, listener: EventListener): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
  }

  emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error('EventEmitter error:', error)
        }
      })
    }
  }

  off(event: string, listener: EventListener): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener)
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event]
    } else {
      this.events = {}
    }
  }
}