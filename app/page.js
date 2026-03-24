'use client'

import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from 'firebase/firestore'

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDEGmc5x6265BFqF_g27zfK37DYuXaohyQ",
  authDomain: "lista-mercado-ef3f5.firebaseapp.com",
  projectId: "lista-mercado-ef3f5",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

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
            <p style={styles.cardText}>Lista completa</p>
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
  const [items, setItems] = useState([])
  const [input, setInput] = useState('')

  // 🔄 SINCRONIZAÇÃO EM TEMPO REAL COM FIREBASE
  useEffect(() => {
    const unsub = onSnapshot(collection(db, tipo), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => unsub()
  }, [tipo])

  const addItem = async () => {
    if (!input) return

    await addDoc(collection(db, tipo), {
      name: input,
      checked: false
    })

    setInput('')
  }

  const toggleItem = async (item) => {
    await updateDoc(doc(db, tipo, item.id), {
      checked: !item.checked
    })
  }

  return (
    <div style={styles.container}>
      <button onClick={voltar} style={styles.back}>⬅ Voltar</button>
      <h2 style={styles.title}>{tipo}</h2>

      {/* INPUT */}
      <div style={styles.inputBox}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Adicionar item"
          style={styles.input}
        />
        <button onClick={addItem} style={styles.addButton}>+</button>
      </div>

      {/* LISTA COM FIREBASE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item)}
            style={{
              ...styles.itemCard,
              transform: item.checked ? 'scale(0.98)' : 'scale(1)',
              opacity: item.checked ? 0.6 : 1
            }}
          >
            <div>
              <p style={{
                ...styles.itemText,
                textDecoration: item.checked ? 'line-through' : 'none'
              }}>
                {item.name}
              </p>
            </div>

            <div style={{
              ...styles.check,
              background: item.checked ? '#4caf50' : '#ddd'
            }}>
              {item.checked ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>
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
  },

  inputBox: {
    display: 'flex',
    gap: 10
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: '1px solid #ccc'
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#4facfe',
    color: '#fff',
    fontSize: 20,
    border: 'none'
  },

  itemCard: {
    background: '#fff',
    padding: 15,
    borderRadius: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 8px 15px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  },

  itemText: {
    fontSize: 16,
    fontWeight: '500'
  },

  check: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold'
  }
}
