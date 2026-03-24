'use client'

import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore'

// 🔥 SUA CONFIG (já coloquei pronta)
const firebaseConfig = {
  apiKey: "AIzaSyDEGmc5x6265BFqF_g27zfK37DYuXaohyQ",
  authDomain: "lista-mercado-ef3f5.firebaseapp.com",
  projectId: "lista-mercado-ef3f5",
}

// iniciar firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export default function Home() {
  const [list, setList] = useState([])
  const [input, setInput] = useState('')

  // 🔄 tempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "items"), (snapshot) => {
      setList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => unsub()
  }, [])

  const addItem = async () => {
    if (!input) return

    await addDoc(collection(db, "items"), {
      name: input,
      createdAt: new Date()
    })

    setInput('')
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Lista Compartilhada 🛒</h1>

      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addItem}>Adicionar</button>

      <ul>
        {list.map((item) => (
          <li key={item.id}>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
