import React from 'react'
import PropTypes from 'prop-types'

/**
 * 로딩 스피너 컴포넌트
 * 다양한 크기와 스타일의 로딩 인디케이터를 제공합니다.
 */
const LoadingSpinner = ({
  size = 'medium',
  variant = 'default',
  message = null,
  overlay = false,
  className = '',
}) => {
  const sizeClasses = {
    small: 'loading-spinner--small',
    medium: 'loading-spinner--medium',
    large: 'loading-spinner--large',
  }

  const variantClasses = {
    default: 'loading-spinner--default',
    primary: 'loading-spinner--primary',
    secondary: 'loading-spinner--secondary',
  }

  const spinnerClasses = [
    'loading-spinner',
    sizeClasses[size],
    variantClasses[variant],
    overlay && 'loading-spinner--overlay',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <div className={spinnerClasses}>
      <div className='loading-spinner__circle'>
        <div className='loading-spinner__bounce loading-spinner__bounce--1'></div>
        <div className='loading-spinner__bounce loading-spinner__bounce--2'></div>
        <div className='loading-spinner__bounce loading-spinner__bounce--3'></div>
      </div>
      {message && <div className='loading-spinner__message'>{message}</div>}
    </div>
  )

  if (overlay) {
    return <div className='loading-overlay'>{content}</div>
  }

  return content
}

LoadingSpinner.propTypes = {
  /** 스피너 크기 */
  size: PropTypes.oneOf(['small', 'medium', 'large']),

  /** 스피너 색상 변형 */
  variant: PropTypes.oneOf(['default', 'primary', 'secondary']),

  /** 로딩 메시지 */
  message: PropTypes.string,

  /** 오버레이 모드 (전체 화면 또는 컨테이너 덮기) */
  overlay: PropTypes.bool,

  /** 추가 CSS 클래스 */
  className: PropTypes.string,
}

export default React.memo(LoadingSpinner)
