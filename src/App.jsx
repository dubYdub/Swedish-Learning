import { useState } from 'react'
import Flashcards from './components/Flashcards'
import Grammar from './components/Grammar'
import Reading from './components/Reading'
import Stats from './components/Stats'
import './App.css'

const TABS = ['Flashcards', 'Grammar', 'Reading', 'Stats']

export default function App() {
  const [tab, setTab] = useState('Flashcards')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Swedish Study</h1>
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {tab === 'Flashcards' && <Flashcards />}
        {tab === 'Grammar' && <Grammar />}
        {tab === 'Reading' && <Reading />}
        {tab === 'Stats' && <Stats />}
      </main>
    </div>
  )
}
