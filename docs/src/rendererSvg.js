function el(name, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  return node;
}

export function renderSvg(svg, model, selectedId = null, touched = new Set()) {
  svg.replaceChildren();

  for (const edge of model.edges) {
    const c1x = edge.x1;
    const c1y = (edge.y1 + edge.y2) / 2;
    const c2x = edge.x2;
    const c2y = (edge.y1 + edge.y2) / 2;
    const path = el('path', {
      class: 'edge',
      d: `M ${edge.x1} ${edge.y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${edge.x2} ${edge.y2}`,
    });
    svg.append(path);
  }

  for (const node of model.nodes) {
    const group = el('g', { class: buildClass(node, selectedId, touched), transform: `translate(${node.x} ${node.y})` });
    group.dataset.nodeId = node.id;

    const circle = el('circle', { r: 26 });
    const key = el('text', { y: -5 });
    key.textContent = String(node.key);
    const label = el('text', { y: 12 });
    label.textContent = `#${node.id}${node.marked ? ' •' : ''}`;

    group.append(circle, key, label);
    svg.append(group);
  }
}

function buildClass(node, selectedId, touched) {
  const parts = ['node'];
  if (node.isMin) parts.push('min');
  if (node.marked) parts.push('marked');
  if (selectedId && node.id === selectedId) parts.push('selected');
  if (touched.has(node.id)) parts.push('touched');
  return parts.join(' ');
}
