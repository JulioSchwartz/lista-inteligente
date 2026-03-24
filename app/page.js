'use client'

import { useState } from 'react'

export default function Home() {
  const [list, setList] = useState([])
  const [input, setInput] = useState('')
  const [total, setTotal] = useState(0)

  const addItem = () => {
    if (!input) return
    setList([...list, { name: input, bought: false }])
    setInput('')
  }

  const toggle = (i) => {
    const updated = [...list]
    updated[i].bought = !updated[i].bought
    setList(updated)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Lista Inteligente</h1>

      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addItem}>Adicionar</button>

      <ul>
        {list.map((item, i) => (
          <li key={i} onClick={() => toggle(i)}>
            {item.bought ? '✔️' : '⬜'} {item.name}
          </li>
        ))}
      </ul>

      <h3>Total: R$ {total}</h3>
    </div>
  )
}
