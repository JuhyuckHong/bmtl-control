import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext({
  toasts: [],
  showToast: () => {},
  hideToast: () => {},
  clearAll: () => {},
})

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback((message, options = {}) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
    const toast = {
      id,
      message,
      type: options.type || 'info', // 'info' | 'success' | 'warning' | 'error'
      duration: Number.isFinite(options.duration) ? options.duration : 3000,
    }
    setToasts((prev) => [...prev, toast])
    if (toast.duration > 0) {
      const timer = setTimeout(() => hideToast(id), toast.duration)
      timersRef.current.set(id, timer)
    }
    return id
  }, [hideToast])

  const clearAll = useCallback(() => {
    setToasts([])
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  const value = useMemo(() => ({ toasts, showToast, hideToast, clearAll }), [toasts, showToast, hideToast, clearAll])

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

