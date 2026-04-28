import { FibonacciHeap } from './fibonacciHeap.js';
import { buildVisualModel } from './visualModel.js';
import { renderSvg } from './rendererSvg.js';
import { OperationLog, eventToMessage } from './operations.js';
import { sampleScenario } from './fixtures.js';

export function createController(doc = document) {
  const heap = new FibonacciHeap();
  const opLog = new OperationLog();
  const touched = new Set();

  const els = {
    svg: doc.getElementById('heap-svg'),
    insertForm: doc.getElementById('insert-form'),
    insertKey: doc.getElementById('insert-key'),
    findMin: doc.getElementById('find-min'),
    extractMin: doc.getElementById('extract-min'),
    decreaseForm: doc.getElementById('decrease-form'),
    decreaseKey: doc.getElementById('decrease-key'),
    deleteSelected: doc.getElementById('delete-selected'),
    resetHeap: doc.getElementById('reset-heap'),
    loadSample: doc.getElementById('load-sample'),
    nodePicker: doc.getElementById('node-picker'),
    selectedNode: doc.getElementById('selected-node'),
    status: doc.getElementById('status'),
    log: doc.getElementById('operation-log'),
    speed: doc.getElementById('speed'),
    speedValue: doc.getElementById('speed-value'),
    playLog: doc.getElementById('play-log'),
    pauseLog: doc.getElementById('pause-log'),
  };

  let selectedId = null;
  let speed = 1;

  const eventHook = (event) => {
    touched.add(event.nodeId);
    opLog.push(eventToMessage(event));
  };

  const setStatus = (msg) => {
    els.status.textContent = msg;
  };

  const setSelectedNodeLabel = () => {
    els.selectedNode.textContent = selectedId ? `Selected: #${selectedId}` : 'Selected: none';
  };

  const syncPicker = () => {
    const ids = heap.toSnapshot().nodeIds;
    els.nodePicker.replaceChildren();

    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = ids.length ? 'Select node' : 'No nodes';
    els.nodePicker.append(empty);

    ids.forEach((id) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `#${id}`;
      if (id === selectedId) opt.selected = true;
      els.nodePicker.append(opt);
    });

    if (!ids.includes(selectedId)) selectedId = null;
    setSelectedNodeLabel();
  };

  const render = () => {
    const snapshot = heap.toSnapshot();
    const model = buildVisualModel(snapshot);
    renderSvg(els.svg, model, selectedId, touched);
    syncPicker();
    renderLog();

    const errors = heap.validate();
    if (errors.length) {
      setStatus(`Invariant failure: ${errors[0]}`);
    }
  };

  const renderLog = () => {
    els.log.replaceChildren();
    opLog.entries.forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = `${entry.message}`;
      els.log.append(li);
    });
  };

  const run = (label, fn) => {
    touched.clear();
    try {
      const result = fn();
      const min = heap.findMin();
      setStatus(`${label}${result ? `: ${JSON.stringify(result)}` : ''}${min ? ` | min=#${min.id} (${min.key})` : ''}`);
      if (!label.startsWith('decreaseKey(') && !label.startsWith('delete(')) {
        opLog.push(label);
      }
      render();
    } catch (error) {
      setStatus(error.message);
    }
  };

  els.insertForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const key = Number(els.insertKey.value);
    run(`insert(${key})`, () => ({ nodeId: heap.insert(key) }));
  });

  els.findMin.addEventListener('click', () => run('findMin()', () => heap.findMin()));
  els.extractMin.addEventListener('click', () => run('extractMin()', () => heap.extractMin()));

  els.decreaseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selectedId) {
      setStatus('Select a node first');
      return;
    }
    const next = Number(els.decreaseKey.value);
    run(`decreaseKey(${selectedId}, ${next})`, () => heap.decreaseKey(selectedId, next, eventHook));
  });

  els.deleteSelected.addEventListener('click', () => {
    if (!selectedId) {
      setStatus('Select a node first');
      return;
    }
    run(`delete(${selectedId})`, () => heap.delete(selectedId, eventHook));
    selectedId = null;
  });

  els.resetHeap.addEventListener('click', () => {
    while (heap.extractMin()) {
      // drain heap to reset quickly
    }
    opLog.entries = [];
    selectedId = null;
    run('reset()', () => null);
  });

  els.loadSample.addEventListener('click', () => {
    while (heap.extractMin()) {
      // drain heap to reset quickly
    }
    opLog.entries = [];
    sampleScenario.forEach(([op, value]) => {
      if (op === 'insert') {
        const nodeId = heap.insert(value);
        opLog.push(`insert(${value}) => #${nodeId}`);
      }
      if (op === 'extractMin') {
        const out = heap.extractMin();
        opLog.push(`extractMin() => ${out ? `#${out.id}` : 'null'}`);
      }
    });
    render();
    setStatus('Loaded sample scenario');
  });

  els.nodePicker.addEventListener('change', () => {
    selectedId = els.nodePicker.value || null;
    setStatus(selectedId ? `Selected node #${selectedId}` : 'Selection cleared');
    render();
  });

  els.svg.addEventListener('click', (event) => {
    const group = event.target.closest('[data-node-id]');
    if (!group) return;
    selectedId = group.dataset.nodeId;
    els.nodePicker.value = selectedId;
    setStatus(`Selected node #${selectedId}`);
    render();
  });

  els.speed.addEventListener('input', () => {
    speed = Number(els.speed.value);
    els.speedValue.textContent = `${speed}x`;
  });

  els.playLog.addEventListener('click', () => {
    opLog.scheduleReplay((entry) => setStatus(`[replay] ${entry.message}`), speed);
  });

  els.pauseLog.addEventListener('click', () => {
    opLog.stopReplay();
    setStatus('Replay paused');
  });

  render();
  return { heap, render };
}
