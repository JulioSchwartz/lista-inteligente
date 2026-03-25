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

      // 🔥 FILTRA POR TIPO (AQUI ESTÁ A CORREÇÃO)
      if (d.tipo === tipo) {
        total += Number(d.valor) || 0
        lista.push(d)
      }
    })

    setTotalMes(total)
    setHistorico(lista)
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

  const deleteItem = async (item) => {
    await deleteDoc(doc(db, tipo, item.id))
  }

  // 🔥 NOVO - compressão + proteção
  const handleUpload = async (e) => {
    console.log("🔥 UPLOAD CLICADO")
    
    const file = e.target.files[0]
    if (!file) return

    console.log("🔥 ENVIANDO PRA API")

    const resized = await resizeImage(file)

    const formData = new FormData()
    formData.append("file", resized)

    try {
      const res = await fetch('/api/receipt', {
  method: 'POST',
  body: formData
})

const data = await res.json()

console.log("RESPOSTA DA API 👉", data)

      if (!data.items) {
        alert("Erro ao ler cupom")
        return
      }

     const normalize = (txt) =>
  txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acento

const produtos = data.items.map(normalize)

      for (const item of items) {
        const nome = item.name.toLowerCase()

        if (produtos.some(p => nome.includes(p) || p.includes(nome))) {
          await updateDoc(doc(db, tipo, item.id), {
            checked: true
          })
        }
      }

      await addDoc(collection(db, "gastos"), {
        valor: data.total || 0,
        tipo,
        data: new Date().toISOString()
      })

    } catch (err) {
      console.error(err)
      alert("Erro ao processar cupom")
    }
  }

  // 🔥 NOVO - reduzir imagem
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      const reader = new FileReader()

      reader.onload = (e) => {
        img.src = e.target.result
      }

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800

        const scale = MAX_WIDTH / img.width

        canvas.width = MAX_WIDTH
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', 0.7)
      }

      reader.readAsDataURL(file)
    })
  }

  return (
    <div style={styles.container}>
      <button onClick={voltar} style={styles.backBtn}>⬅ Voltar</button>

      <h2 style={styles.title}>{tipo}</h2>

      <div style={styles.inputBox}>
        <input value={input} onChange={(e) => setInput(e.target.value)} style={styles.input} />
        <button onClick={addItem} style={styles.addBtn}>+</button>
      </div>

      <div style={styles.listContainer}>
        {items.map(item => (
          <div key={item.id} style={styles.swipeContainer}>
            <div style={styles.deleteBtn} onClick={() => deleteItem(item)}>Excluir</div>

            <div
              onClick={() => toggleItem(item)}
              style={{
                ...styles.itemCard,
                background: item.checked ? styles.gradientDone : styles.gradientCard,
                transform: item.checked ? 'scale(0.97)' : 'scale(1)'
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
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },

  card: {
    padding: 30,
    borderRadius: 25,
    cursor: 'pointer',
    marginBottom: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  },

  gradientBlue: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  gradientGreen: 'linear-gradient(135deg, #22c55e, #4ade80)',
  gradientCard: 'linear-gradient(135deg, #1e293b, #334155)',
  gradientDone: 'linear-gradient(135deg, #16a34a, #4ade80)',

  inputBox: { display: 'flex', gap: 10, marginBottom: 20 },
  input: { flex: 1, padding: 12, borderRadius: 12 },
  addBtn: { padding: '0 15px', borderRadius: 12, background: '#6366f1', color: '#fff' },

  listContainer: { display: 'flex', flexDirection: 'column', gap: 12 },

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
    padding: '0 20px',
    borderRadius: 15
  },

  itemCard: {
    padding: 18,
    borderRadius: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  check: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  uploadBox: { marginTop: 25 },

  uploadLabel: {
    padding: 18,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: 20,
    textAlign: 'center',
    cursor: 'pointer'
  },

  totalBox: {
    marginTop: 20,
    padding: 15,
    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    borderRadius: 15
  },

  chartBox: { marginTop: 20 },

  bar: {
    background: '#3b82f6',
    marginTop: 5,
    padding: 8,
    borderRadius: 8
  },

  backBtn: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10
  }
}
