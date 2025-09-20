import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

// 에러를 발생시키는 테스트 컴포넌트
const ThrowError = ({ shouldError }) => {
  if (shouldError) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should catch errors and display error UI', () => {
    // 콘솔 에러 출력 억제
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary userFriendlyMessage='Something went wrong'>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('⚠️ 문제가 발생했습니다')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should call retry function when retry button is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('⚠️ 문제가 발생했습니다')).toBeInTheDocument()

    // 다시 시도 버튼 클릭
    fireEvent.click(screen.getByText('다시 시도'))

    // 컴포넌트를 다시 렌더링 (에러 없이)
    rerender(
      <ErrorBoundary>
        <ThrowError shouldError={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should render custom fallback UI when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const customFallback = () => <div>Custom error UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error UI')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should call onError callback when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should disable retry button after max retries', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary maxRetries={2}>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    const retryButton = screen.getByText(/다시 시도/)

    // 첫 번째 재시도
    fireEvent.click(retryButton)
    expect(retryButton).not.toBeDisabled()

    // 두 번째 재시도
    fireEvent.click(retryButton)
    expect(retryButton).not.toBeDisabled()

    // 세 번째 재시도 (최대 초과)
    fireEvent.click(retryButton)
    expect(retryButton).toBeDisabled()

    consoleSpy.mockRestore()
  })
})
