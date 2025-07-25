// @ts-expect-error fix later todo
import React from 'react';
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

const App = () => <Router>
    <Routes>
        <Route path="/" element={<BasePage />} />
        <Route path="/attraction" element={<Attraction />} />
        <Route path="/bubble-particle" element={<BubbleParticle />} />
        <Route path="/highlighted-box" element={<HighlightedBox />} />
        <Route path="/meteor-particle" element={<MeteorParticle />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
</Router>;

export default App;