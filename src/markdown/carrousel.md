---
title: ElementCarrousel
route: /docs/layout/element-carrousel
navLabel: Carrousel
section: Layout
group: Containers
order: 25
description: ElementCarrousel documentation with slide navigation and indicator scenarios.
component: ElementCarrouselDocumentation
generate: true
tags: [carrousel, carousel, layout, navigation]
---

# ElementCarrousel

## Overview
`ElementCarrousel` renders a horizontal slide carousel with prev/next buttons and dot indicators. Each slide accepts any DOM node or HTML string.

## API and Behavior
- Accepts `elements` (array of Nodes or strings) as its data source.
- Slides are rendered as full-width panels with smooth CSS transition.
- Dot indicators are clickable for direct navigation.
- Arrow keys supported when the component has focus.
- Resize-aware: repositions slides on window resize.
- If `elements` is empty or not an array, no slides are rendered.

## Prop Scenarios

:::script label="Feature cards showcase" expected="three feature cards in a carrousel with navigation"
const slide1 = await slice.build('Card', {
  title: 'Real-time Sync', text: 'Data stays current across all devices without manual refresh.', badge: 'New', variant: 'elevated', icon: { name: 'cloud-arrow-up', iconStyle: 'filled' }
});

const slide2 = await slice.build('Card', {
  title: 'Analytics Dashboard', text: 'Track metrics and visualize trends with interactive charts.', badge: 'Popular', variant: 'elevated', icon: { name: 'chart-mixed-dollar', iconStyle: 'filled' }
});

const slide3 = await slice.build('Card', {
  title: 'Team Collaboration', text: 'Share workspaces, comment on changes, and manage permissions.', badge: 'Enterprise', variant: 'elevated', icon: { name: 'users-group', iconStyle: 'filled' }
});

const carrousel = await slice.build('ElementCarrousel', {
  elements: [slide1, slide2, slide3]
});

const wrapper = document.createElement('div');
wrapper.style.cssText = 'width:100%;';
wrapper.appendChild(carrousel);
return wrapper;
:::

:::script label="Cards with action buttons" expected="each slide has a card and a call-to-action button"
const slides = await Promise.all([
  (async () => {
    const card = await slice.build('Card', { title: 'Deploy v2.1', text: 'New routing engine and caching layer.', badge: 'Ready', variant: 'outlined', icon: { name: 'rocket', iconStyle: 'filled' } });
    const btn = await slice.build('Button', { value: 'Deploy now', customColor: { button: '#16a34a', label: '#ffffff' }, icon: { name: 'play', iconStyle: 'filled' } });
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
    col.appendChild(card); col.appendChild(btn);
    return col;
  })(),
  (async () => {
    const card = await slice.build('Card', { title: 'Review PR #412', text: 'Branch: feat/parser-cache. 3 approvals needed.', badge: 'Pending', variant: 'outlined', icon: { name: 'code-pull-request', iconStyle: 'filled' } });
    const btn = await slice.build('Button', { value: 'Open review', customColor: { button: '#2563eb', label: '#ffffff' }, icon: { name: 'eye', iconStyle: 'filled' } });
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
    col.appendChild(card); col.appendChild(btn);
    return col;
  })(),
  (async () => {
    const card = await slice.build('Card', { title: 'Run tests', text: 'Suite: integration. 142 tests, 2 flaky.', badge: 'Warning', variant: 'outlined', icon: { name: 'bug', iconStyle: 'filled' } });
    const btn = await slice.build('Button', { value: 'Re-run', customColor: { button: '#dc2626', label: '#ffffff' }, icon: { name: 'refresh', iconStyle: 'outlined' } });
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
    col.appendChild(card); col.appendChild(btn);
    return col;
  })()
]);

const carrousel = await slice.build('ElementCarrousel', { elements: slides });

const wrapper = document.createElement('div');
wrapper.style.cssText = 'width:100%;';
wrapper.appendChild(carrousel);
return wrapper;
:::

