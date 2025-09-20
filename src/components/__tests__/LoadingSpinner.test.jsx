import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />)

    expect(document.querySelector('.loading-spinner')).toBeInTheDocument()
    expect(
      document.querySelector('.loading-spinner--medium')
    ).toBeInTheDocument()
    expect(
      document.querySelector('.loading-spinner--default')
    ).toBeInTheDocument()
  })

  it('should render with custom size', () => {
    render(<LoadingSpinner size='large' />)

    expect(
      document.querySelector('.loading-spinner--large')
    ).toBeInTheDocument()
  })

  it('should render with custom variant', () => {
    render(<LoadingSpinner variant='primary' />)

    expect(
      document.querySelector('.loading-spinner--primary')
    ).toBeInTheDocument()
  })

  it('should render with message', () => {
    render(<LoadingSpinner message='Loading data...' />)

    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('should render as overlay when overlay prop is true', () => {
    render(<LoadingSpinner overlay message='Loading...' />)

    expect(document.querySelector('.loading-overlay')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<LoadingSpinner className='custom-class' />)

    expect(document.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('should render three bounce elements', () => {
    render(<LoadingSpinner />)

    const bounceElements = document.querySelectorAll('.loading-spinner__bounce')
    expect(bounceElements).toHaveLength(3)
  })
})
