'use client'

import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore'

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

        <div style={{ ...styles.card, background: styles.gradientBlue }} onClick={() => { setType('mercado'); setView('list') }}>
          <h2>🛒 Supermercado</h2>
        </div>

        <div style={{ ...styles.card, background: styles.gradientGreen }} onClick={() => { setType('fruteira'); setView('list') }}>
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
  const [historico, setHistorico] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, tipo), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [tipo])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "gastos"), (snapshot) => {
      let total = 0
      let lista = []

      snapshot.docs.forEach(doc => {
        const d = doc.data()
        total += d.valor || 0
        lista.push(d)
      })

      setTotalMes(total)
      setHistorico(lista)
    })

    return () => unsub()
  }, [])

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

  const deleteItem = async (item) => {
    await deleteDoc(doc(db, tipo, item.id))
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

    await addDoc(collection(db, "gastos"), {
      valor: data.total,
      tipo,
      data: new Date().toISOString()
    })
  }

  return (
    <div style={styles.container}>
      <button onClick={voltar}>⬅ Voltar</button>

      <h2 style={styles.title}>{tipo}</h2>

      <div style={styles.inputBox}>
        <input value={input} onChange={(e) => setInput(e.target.value)} style={styles.input} />
        <button onClick={addItem}>+</button>
      </div>

      <div style={styles.listContainer}>
        {items.map(item => (
          <div key={item.id} style={styles.swipeContainer}>
            <div style={styles.deleteBtn} onClick={() => deleteItem(item)}>Excluir</div>

            <div
              onClick={() => toggleItem(item)}
              style={{
                ...styles.itemCard,
                background: item.checked ? styles.gradientDone : styles.gradientCard
              }}
            >
              <p style={{ textDecoration: item.checked ? 'line-through' : 'none' }}>{item.name}</p>
              <div style={styles.check}>{item.checked ? '✓' : ''}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.uploadBox}>
        <label style={styles.uploadLabel}>
          📸 Enviar cupom fiscal
          <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={styles.totalBox}>
        💰 Total do mês: R$ {totalMes.toFixed(2)}
      </div>

      {/* GRÁFICO SIMPLES */}
      <div style={styles.chartBox}>
        <h3>📊 Histórico</h3>
        {historico.map((h, i) => (
          <div key={i} style={styles.bar}>
            R$ {h.valor}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: { padding: 20, background: '#0f172a', minHeight: '100vh', color: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold' },
  card: { padding: 25, borderRadius: 20, cursor: 'pointer' },
  gradientBlue: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  gradientGreen: 'linear-gradient(135deg, #22c55e, #4ade80)',
  gradientCard: 'linear-gradient(135deg, #1e293b, #334155)',
  gradientDone: 'linear-gradient(135deg, #16a34a, #4ade80)',
  inputBox: { display: 'flex', gap: 10 },
  input: { flex: 1, padding: 10, borderRadius: 10 },
  listContainer: { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  swipeContainer: { position: 'relative' },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    background: '#ef4444',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    padding: '0 15px',
    borderRadius: 10
  },
  itemCard: {
    padding: 15,
    borderRadius: 15,
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative'
  },
  check: { width: 25, height: 25, borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  uploadBox: { marginTop: 20 },
  uploadLabel: { padding: 15, background: '#6366f1', borderRadius: 15, textAlign: 'center', cursor: 'pointer' },
  totalBox: { marginTop: 20, padding: 15, background: '#f59e0b', borderRadius: 15 },
  chartBox: { marginTop: 20 },
  bar: { background: '#3b82f6', marginTop: 5, padding: 5, borderRadius: 5 }
}
