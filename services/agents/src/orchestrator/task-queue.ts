export type QueuedTask = {
  id: string;
  title: string;
  payload?: Record<string, unknown>;
};

export class TaskQueue {
  private readonly queue: QueuedTask[] = [];

  enqueue(task: QueuedTask) {
    this.queue.push(task);
  }

  dequeue() {
    return this.queue.shift();
  }

  size() {
    return this.queue.length;
  }
}
