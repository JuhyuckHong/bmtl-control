import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useLoadingState } from '../useLoadingState'

describe('useLoadingState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLoadingState())

    expect(result.current.loadingStates).toEqual({})
    expect(result.current.globalLoading).toBe(false)
    expect(result.current.isAnyLoading).toBe(false)
    expect(result.current.hasErrors).toBe(false)
    expect(result.current.loadingCount).toBe(0)
  })

  it('should start loading state', () => {
    const { result } = renderHook(() => useLoadingState())

    act(() => {
      result.current.startLoading('test-key', 'Loading test...')
    })

    expect(result.current.loadingStates['test-key']).toEqual({
      loading: true,
      message: 'Loading test...',
      startTime: expect.any(Number),
      error: null,
    })
    expect(result.current.isAnyLoading).toBe(true)
    expect(result.current.loadingCount).toBe(1)
  })

  it('should stop loading state', () => {
    const { result } = renderHook(() => useLoadingState())

    act(() => {
      result.current.startLoading('test-key')
    })

    act(() => {
      result.current.stopLoading('test-key', { data: 'success' })
    })

    expect(result.current.loadingStates['test-key'].loading).toBe(false)
    expect(result.current.loadingStates['test-key'].result).toEqual({
      data: 'success',
    })
    expect(result.current.loadingStates['test-key'].duration).toBeGreaterThan(0)
    expect(result.current.isAnyLoading).toBe(false)
  })

  it('should handle error loading state', () => {
    const { result } = renderHook(() => useLoadingState())
    const testError = new Error('Test error')

    act(() => {
      result.current.startLoading('test-key')
    })

    act(() => {
      result.current.errorLoading('test-key', testError)
    })

    expect(result.current.loadingStates['test-key'].loading).toBe(false)
    expect(result.current.loadingStates['test-key'].error).toBe(testError)
    expect(result.current.hasErrors).toBe(true)
  })

  it('should clear specific loading state', () => {
    const { result } = renderHook(() => useLoadingState())

    act(() => {
      result.current.startLoading('test-key')
    })

    act(() => {
      result.current.clearLoading('test-key')
    })

    expect(result.current.loadingStates['test-key']).toBeUndefined()
  })

  it('should clear all loading states', () => {
    const { result } = renderHook(() => useLoadingState())

    act(() => {
      result.current.startLoading('key1')
      result.current.startLoading('key2')
    })

    act(() => {
      result.current.clearAllLoading()
    })

    expect(result.current.loadingStates).toEqual({})
    expect(result.current.globalLoading).toBe(false)
  })

  it('should handle withLoading wrapper for promises', async () => {
    const { result } = renderHook(() => useLoadingState())
    const mockPromise = Promise.resolve('success')

    let promiseResult
    await act(async () => {
      promiseResult = await result.current.withLoading(
        'test-key',
        mockPromise,
        'Loading...'
      )
    })

    expect(promiseResult).toBe('success')
    expect(result.current.loadingStates['test-key'].loading).toBe(false)
    expect(result.current.loadingStates['test-key'].result).toBe('success')
  })

  it('should handle withLoading wrapper for rejected promises', async () => {
    const { result } = renderHook(() => useLoadingState())
    const testError = new Error('Promise error')
    const mockPromise = Promise.reject(testError)

    try {
      await act(async () => {
        await result.current.withLoading('test-key', mockPromise)
      })
    } catch (error) {
      expect(error).toBe(testError)
    }

    expect(result.current.loadingStates['test-key'].loading).toBe(false)
    expect(result.current.loadingStates['test-key'].error).toBe(testError)
  })

  it('should check if specific keys are loading', () => {
    const { result } = renderHook(() => useLoadingState())

    act(() => {
      result.current.startLoading('key1')
    })

    expect(result.current.isLoading('key1')).toBe(true)
    expect(result.current.isLoading('key2')).toBe(false)
    expect(result.current.isLoading(['key1', 'key2'])).toBe(true)
    expect(result.current.isLoading(['key2', 'key3'])).toBe(false)
  })

  it('should handle timeout', async () => {
    vi.useFakeTimers()

    const onTimeout = vi.fn()
    const { result } = renderHook(() =>
      useLoadingState({
        timeout: 1000,
        onTimeout,
      })
    )

    act(() => {
      result.current.startLoading('test-key')
    })

    act(() => {
      vi.advanceTimersByTime(1001)
    })

    expect(onTimeout).toHaveBeenCalledWith('test-key', expect.any(Error))
    expect(result.current.loadingStates['test-key'].loading).toBe(false)
    expect(result.current.loadingStates['test-key'].error).toBeInstanceOf(Error)

    vi.useRealTimers()
  })
})
