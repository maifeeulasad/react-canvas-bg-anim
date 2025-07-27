# react-canvas-bg-anim
react-canvas-bg-anim based on canvas-bg-anim-js, ref: https://github.com/Hazurl/canvas-bg-anim-js/

## Installation

```bash
npm install react-canvas-bg-anim
```

## Usage Example

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Attraction, BubbleParticle, HighlightedBox, MeteorParticle } from 'react-canvas-bg-anim';

const App = () => (
  <div>
    <h1>React Canvas Background Animations</h1>
    <Attraction content={<div>Attraction Animation</div>} />
    <BubbleParticle content={<div>Bubble Particle Animation</div>} />
    <HighlightedBox contents={[<div>Box 1</div>, <div>Box 2</div>]} />
    <MeteorParticle content={<div>Meteor Particle Animation</div>} />
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));
```

## Demo

Run the project locally to see the components in action.
