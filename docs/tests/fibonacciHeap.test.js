import test from 'node:test';
import assert from 'node:assert/strict';
import { FibonacciHeap } from '../src/fibonacciHeap.js';

test('insert + findMin keeps minimum key', () => {
  const heap = new FibonacciHeap();
  heap.insert(10);
  heap.insert(3);
  heap.insert(25);

  assert.deepEqual(heap.findMin(), { id: '2', key: 3 });
  assert.deepEqual(heap.validate(), []);
});

test('extractMin returns keys in sorted order', () => {
  const heap = new FibonacciHeap();
  [8, 1, 5, 2, 12].forEach((k) => heap.insert(k));

  const out = [];
  let next;
  while ((next = heap.extractMin())) {
    out.push(next.key);
  }

  assert.deepEqual(out, [1, 2, 5, 8, 12]);
  assert.equal(heap.n, 0);
  assert.deepEqual(heap.validate(), []);
});

test('decreaseKey triggers cut and updates min when needed', () => {
  const heap = new FibonacciHeap();
  const ids = [10, 20, 30, 40, 50, 60].map((k) => heap.insert(k));
  heap.extractMin();

  const events = [];
  heap.decreaseKey(ids[4], 1, (event) => events.push(event.type));

  assert.equal(heap.findMin().key, 1);
  assert.ok(events.includes('decreaseKey'));
  assert.deepEqual(heap.validate(), []);
});

test('delete removes specific node', () => {
  const heap = new FibonacciHeap();
  const a = heap.insert(7);
  const b = heap.insert(2);
  const c = heap.insert(9);

  const removed = heap.delete(a);
  assert.equal(removed.id, a);

  const keys = [];
  let next;
  while ((next = heap.extractMin())) keys.push(next.key);

  assert.deepEqual(keys, [2, 9]);
  assert.equal(b, '2');
  assert.equal(c, '3');
  assert.deepEqual(heap.validate(), []);
});
