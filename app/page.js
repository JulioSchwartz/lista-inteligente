'use client'

import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from 'firebase/firestore'

// FIREBASE
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

        <div style={{ ...styles.card, background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}
          onClick={() => { setType('mercado'); setView('list') }}>
          <h2>Supermercado</h2>
        </div>

        <div style={{ ...styles.card, background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}
          onClick={() => { setType('fruteira'); setView('list') }}>
          <h2>Fruteira</h2>
        </div>
      </div>
    )
  }

  return <Lista tipo={type} voltar={() => setView('home')} />
}

function Lista({ tipo, voltar }) {
  const [items, setItems] = useState([])
  const [input, setInput] = useState('')
  const [total, setTotal] = useState(0)

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

  // 🔥 IA CUPOM
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

    // 🧠 remover itens da lista
    const produtos = data.items.map(i => i.toLowerCase())

    items.forEach(async (item) => {
      const nome = item.name.toLowerCase()

      if (produtos.some(p => nome.includes(p))) {
        await updateDoc(doc(db, tipo, item.id), {
          checked: true
        })
      }
    })

    // 💰 soma total
    setTotal(prev => prev + (data.total || 0))
  }

  return (
    <div style={styles.container}>
      <button onClick={voltar}>⬅ Voltar</button>

      <h2>{tipo}</h2>

      {/* INPUT */}
      <div style={styles.inputBox}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Adicionar item"
          style={styles.input}
        />
        <button onClick={addItem}>+</button>
      </div>

      {/* LISTA */}
      {items.map(item => (
        <div key={item.id} onClick={() => toggleItem(item)} style={styles.item}>
          <span style={{
            textDecoration: item.checked ? 'line-through' : 'none'
          }}>
            {item.name}
          </span>
          <span>{item.checked ? '✔' : ''}</span>
        </div>
      ))}

      {/* 📸 UPLOAD CUPOM */}
      <div style={styles.upload}>
        <p>📸 Enviar cupom fiscal</p>
        <input type="file" onChange={handleUpload} />
      </div>

      {/* 💰 TOTAL */}
      <div style={styles.total}>
        Total gasto: R$ {total}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  card: {
    padding: 30,
    borderRadius: 20,
    color: '#fff',
    marginBottom: 20,
    cursor: 'pointer'
  },
  inputBox: {
    display: 'flex',
    gap: 10,
    marginBottom: 20
  },
  input: {
    flex: 1,
    padding: 10
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 10,
    background: '#eee',
    marginBottom: 10,
    borderRadius: 10
  },
  upload: {
    marginTop: 20,
    padding: 15,
    background: '#ddd',
    borderRadius: 10
  },
  total: {
    marginTop: 20,
    fontWeight: 'bold'
  }
}
