import React from 'react'
import { createRoot } from 'react-dom/client'
// Importar keep-alive para mantener Render activo en segundo plano
import './lib/keep-alive.js'

function App() {
  return <div><h1>Hello CASIRA</h1></div>
}

createRoot(document.getElementById('root')).render(<App />)
