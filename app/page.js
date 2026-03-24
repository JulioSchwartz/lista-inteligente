'use client'

import { useState } from 'react'

export default function App() {
  const [view, setView] = useState('home')
  const [type, setType] = useState('')

  if (view === 'home') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Lista Inteligente</h1>

        <div
          style={{ ...styles.card, background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}
          onClick={() => { setType('mercado'); setView('list') }}
        >
          <div>
            <h2 style={styles.cardTitle}>Supermercado</h2>
            <p style={styles.cardText}>Lista completa de compras</p>
          </div>

          <div style={styles.icon}>🛒</div>

          <div style={styles.button}>→</div>
        </div>

        <div
          style={{ ...styles.card, background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}
          onClick={() => { setType('fruteira'); setView('list') }}
        >
          <div>
            <h2 style={styles.cardTitle}>Fruteira</h2>
            <p style={styles.cardText}>Frutas e verduras</p>
          </div>

          <div style={styles.icon}>🍎</div>

          <div style={styles.button}>→</div>
        </div>
      </div>
    )
  }

  return <Lista tipo={type} voltar={() => setView('home')} />
}

function Lista({ tipo, voltar }) {
  return (
    <div style={styles.container}>
      <button onClick={voltar} style={styles.back}>⬅ Voltar</button>
      <h2 style={styles.title}>{tipo}</h2>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f2f2f2',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold'
  },

  card: {
    position: 'relative',
    borderRadius: 20,
    padding: 20,
    color: '#fff',
    height: 140,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(0,0,0,0.15)'
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },

  cardText: {
    fontSize: 14,
    opacity: 0.9
  },

  icon: {
    fontSize: 40
  },

  button: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    width: 35,
    height: 35,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18
  },

  back: {
    marginBottom: 10
  }
}
