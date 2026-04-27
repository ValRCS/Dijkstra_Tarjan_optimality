export class OperationLog {
  constructor(limit = 200) {
    this.limit = limit;
    this.entries = [];
    this.queue = [];
    this.timer = null;
  }

  push(message) {
    this.entries.push({
      message,
      at: new Date().toISOString(),
    });
    if (this.entries.length > this.limit) {
      this.entries.shift();
    }
  }

  scheduleReplay(callback, speed = 1) {
    this.stopReplay();
    this.queue = [...this.entries];
    this.timer = setInterval(() => {
      const next = this.queue.shift();
      if (!next) {
        this.stopReplay();
        return;
      }
      callback(next);
    }, 700 / speed);
  }

  stopReplay() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export function eventToMessage(event) {
  switch (event.type) {
    case 'decreaseKey':
      return `decreaseKey(node=${event.nodeId}, old=${event.oldKey}, new=${event.newKey})`;
    case 'cut':
      return `cut(node=${event.nodeId}, parent=${event.parentId})`;
    case 'cascadingCut':
      return `cascadingCut(node=${event.nodeId}, parent=${event.parentId})`;
    case 'mark':
      return `mark(node=${event.nodeId})`;
    case 'newMin':
      return `newMin(node=${event.nodeId}, key=${event.key})`;
    default:
      return `${event.type}`;
  }
}
