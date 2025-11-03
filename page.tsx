'use client'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function TestPage() {
  const [message, setMessage] = useState('')

  async function handleInsert() {
    setMessage('Working...')
    const { error } = await supabase
      .from('live_sessions')
      .insert([{ title: 'Test from Replit', is_live: true }])

    if (error) setMessage('❌ Error: ' + error.message)
    else setMessage('✅ Row added successfully!')
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Supabase Connection Test</h2>
      <button onClick={handleInsert}>Add Row to live_sessions</button>
      <p>{message}</p>
    </div>
  )
}
