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
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-6 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-center">Lista Inteligente</h1>

        {/* CARDS GRANDES */}
        <div className="grid gap-6 mt-4">

          {/* CARD MERCADO */}
          <div
            onClick={() => { setType('mercado'); setView('list') }}
            className="w-full h-40 bg-blue-500 text-white rounded-3xl shadow-xl flex items-center justify-between px-6 cursor-pointer active:scale-95 transition"
          >
            <div>
              <h2 className="text-2xl font-bold">Supermercado</h2>
              <p className="text-sm opacity-80">Lista completa de compras</p>
            </div>
            <span className="text-5xl">🛒</span>
          </div>

          {/* CARD FRUTEIRA */}
          <div
            onClick={() => { setType('fruteira'); setView('list') }}
            className="w-full h-40 bg-green-500 text-white rounded-3xl shadow-xl flex items-center justify-between px-6 cursor-pointer active:scale-95 transition"
          >
            <div>
              <h2 className="text-2xl font-bold">Fruteira</h2>
              <p className="text-sm opacity-80">Frutas e verduras</p>
            </div>
            <span className="text-5xl">🍎</span>
          </div>

        </div>
      </div>
    )
  }

  return <Lista tipo={type} voltar={() => setView('home')} />
}

function Lista({ tipo, voltar }) {
  const [items, setItems] = useState([])
  const [nome, setNome] = useState('')
  const [qtd, setQtd] = useState(1)
  const [total, setTotal] = useState(0)

  // 🔄 LISTA EM TEMPO REAL
  useEffect(() => {
    const unsub = onSnapshot(collection(db, tipo), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => unsub()
  }, [tipo])

  // 💰 TOTAL MENSAL
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "gastos"), (snapshot) => {
      let soma = 0

      snapshot.docs.forEach(doc => {
        const d = doc.data()
        if (d.tipo === tipo) {
          soma += d.valor
        }
      })

      setTotal(soma)
    })

    return () => unsub()
  }, [tipo])

  const addItem = async () => {
    if (!nome) return

    await addDoc(collection(db, tipo), {
      name: nome,
      quantidade: qtd,
      comprado: false
    })

    setNome('')
    setQtd(1)
  }

  const marcarComprado = async (item) => {
    await updateDoc(doc(db, tipo, item.id), {
      comprado: !item.comprado
    })
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch('/api/receipt', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()

    processarCompra(data)
  }

  const processarCompra = async (data) => {
    items.forEach(async (item) => {
      const match = data.items.some(p =>
        item.name.toLowerCase().includes(p)
      )

      if (match) {
        await updateDoc(doc(db, tipo, item.id), {
          comprado: true
        })
      }
    })

    await addDoc(collection(db, "gastos"), {
      tipo,
      valor: data.total,
      data: new Date()
    })
  }

  return (
    <div className="p-6 min-h-screen bg-gray-100 flex flex-col gap-6">

      <button onClick={voltar} className="text-sm">⬅ Voltar</button>

      <h2 className="text-2xl font-bold capitalize">{tipo}</h2>

      {/* ADICIONAR ITEM */}
      <div className="bg-white p-4 rounded-xl shadow flex gap-2">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="Produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          type="number"
          className="border p-2 w-20 rounded text-center"
          value={qtd}
          onChange={(e) => setQtd(e.target.value)}
        />

        <button className="bg-blue-500 text-white px-4 rounded" onClick={addItem}>
          +
        </button>
      </div>

      {/* LISTA */}
      <div className="bg-white p-4 rounded-xl shadow">
        {items.map(item => (
          <div key={item.id} className="flex justify-between border-b py-2">
            <span
              onClick={() => marcarComprado(item)}
              className={`cursor-pointer ${item.comprado ? 'line-through text-gray-400' : ''}`}
            >
              {item.name}
            </span>
            <span>{item.quantidade}</span>
          </div>
        ))}
      </div>

      {/* CUPOM */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-2">📸 Upload de Cupom</h3>
        <input type="file" onChange={handleUpload} />
      </div>

      {/* TOTAL */}
      <div className="bg-green-100 p-4 rounded-xl shadow">
        <strong>Total do mês: R$ {total}</strong>
      </div>

    </div>
  )
}
