class EventEmitter {
    #events: { [key: string]: Function[] } = {};

    on(event: string, listener: Function) {
        if (!this.#events[event]) {
            this.#events[event] = [];
        }
        this.#events[event].push(listener);
    }

    emit(event: string, ...args: any[]) {
        if (!this.#events[event]) {
            return;
        }
        this.#events[event].forEach((listener) => listener(...args));
    }

    off(event: string, listener: Function) {
        if (!this.#events[event]) {
            return;
        }
        this.#events[event] = this.#events[event].filter((l) => l !== listener);
    }

    removeAllListeners(event: string) {
        if (!this.#events[event]) {
            return;
        }
        delete this.#events[event];
    }
}

class EventHandler extends EventEmitter {
    constructor() {
        super();
    }
}

export namespace Events {
    export const eventHandler = new EventHandler();

    export function emit<T extends any>(event: string, ...args: T[]) {
        eventHandler.emit(event, ...args);
    }

    export function on(event: string, listener: Function) {
        eventHandler.on(event, listener);
    }
}
