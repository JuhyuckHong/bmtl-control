import { useState, useCallback, useRef } from 'react'

/**
 * 로딩 상태 관리를 위한 커스텀 훅
 * 여러 비동기 작업의 로딩 상태를 추적하고 관리합니다.
 *
 * @param {Object} options - 설정 옵션
 * @returns {Object} 로딩 상태와 관리 함수들
 */
export const useLoadingState = (options = {}) => {
  const {
    initialLoading = false,
    timeout = 30000, // 30초 기본 타임아웃
    onTimeout = null,
    onError = null,
  } = options

  const [loadingStates, setLoadingStates] = useState({})
  const [globalLoading, setGlobalLoading] = useState(initialLoading)
  const timeoutRefs = useRef(new Map())

  /**
   * 특정 키의 로딩 상태를 시작합니다
   * @param {string} key - 로딩 상태 키
   * @param {string} message - 로딩 메시지 (선택사항)
   */
  const startLoading = useCallback(
    (key, message = null) => {
      setLoadingStates((prev) => ({
        ...prev,
        [key]: {
          loading: true,
          message,
          startTime: Date.now(),
          error: null,
        },
      }))

      // 타임아웃 설정
      if (timeout && timeout > 0) {
        const timeoutId = setTimeout(() => {
          setLoadingStates((prev) => {
            if (prev[key]?.loading) {
              const timeoutError = new Error(
                `작업이 시간 초과되었습니다 (${timeout}ms)`
              )
              if (onTimeout) {
                onTimeout(key, timeoutError)
              }
              return {
                ...prev,
                [key]: {
                  ...prev[key],
                  loading: false,
                  error: timeoutError,
                },
              }
            }
            return prev
          })
        }, timeout)

        timeoutRefs.current.set(key, timeoutId)
      }
    },
    [timeout, onTimeout]
  )

  /**
   * 특정 키의 로딩 상태를 완료합니다
   * @param {string} key - 로딩 상태 키
   * @param {Object} result - 결과 데이터 (선택사항)
   */
  const stopLoading = useCallback((key, result = null) => {
    // 타임아웃 클리어
    const timeoutId = timeoutRefs.current.get(key)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(key)
    }

    setLoadingStates((prev) => {
      const currentState = prev[key]
      if (!currentState) return prev

      const duration = Date.now() - currentState.startTime

      return {
        ...prev,
        [key]: {
          ...currentState,
          loading: false,
          result,
          duration,
          error: null,
        },
      }
    })
  }, [])

  /**
   * 특정 키의 로딩 상태를 에러로 완료합니다
   * @param {string} key - 로딩 상태 키
   * @param {Error} error - 에러 객체
   */
  const errorLoading = useCallback(
    (key, error) => {
      // 타임아웃 클리어
      const timeoutId = timeoutRefs.current.get(key)
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutRefs.current.delete(key)
      }

      setLoadingStates((prev) => {
        const currentState = prev[key]
        const duration = currentState ? Date.now() - currentState.startTime : 0

        if (onError) {
          onError(key, error)
        }

        return {
          ...prev,
          [key]: {
            ...currentState,
            loading: false,
            error,
            duration,
          },
        }
      })
    },
    [onError]
  )

  /**
   * 특정 키의 로딩 상태를 초기화합니다
   * @param {string} key - 로딩 상태 키
   */
  const clearLoading = useCallback((key) => {
    const timeoutId = timeoutRefs.current.get(key)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(key)
    }

    setLoadingStates((prev) => {
      // eslint-disable-next-line no-unused-vars
      const { [key]: _, ...rest } = prev
      return rest
    })
  }, [])

  /**
   * 모든 로딩 상태를 초기화합니다
   */
  const clearAllLoading = useCallback(() => {
    // 모든 타임아웃 클리어
    timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId))
    timeoutRefs.current.clear()

    setLoadingStates({})
    setGlobalLoading(false)
  }, [])

  /**
   * Promise를 래핑하여 자동으로 로딩 상태를 관리합니다
   * @param {string} key - 로딩 상태 키
   * @param {Promise|Function} promiseOrFunction - Promise 또는 Promise를 반환하는 함수
   * @param {string} message - 로딩 메시지
   * @returns {Promise} 원본 Promise의 결과
   */
  const withLoading = useCallback(
    async (key, promiseOrFunction, message = null) => {
      try {
        startLoading(key, message)

        const promise =
          typeof promiseOrFunction === 'function'
            ? promiseOrFunction()
            : promiseOrFunction

        const result = await promise
        stopLoading(key, result)
        return result
      } catch (error) {
        errorLoading(key, error)
        throw error
      }
    },
    [startLoading, stopLoading, errorLoading]
  )

  /**
   * 특정 키의 로딩 상태를 가져옵니다
   * @param {string} key - 로딩 상태 키
   * @returns {Object} 로딩 상태 객체
   */
  const getLoadingState = useCallback(
    (key) => {
      return (
        loadingStates[key] || {
          loading: false,
          message: null,
          error: null,
          result: null,
          duration: null,
          startTime: null,
        }
      )
    },
    [loadingStates]
  )

  /**
   * 하나 이상의 키가 로딩 중인지 확인합니다
   * @param {string|string[]} keys - 확인할 키(들)
   * @returns {boolean} 로딩 중 여부
   */
  const isLoading = useCallback(
    (keys) => {
      if (globalLoading) return true

      if (!keys) {
        return Object.values(loadingStates).some((state) => state.loading)
      }

      const keyArray = Array.isArray(keys) ? keys : [keys]
      return keyArray.some((key) => loadingStates[key]?.loading)
    },
    [loadingStates, globalLoading]
  )

  /**
   * 전역 로딩 상태를 설정합니다
   * @param {boolean} loading - 로딩 상태
   */
  const setGlobalLoadingState = useCallback((loading) => {
    setGlobalLoading(loading)
  }, [])

  return {
    // 상태
    loadingStates,
    globalLoading,

    // 액션
    startLoading,
    stopLoading,
    errorLoading,
    clearLoading,
    clearAllLoading,
    withLoading,
    setGlobalLoading: setGlobalLoadingState,

    // 헬퍼
    getLoadingState,
    isLoading,

    // 편의 메서드
    isAnyLoading: isLoading(),
    hasErrors: Object.values(loadingStates).some((state) => state.error),
    loadingCount: Object.values(loadingStates).filter((state) => state.loading)
      .length,
  }
}
