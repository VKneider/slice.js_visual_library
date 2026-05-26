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
`ElementCarrousel` renders a horizontal slide carousel with prev/next buttons and dot indicators. Each slide accepts any DOM node or HTML string, making it suitable for feature showcases, testimonial rotators, and image galleries.

## API and Behavior
- Accepts `elements` (array of Nodes or strings) as its data source.
- Slides are rendered as full-width panels with smooth CSS transition.
- Dot indicators are clickable for direct navigation.
- Arrow keys supported when the component has focus.
- Resize-aware: repositions slides on window resize.
- If `elements` is empty or not an array, no slides are rendered.

## Basic Usage
```javascript title="Build carrousel"
const carrousel = await slice.build('ElementCarrousel', {
  elements: [
    document.createElement('div'),
    document.createElement('div')
  ]
});

this.appendChild(carrousel);
```

## Prop Scenarios
:::script label="Three text slides" expected="renders carrousel with three slides and dot indicators"
const carrousel = await slice.build('ElementCarrousel', {
  elements: [
    '<p style="text-align:center;padding:2rem">Slide one</p>',
    '<p style="text-align:center;padding:2rem">Slide two</p>',
    '<p style="text-align:center;padding:2rem">Slide three</p>'
  ]
});

return carrousel;
:::

:::script label="Slide with components" expected="renders cards inside each carrousel slide"
const slide1 = await slice.build('Card', {
  title: 'Feature A',
  text: 'First feature highlight',
  variant: 'outlined'
});

const slide2 = await slice.build('Card', {
  title: 'Feature B',
  text: 'Second feature highlight',
  variant: 'outlined'
});

const slide3 = await slice.build('Card', {
  title: 'Feature C',
  text: 'Third feature highlight',
  variant: 'outlined'
});

const carrousel = await slice.build('ElementCarrousel', {
  elements: [slide1, slide2, slide3]
});

return carrousel;
:::

:::script label="Single element" expected="renders carrousel with one slide and no extra navigation"
const carrousel = await slice.build('ElementCarrousel', {
  elements: ['<p style="text-align:center;padding:2rem">Only slide</p>']
});

return carrousel;
:::

## Best Practices
:::tip
Use `Card` or custom styled nodes as slides to maintain consistent layout across a carrousel.
:::

## Pitfalls
:::warning
Slides must be uniform in height for smooth transitions. Avoid mixing very tall and very short content in the same carrousel.
:::
