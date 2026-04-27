const NEG_INF = Number.NEGATIVE_INFINITY;

class Node {
  constructor(id, key) {
    this.id = id;
    this.key = key;
    this.degree = 0;
    this.marked = false;
    this.parent = null;
    this.child = null;
    this.left = this;
    this.right = this;
  }
}

export class FibonacciHeap {
  constructor() {
    this.min = null;
    this.n = 0;
    this.nodes = new Map();
    this.nextId = 1;
  }

  insert(key) {
    const node = new Node(String(this.nextId++), Number(key));
    this.min = this.#mergeRootLists(this.min, node);
    this.n += 1;
    this.nodes.set(node.id, node);
    return node.id;
  }

  findMin() {
    return this.min ? { id: this.min.id, key: this.min.key } : null;
  }

  extractMin() {
    const z = this.min;
    if (!z) return null;

    if (z.child) {
      const children = [...this.#iterateCircular(z.child)];
      for (const child of children) {
        child.parent = null;
        child.marked = false;
        this.#removeFromList(child);
        this.min = this.#mergeRootLists(this.min, child);
      }
      z.child = null;
      z.degree = 0;
    }

    const wasSingleRoot = z === z.right;
    const nextRoot = z.right;
    this.#removeFromList(z);

    if (wasSingleRoot) {
      this.min = null;
    } else {
      this.min = nextRoot;
      this.#consolidate();
    }

    this.n -= 1;
    this.nodes.delete(z.id);
    return { id: z.id, key: z.key };
  }

  decreaseKey(nodeId, newKey, onEvent = () => {}) {
    const x = this.#getNode(nodeId);
    const nextKey = Number(newKey);
    if (nextKey > x.key) {
      throw new Error(`newKey ${nextKey} must be <= current key ${x.key}`);
    }

    const old = x.key;
    x.key = nextKey;
    onEvent({ type: 'decreaseKey', nodeId: x.id, oldKey: old, newKey: nextKey });

    const y = x.parent;
    if (y && x.key < y.key) {
      this.#cut(x, y, onEvent);
      this.#cascadingCut(y, onEvent);
    }

    if (!this.min || x.key < this.min.key) {
      this.min = x;
      onEvent({ type: 'newMin', nodeId: x.id, key: x.key });
    }
  }

  delete(nodeId, onEvent = () => {}) {
    this.decreaseKey(nodeId, NEG_INF, onEvent);
    return this.extractMin();
  }

  toSnapshot() {
    return {
      min: this.min ? this.min.id : null,
      n: this.n,
      roots: this.min ? [...this.#iterateCircular(this.min)].map((root) => this.#serializeTree(root)) : [],
      nodeIds: [...this.nodes.keys()],
    };
  }

  validate() {
    const errors = [];
    if (!this.min) {
      if (this.n !== 0) errors.push('n should be 0 when min is null');
      return errors;
    }

    const visited = new Set();
    let minKey = Infinity;

    const walk = (node, parent = null) => {
      const siblings = [...this.#iterateCircular(node)];
      for (const s of siblings) {
        if (visited.has(s.id)) {
          errors.push(`duplicate visit: ${s.id}`);
          continue;
        }
        visited.add(s.id);

        if (s.parent !== parent) {
          errors.push(`parent mismatch at ${s.id}`);
        }
        if (s.left.right !== s || s.right.left !== s) {
          errors.push(`broken sibling links at ${s.id}`);
        }
        if (parent && s.key < parent.key) {
          errors.push(`heap order violated ${s.id}<${parent.id}`);
        }
        minKey = Math.min(minKey, s.key);

        let childCount = 0;
        if (s.child) {
          childCount = [...this.#iterateCircular(s.child)].length;
          walk(s.child, s);
        }
        if (childCount !== s.degree) {
          errors.push(`degree mismatch at ${s.id}; degree=${s.degree}, children=${childCount}`);
        }
      }
    };

    walk(this.min, null);

    if (visited.size !== this.n) {
      errors.push(`node count mismatch visited=${visited.size}, n=${this.n}`);
    }
    if (this.min.key !== minKey) {
      errors.push(`min pointer mismatch min=${this.min.key}, expected=${minKey}`);
    }

    return errors;
  }

  #serializeTree(root) {
    return {
      id: root.id,
      key: root.key,
      degree: root.degree,
      marked: root.marked,
      parentId: root.parent ? root.parent.id : null,
      children: root.child ? [...this.#iterateCircular(root.child)].map((child) => this.#serializeTree(child)) : [],
    };
  }

  #getNode(nodeId) {
    const node = this.nodes.get(String(nodeId));
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    return node;
  }

  *#iterateCircular(start) {
    if (!start) return;
    let curr = start;
    do {
      yield curr;
      curr = curr.right;
    } while (curr !== start);
  }

  #mergeRootLists(a, b) {
    if (!a) return b;
    if (!b) return a;

    const aRight = a.right;
    const bLeft = b.left;

    a.right = b;
    b.left = a;
    aRight.left = bLeft;
    bLeft.right = aRight;

    return a.key <= b.key ? a : b;
  }

  #removeFromList(x) {
    x.left.right = x.right;
    x.right.left = x.left;
    x.left = x;
    x.right = x;
  }

  #link(y, x) {
    this.#removeFromList(y);
    y.parent = x;
    y.marked = false;

    if (!x.child) {
      x.child = y;
    } else {
      const child = x.child;
      y.left = child;
      y.right = child.right;
      child.right.left = y;
      child.right = y;
    }
    x.degree += 1;
  }

  #consolidate() {
    const roots = [...this.#iterateCircular(this.min)];
    const maxDegree = Math.floor(Math.log2(this.n)) + 3;
    const degreeTable = new Array(maxDegree).fill(null);

    for (let w of roots) {
      let x = w;
      let d = x.degree;
      while (degreeTable[d]) {
        let y = degreeTable[d];
        if (x.key > y.key) {
          [x, y] = [y, x];
        }
        this.#link(y, x);
        degreeTable[d] = null;
        d += 1;
      }
      degreeTable[d] = x;
    }

    this.min = null;
    for (const node of degreeTable) {
      if (!node) continue;
      node.left = node;
      node.right = node;
      this.min = this.#mergeRootLists(this.min, node);
    }
  }

  #cut(x, y, onEvent) {
    if (y.child === x) {
      if (x.right !== x) {
        y.child = x.right;
      } else {
        y.child = null;
      }
    }
    y.degree -= 1;
    this.#removeFromList(x);
    x.parent = null;
    x.marked = false;
    this.min = this.#mergeRootLists(this.min, x);
    onEvent({ type: 'cut', nodeId: x.id, parentId: y.id });
  }

  #cascadingCut(y, onEvent) {
    const z = y.parent;
    if (!z) return;

    if (!y.marked) {
      y.marked = true;
      onEvent({ type: 'mark', nodeId: y.id });
    } else {
      this.#cut(y, z, onEvent);
      onEvent({ type: 'cascadingCut', nodeId: y.id, parentId: z.id });
      this.#cascadingCut(z, onEvent);
    }
  }
}
