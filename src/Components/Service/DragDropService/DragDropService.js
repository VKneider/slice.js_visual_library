function getHandleConfig(name) {
  const MAP = {
    n:  { edges: ['n'] },
    s:  { edges: ['s'] },
    e:  { edges: ['e'] },
    w:  { edges: ['w'] },
    ne: { edges: ['n', 'e'] },
    nw: { edges: ['n', 'w'] },
    se: { edges: ['s', 'e'] },
    sw: { edges: ['s', 'w'] },
  };
  return MAP[name] || null;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function computeResizeRect(orig, delta, edges, minW, minH, maxW, maxH) {
  let { top, left, width, height } = orig;
  if (edges.includes('e')) width = clamp(width + delta.x, minW, maxW);
  if (edges.includes('s')) height = clamp(height + delta.y, minH, maxH);
  if (edges.includes('w')) {
    const nw = clamp(width - delta.x, minW, maxW);
    left += width - nw;
    width = nw;
  }
  if (edges.includes('n')) {
    const nh = clamp(height - delta.y, minH, maxH);
    top += height - nh;
    height = nh;
  }
  return { top, left, width, height };
}

export default class DragDropService {
  constructor() {
    this._draggables = new Map();
    this._droppables = new Map();
    this._resizables = new Map();
    this._sortables = new Map();
    this._activeDrag = null;
    this._activeDrop = null;
    this._activeResize = null;
    this._activeSortable = null;
    this._ghost = null;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    document.addEventListener('pointerdown', this._onPointerDown);
    DragDropService._injectCSS();
  }

  static _cssInjected = false;

  static _injectCSS() {
    if (DragDropService._cssInjected) return;
    DragDropService._cssInjected = true;
    const old = document.getElementById('dnd-service-styles');
    if (old) old.remove();
    const style = document.createElement('style');
    style.id = 'dnd-service-styles';
    style.textContent = `
      .dnd-handle{position:absolute;z-index:1;background:rgba(0,0,0,.04);touch-action:none}
      .dnd-handle:hover{background:rgba(59,130,246,.18);border-color:rgba(59,130,246,.4)}
      .dnd-handle--n,.dnd-handle--s,.dnd-handle--e,.dnd-handle--w{border-radius:0;border:1px solid rgba(0,0,0,.12)}
      .dnd-handle--ne,.dnd-handle--nw,.dnd-handle--se,.dnd-handle--sw{border-radius:2px;border:1px solid rgba(0,0,0,.12)}
      .dnd-handle--n{top:-4px;left:4px;right:4px;height:8px;cursor:ns-resize}
      .dnd-handle--s{bottom:-4px;left:4px;right:4px;height:8px;cursor:ns-resize}
      .dnd-handle--e{right:-4px;top:4px;bottom:4px;width:8px;cursor:ew-resize}
      .dnd-handle--w{left:-4px;top:4px;bottom:4px;width:8px;cursor:ew-resize}
      .dnd-handle--ne{top:-4px;right:-4px;width:12px;height:12px;cursor:nesw-resize}
      .dnd-handle--nw{top:-4px;left:-4px;width:12px;height:12px;cursor:nwse-resize}
      .dnd-handle--se{bottom:-4px;right:-4px;width:12px;height:12px;cursor:nwse-resize}
      .dnd-handle--sw{bottom:-4px;left:-4px;width:12px;height:12px;cursor:nesw-resize}
      .dnd-ghost{position:fixed;pointer-events:none;z-index:999999;opacity:.8;margin:0;will-change:transform}
      .dnd-sortable-ph{pointer-events:none;flex:0 0 auto}
      .dnd-dragging{user-select:none;-webkit-user-select:none}
    `;
    document.head.appendChild(style);
  }

  static getInstance() {
    if (!this._instance) this._instance = new this();
    return this._instance;
  }

  // ─── Draggable ───────────────────────────────────────────────

  makeDraggable(node, config = {}) {
    const cfg = {
      handle: config.handle || null,
      data: config.data || null,
      axis: config.axis || 'both',
      ghost: config.ghost !== false,
      ghostClass: config.ghostClass || '',
      threshold: config.threshold || 0,
      freePosition: config.freePosition || false,
      onDragStart: config.onDragStart || null,
      onDrag: config.onDrag || null,
      onDragEnd: config.onDragEnd || null,
    };
    this._draggables.set(node, cfg);
    return this;
  }

  // ─── Droppable ───────────────────────────────────────────────

  makeDroppable(node, config = {}) {
    const cfg = {
      accept: config.accept || null,
      onDragEnter: config.onDragEnter || null,
      onDragLeave: config.onDragLeave || null,
      onDragOver: config.onDragOver || null,
      onDrop: config.onDrop || null,
    };
    this._droppables.set(node, cfg);
    return this;
  }

  // ─── Resizable ───────────────────────────────────────────────

  makeResizable(node, config = {}) {
    const cfg = {
      handles: config.handles || ['se'],
      minWidth: config.minWidth ?? 50,
      minHeight: config.minHeight ?? 50,
      maxWidth: config.maxWidth ?? Infinity,
      maxHeight: config.maxHeight ?? Infinity,
      onResizeStart: config.onResizeStart || null,
      onResize: config.onResize || null,
      onResizeEnd: config.onResizeEnd || null,
    };

    const pos = window.getComputedStyle(node).position;
    if (pos === 'static') node.style.position = 'relative';

    const container = document.createElement('div');
    container.className = 'dnd-resize-handles';
    container.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none';

    for (const name of cfg.handles) {
      const hc = getHandleConfig(name);
      if (!hc) continue;
      const el = document.createElement('div');
      el.className = `dnd-handle dnd-handle--${name}`;
      el.dataset.handle = name;
      el.style.pointerEvents = 'auto';
      el.addEventListener('pointerdown', (e) => this._onHandlePointerDown(e, node, cfg, hc.edges));
      container.appendChild(el);
    }

    node.appendChild(container);
    this._resizables.set(node, cfg);
    return this;
  }

  // ─── Detach / Destroy ────────────────────────────────────────

  detach(node) {
    this._draggables.delete(node);
    this._droppables.delete(node);

    if (this._resizables.delete(node)) {
      const handles = node.querySelector('.dnd-resize-handles');
      if (handles) handles.remove();
    }

    if (this._activeDrag?.node === node) {
      this._endDrag(null);
    }
    if (this._activeDrop?.node === node) {
      this._activeDrop = null;
    }
    if (this._activeResize?.node === node) {
      this._endResize(null);
    }
    return this;
  }

  destroy() {
    document.removeEventListener('pointerdown', this._onPointerDown);
    if (this._activeDrag) this._endDrag(null);
    if (this._activeSortable) this._endSortable(null);

    for (const node of this._resizables.keys()) {
      const handles = node.querySelector('.dnd-resize-handles');
      if (handles) handles.remove();
    }

    this._removeGhost();
    this._draggables.clear();
    this._droppables.clear();
    this._resizables.clear();
    this._sortables.clear();

    document.body.classList.remove('dnd-dragging');
    this._removeDocListeners();
  }

  // ─── Internal: Pointer Dispatch ──────────────────────────────

  _onPointerDown(event) {
    if (event.button !== 0) return;

    for (const [node, cfg] of this._draggables) {
      if (!node.isConnected) continue;
      if (!node.contains(event.target)) continue;
      if (event.target.closest('.dnd-resize-handles')) continue;

      if (cfg.handle) {
        const handleEl = typeof cfg.handle === 'string'
          ? node.querySelector(cfg.handle)
          : cfg.handle;
        if (!handleEl || !handleEl.contains(event.target)) continue;
      }

      this._startDrag(event, node, cfg);
      return;
    }
  }

  _onPointerMove(event) {
    if (this._activeSortable) {
      this._onSortableMove(event);
      return;
    }
    if (this._activeResize) {
      this._onResizeMove(event);
      return;
    }
    if (this._activeDrag) {
      this._onDragMove(event);
    }
  }

  _onPointerUp(event) {
    if (this._activeSortable) {
      this._endSortable(event);
      return;
    }
    if (this._activeResize) {
      this._endResize(event);
      return;
    }
    if (this._activeDrag) {
      this._endDrag(event);
    }
  }

  _addDocListeners() {
    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
  }

  _removeDocListeners() {
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
  }

  // ─── Internal: Drag ──────────────────────────────────────────

  _startDrag(event, node, cfg) {
    if (this._activeDrag) return;

    this._activeDrag = {
      node, cfg,
      startPos: { x: event.clientX, y: event.clientY },
      currentPos: { x: event.clientX, y: event.clientY },
      startRect: node.getBoundingClientRect(),
      active: false,
      data: cfg.data,
    };

    this._addDocListeners();
  }

  _onDragMove(event) {
    const d = this._activeDrag;
    d.currentPos = { x: event.clientX, y: event.clientY };
    const dx = d.currentPos.x - d.startPos.x;
    const dy = d.currentPos.y - d.startPos.y;

    if (!d.active) {
      if (Math.sqrt(dx * dx + dy * dy) < d.cfg.threshold) return;
      d.active = true;
      document.body.classList.add('dnd-dragging');
      if (d.cfg.ghost) this._createGhost(d.node, d.cfg);
      d.cfg.onDragStart?.(d.node, event, d.data);
    }

    let moveX = dx;
    let moveY = dy;
    if (d.cfg.axis === 'x') moveY = 0;
    if (d.cfg.axis === 'y') moveX = 0;

    if (this._ghost) {
      this._ghost.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }

    d.cfg.onDrag?.(d.node, event, d.data, { dx: moveX, dy: moveY });
    this._updateDroppableHover(event);
  }

  _endDrag(event) {
    const d = this._activeDrag;
    if (!d) return;

    document.body.classList.remove('dnd-dragging');
    this._removeDocListeners();
    this._removeGhost();

    if (d.active) {
      if (d.cfg.freePosition) {
        const dx = d.currentPos.x - d.startPos.x;
        const dy = d.currentPos.y - d.startPos.y;
        if (dx !== 0 || dy !== 0) {
          const cs = window.getComputedStyle(d.node);
          if (cs.position === 'static') d.node.style.position = 'fixed';
          d.node.style.left = (d.startRect.left + dx) + 'px';
          d.node.style.top = (d.startRect.top + dy) + 'px';
          d.node.style.width = d.startRect.width + 'px';
          d.node.style.height = d.startRect.height + 'px';
        }
      }

      d.cfg.onDragEnd?.(d.node, event, d.data);

      if (this._activeDrop) {
        this._activeDrop.cfg.onDrop?.(this._activeDrop.node, event, d.data);
        this._activeDrop = null;
      }
    }

    this._activeDrag = null;
  }

  _updateDroppableHover(event) {
    const x = event.clientX;
    const y = event.clientY;
    let hit = null;

    for (const [node, cfg] of this._droppables) {
      if (!node.isConnected) continue;
      const rect = node.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        if (!cfg.accept || cfg.accept(this._activeDrag?.data)) {
          hit = { node, cfg };
          break;
        }
      }
    }

    if (this._activeDrop && this._activeDrop !== hit) {
      this._activeDrop.cfg.onDragLeave?.(this._activeDrop.node, event, this._activeDrag?.data);
    }

    if (hit && this._activeDrop !== hit) {
      hit.cfg.onDragEnter?.(hit.node, event, this._activeDrag?.data);
    }

    this._activeDrop = hit;
    hit?.cfg.onDragOver?.(hit.node, event, this._activeDrag?.data);
  }

  // ─── Internal: Ghost ─────────────────────────────────────────

  _createGhost(node, cfg) {
    this._removeGhost();
    const ghost = node.cloneNode(true);
    ghost.className = `dnd-ghost${cfg.ghostClass ? ' ' + cfg.ghostClass : ''}`;
    const rect = node.getBoundingClientRect();
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.left = rect.left + 'px';
    document.body.appendChild(ghost);
    this._ghost = ghost;
  }

  _removeGhost() {
    if (this._ghost && this._ghost.parentNode) {
      this._ghost.parentNode.removeChild(this._ghost);
    }
    this._ghost = null;
  }

  // ─── Sortable ────────────────────────────────────────────────

  makeSortable(container, config = {}) {
    const cfg = {
      items: config.items || ':scope > *',
      axis: config.axis || 'y',
      ghostClass: config.ghostClass || '',
      onReorder: config.onReorder || null,
      accept: config.accept || null,
    };

    this._sortables.set(container, cfg);
    this._initSortableItems(container, cfg);
    return this;
  }

  // ─── Internal: Sortable ──────────────────────────────────────

  _initSortableItems(container, cfg) {
    const items = container.querySelectorAll(cfg.items);
    items.forEach(item => {
      item.addEventListener('pointerdown', (e) => this._onSortablePointerDown(e, item, container, cfg));
    });
  }

  _onSortablePointerDown(event, item, container, cfg) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const allItems = [...container.children].filter(c =>
      c !== item && c.style.display !== 'none'
    );

    const fromIndex = [...container.children].indexOf(item);
    const rect = item.getBoundingClientRect();

    const placeholder = document.createElement('div');
    placeholder.className = 'dnd-sortable-ph' + (cfg.ghostClass ? ' ' + cfg.ghostClass : '');
    placeholder.style.cssText = `height:${rect.height}px;margin:0;background:rgba(59,130,246,.08);border:2px dashed #3b82f6;border-radius:6px;box-sizing:border-box`;
    container.insertBefore(placeholder, item);

    const ghost = document.createElement('div');
    const ghostStyle = {
      position: 'fixed', pointerEvents: 'none', zIndex: '999999',
      opacity: '.85', width: rect.width + 'px', height: rect.height + 'px',
      top: rect.top + 'px', left: rect.left + 'px',
      background: '#fff', border: '1px solid #d1d5db',
      borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', fontSize: '14px',
      willChange: 'transform',
    };
    Object.assign(ghost.style, ghostStyle);
    ghost.textContent = item.textContent || '';
    document.body.appendChild(ghost);

    item.style.display = 'none';

    this._activeSortable = {
      container, cfg, item, placeholder, ghost,
      fromIndex, allItems,
      startPos: { x: event.clientX, y: event.clientY },
      lastInsertIndex: fromIndex,
    };

    this._addDocListeners();
  }

  _onSortableMove(event) {
    const s = this._activeSortable;
    const dx = event.clientX - s.startPos.x;
    const dy = event.clientY - s.startPos.y;

    s.ghost.style.transform = `translate(${dx}px, ${dy}px)`;

    const pos = s.cfg.axis === 'x' ? event.clientX : event.clientY;
    const items = [...s.container.children].filter(c =>
      c !== s.item && c !== s.placeholder && c.style.display !== 'none'
    );

    let insertIndex = items.length;
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      const mid = s.cfg.axis === 'x'
        ? r.left + r.width / 2
        : r.top + r.height / 2;
      if (pos < mid) { insertIndex = i; break; }
    }

    if (insertIndex !== s.lastInsertIndex) {
      const beforeNode = items[insertIndex] || null;
      s.container.insertBefore(s.placeholder, beforeNode);
      s.lastInsertIndex = insertIndex;
    }
  }

  _endSortable(event) {
    const s = this._activeSortable;
    if (!s) return;

    this._removeDocListeners();

    if (s.ghost && s.ghost.parentNode) s.ghost.parentNode.removeChild(s.ghost);
    if (s.placeholder && s.placeholder.parentNode) s.placeholder.parentNode.removeChild(s.placeholder);

    s.item.style.display = '';

    const allChildren = [...s.container.children];
    const currentIdx = allChildren.indexOf(s.item);

    if (currentIdx !== s.fromIndex) {
      s.cfg.onReorder?.({
        fromIndex: s.fromIndex,
        toIndex: currentIdx,
        item: s.item,
        container: s.container,
      });
    }

    this._activeSortable = null;
  }

  // ─── Internal: Resize ────────────────────────────────────────

  _onHandlePointerDown(event, node, cfg, edges) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this._startResize(event, node, cfg, edges);
  }

  _startResize(event, node, cfg, edges) {
    if (this._activeResize) return;
    event.preventDefault();

    const rect = node.getBoundingClientRect();

    this._activeResize = {
      node, cfg, edges,
      startPos: { x: event.clientX, y: event.clientY },
      startRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    };

    cfg.onResizeStart?.(node, event, { ...rect });
    this._addDocListeners();
  }

  _onResizeMove(event) {
    const r = this._activeResize;
    const delta = {
      x: event.clientX - r.startPos.x,
      y: event.clientY - r.startPos.y,
    };

    const newRect = computeResizeRect(
      r.startRect, delta, r.edges,
      r.cfg.minWidth, r.cfg.minHeight,
      r.cfg.maxWidth, r.cfg.maxHeight
    );

    r.node.style.width = newRect.width + 'px';
    r.node.style.height = newRect.height + 'px';
    if (r.edges.includes('w')) r.node.style.left = newRect.left + 'px';
    if (r.edges.includes('n')) r.node.style.top = newRect.top + 'px';

    r.cfg.onResize?.(r.node, event, newRect);
  }

  _endResize(event) {
    const r = this._activeResize;
    if (!r) return;

    this._removeDocListeners();
    document.body.classList.remove('dnd-dragging');

    const rect = r.node.getBoundingClientRect();
    r.cfg.onResizeEnd?.(r.node, event, {
      top: rect.top, left: rect.left,
      width: rect.width, height: rect.height,
    });

    this._activeResize = null;
  }
}

if (typeof window !== 'undefined') {
  window.DragDropService = DragDropService;
}