:::script label="Custom color cards" expected="cards with different accent colors in a carrousel"
const slides = await Promise.all([
  slice.build('Card', { title: 'CPU Usage', text: 'Current: 34% — well within threshold.', badge: 'Healthy', variant: 'default', icon: { name: 'computer-speaker', iconStyle: 'filled' }, customColor: { accent: '#0891b2' } }),
  slice.build('Card', { title: 'Memory', text: '6.2GB / 16GB allocated.', badge: 'Warning', variant: 'default', icon: { name: 'database', iconStyle: 'filled' }, customColor: { accent: '#d97706' } }),
  slice.build('Card', { title: 'Disk I/O', text: 'Read: 240MB/s · Write: 180MB/s', badge: 'Healthy', variant: 'default', icon: { name: 'inbox', iconStyle: 'filled' }, customColor: { accent: '#16a34a' } }),
  slice.build('Card', { title: 'Network', text: '1.2 Gbps inbound · 800 Mbps outbound', badge: 'Critical', variant: 'default', icon: { name: 'globe', iconStyle: 'filled' }, customColor: { accent: '#dc2626' } })
]);

const carrousel = await slice.build('ElementCarrousel', { elements: slides });

const wrapper = document.createElement('div');
wrapper.style.cssText = 'width:100%;';
wrapper.appendChild(carrousel);
return wrapper;
:::

:::script label="Button toolbar walkthrough" expected="carrousel showing different button configurations"
const toolbars = await Promise.all([
  (async () => {
    const btns = await Promise.all([
      slice.build('Button', { value: 'Save', icon: { name: 'download', iconStyle: 'filled' }, customColor: { button: '#16a34a', label: '#ffffff' } }),
      slice.build('Button', { value: 'Cancel', customColor: { button: '#e2e8f0', label: '#0f172a' } })
    ]);
    const grid = await slice.build('Grid', { columns: 2, gap: '8px', items: btns });
    const label = document.createElement('div');
    label.textContent = 'Save / Cancel';
    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';
    box.appendChild(label); box.appendChild(grid);
    return box;
  })(),
  (async () => {
    const btns = await Promise.all([
      slice.build('Button', { value: 'Edit', icon: { name: 'pen', iconStyle: 'filled' } }),
      slice.build('Button', { value: 'Share', icon: { name: 'share-nodes', iconStyle: 'filled' }, customColor: { button: '#2563eb', label: '#ffffff' } }),
      slice.build('Button', { value: 'Delete', icon: { name: 'trash-bin', iconStyle: 'filled' }, customColor: { button: '#dc2626', label: '#ffffff' } })
    ]);
    const grid = await slice.build('Grid', { columns: 3, gap: '6px', items: btns });
    const label = document.createElement('div');
    label.textContent = 'Edit / Share / Delete';
    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';
    box.appendChild(label); box.appendChild(grid);
    return box;
  })(),
  (async () => {
    const btns = await Promise.all([
      slice.build('Button', { value: 'Approve', icon: { name: 'badge-check', iconStyle: 'filled' }, customColor: { button: '#16a34a', label: '#ffffff' } }),
      slice.build('Button', { value: 'Reject', icon: { name: 'close-circle', iconStyle: 'filled' }, customColor: { button: '#dc2626', label: '#ffffff' } }),
      slice.build('Button', { value: 'Request changes', icon: { name: 'edit', iconStyle: 'filled' }, customColor: { button: '#f59e0b', label: '#ffffff' } })
    ]);
    const grid = await slice.build('Grid', { columns: 3, gap: '6px', items: btns });
    const label = document.createElement('div');
    label.textContent = 'Approve / Reject / Request changes';
    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';
    box.appendChild(label); box.appendChild(grid);
    return box;
  })()
]);

const carrousel = await slice.build('ElementCarrousel', { elements: toolbars });

const wrapper = document.createElement('div');
wrapper.style.cssText = 'width:100%;';
wrapper.appendChild(carrousel);
return wrapper;
:::

## Best Practices
:::tip
Use `Card` or custom component nodes as slides to maintain consistent layout across a carrousel.
:::

## Pitfalls
:::warning
Slides must be uniform in height for smooth transitions. Avoid mixing very tall and very short content in the same carrousel.
:::
