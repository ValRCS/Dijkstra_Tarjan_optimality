export function buildVisualModel(snapshot) {
  const nodes = [];
  const edges = [];
  const spacingX = 170;
  const spacingY = 95;

  snapshot.roots.forEach((root, index) => {
    const originX = 110 + index * spacingX;
    walk(root, originX, 80, null);
  });

  function walk(node, x, y, parentId) {
    nodes.push({
      id: node.id,
      key: node.key,
      marked: node.marked,
      isMin: snapshot.min === node.id,
      x,
      y,
      parentId,
    });

    if (!node.children?.length) return;

    const totalWidth = (node.children.length - 1) * spacingX;
    node.children.forEach((child, idx) => {
      const cx = x - totalWidth / 2 + idx * spacingX;
      const cy = y + spacingY;
      edges.push({ from: node.id, to: child.id, x1: x, y1: y, x2: cx, y2: cy });
      walk(child, cx, cy, node.id);
    });
  }

  return { nodes, edges };
}
