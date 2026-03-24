'use client'

import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from 'firebase/firestore'

// 🔥 FIREBASE CONFIG
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

        <div style={{ ...styles.card, background: styles.gradientBlue }}
          onClick={() => { setType('mercado'); setView('list') }}>
          <h2>🛒 Supermercado</h2>
        </div>

        <div style={{ ...styles.card, background: styles.gradientGreen }}
          onClick={() => { setType('fruteira'); setView('list') }}>
          <h2>🍎 Fruteira</h2>
        </div>
      </div>
    )
  }

  return <Lista tipo={type} voltar={() => setView('home')} />
}

function Lista({ tipo, voltar }) {
  const [items, setItems] = useState([])
  const [input, setInput] = useState('')
  const [totalMes, setTotalMes] = useState(0)

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

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch('/api/receipt', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()

    const produtos = data.items.map(i => i.toLowerCase())

    for (const item of items) {
      const nome = item.name.toLowerCase()

      if (produtos.some(p => nome.includes(p))) {
        await updateDoc(doc(db, tipo, item.id), {
          checked: true
        })
      }
    }

    setTotalMes(prev => prev + (data.total || 0))
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

      {/* LISTA FLUIDA */}
      <div style={styles.listContainer}>
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => toggleItem(item)}
            style={{
              ...styles.itemCard,
              background: item.checked ? styles.gradientDone : styles.gradientCard
            }}
          >
            <p style={{
              ...styles.itemText,
              textDecoration: item.checked ? 'line-through' : 'none'
            }}>
              {item.name}
            </p>

            <div style={{
              ...styles.check,
              background: item.checked ? '#4caf50' : '#fff'
            }}>
              {item.checked ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD */}
      <div style={styles.uploadBox}>
        <label style={styles.uploadLabel}>
          📸 Enviar cupom fiscal
          <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {/* TOTAL MÊS */}
      <div style={styles.totalBox}>
        💰 Total do mês: R$ {totalMes.toFixed(2)}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0f172a',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },

  card: {
    padding: 30,
    borderRadius: 25,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  },

  gradientBlue: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  gradientGreen: 'linear-gradient(135deg, #22c55e, #4ade80)',
  gradientCard: 'linear-gradient(135deg, #1e293b, #334155)',
  gradientDone: 'linear-gradient(135deg, #16a34a, #4ade80)',

  inputBox: {
    display: 'flex',
    gap: 10
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    border: 'none'
  },

  addButton: {
    width: 45,
    borderRadius: 12,
    background: '#3b82f6',
    color: '#fff',
    border: 'none'
  },

  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },

  itemCard: {
    padding: 15,
    borderRadius: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
    transition: 'all 0.2s'
  },

  itemText: {
    fontSize: 16
  },

  check: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000'
  },

  uploadBox: {
    marginTop: 10
  },

  uploadLabel: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    padding: 15,
    borderRadius: 20,
    textAlign: 'center',
    color: '#fff',
    cursor: 'pointer'
  },

  totalBox: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  back: {
    color: '#fff'
  }
}
