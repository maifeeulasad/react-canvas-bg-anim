// @ts-expect-error fix later todo
import React, { ReactNode } from 'react';
import Attraction from './components/Attraction';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import BubbleParticle from './components/BubbleParticle';
import HighlightedBox from './components/HighlightedBox';
import MeteorParticle from './components/MeteorParticle';

import './App.css'

function BasePage() {
    return (
        <div>
            <h1>Component Demos</h1>
            <ul>
                <li><Link to="/attraction">Attraction</Link></li>
                <li><Link to="/bubble-particle">Bubble Particle</Link></li>
                <li><Link to="/highlighted-box">Highlighted Box</Link></li>
                <li><Link to="/meteor-particle">Meteor Particle</Link></li>
            </ul>
        </div>
    );
}

const AttractionContent = () => <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
}}>
    <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{
            fontSize: '7rem',
            fontWeight: 'bold',
            margin: '0 0 1rem 0',
            color: '#F0F0F1',
            fontFamily: 'Lobster, cursive',
            textShadow: '0 0 0.5em rgba(0, 0, 0, 1)'
        }}>
            Magnetic particles
        </h1>
        <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            margin: 0,
            color: '#F0F0F1',
            fontFamily: 'Lobster, cursive',
            textShadow: '0 0 0.5em rgba(0, 0, 0, 1)'
        }}>
            React TypeScript
        </h2>
    </div>
</div>

const BubbleParticleContent = () => <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
}}>
    <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{
            fontSize: '7rem',
            fontWeight: 'bold',
            margin: '0 0 1rem 0',
            color: '#F0F0F1',
            fontFamily: 'Lobster, cursive',
            textShadow: '0 0 0.5em rgba(0, 0, 0, 1)'
        }}>
            Interactive Bubbles
        </h1>
        <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            margin: 0,
            color: '#F0F0F1',
            fontFamily: 'Lobster, cursive',
            textShadow: '0 0 0.5em rgba(0, 0, 0, 1)'
        }}>
            React TypeScript
        </h2>
    </div>
</div>

const MeteorParticleContent = () => <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
}}>
    <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{
            fontSize: '7rem',
            fontWeight: 'bold',
            margin: '0 0 1rem 0',
            color: '#F0F0F1',
            fontFamily: 'Lobster, cursive',
            textShadow: '0 0 0.5em rgba(0, 0, 0, 1)'
        }}>
            Meteor Shower
        </h1>
        <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            margin: 0,
            color: '#F0F0F1',
            fontFamily: 'Lobster, cursive',
            textShadow: '0 0 0.5em rgba(0, 0, 0, 1)'
        }}>
            React TypeScript
        </h2>
    </div>
</div>

const App = () => <Router>
    <Routes>
        <Route path="/" element={<BasePage />} />
        <Route path="/attraction" element={<Attraction content={<AttractionContent />} />} />
        <Route path="/bubble-particle" element={<BubbleParticle content={<BubbleParticleContent />} />} />
        <Route path="/highlighted-box" element={<HighlightedBox />} />
        <Route path="/meteor-particle" element={<MeteorParticle content={<MeteorParticleContent />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
</Router>;

export default App;