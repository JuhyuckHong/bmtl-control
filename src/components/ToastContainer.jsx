import React from 'react'
import { useToast } from '../contexts/ToastContext'

export const ToastContainer = () => {
  const { toasts, hideToast } = useToast()
  return (
    <div className='toast-container'>
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role='status' aria-live='polite'>
          <span className='toast-message'>{t.message}</span>
          <button className='toast-close' onClick={() => hideToast(t.id)} aria-label='close'>×</button>
        </div>
      ))}
    </div>
  )
}

