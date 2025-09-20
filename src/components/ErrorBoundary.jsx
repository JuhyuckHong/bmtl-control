import React from 'react';
import PropTypes from 'prop-types';

/**
 * 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 JavaScript 에러를 포착하고 처리합니다.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // 에러가 발생하면 상태를 업데이트하여 fallback UI를 보여줍니다
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // 에러 정보를 상태에 저장
        this.setState({
            error,
            errorInfo
        });

        // 에러를 로깅 서비스로 전송 (개발 환경에서는 콘솔에 출력)
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Boundary Caught Error');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Component Stack:', errorInfo.componentStack);
            console.groupEnd();
        }

        // 부모 컴포넌트의 에러 핸들러 호출 (있는 경우)
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1
        }));
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        });

        // 페이지 새로고침으로 완전 초기화
        if (this.props.allowPageReload) {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            // 커스텀 fallback UI가 제공된 경우 사용
            if (this.props.fallback) {
                return this.props.fallback(
                    this.state.error,
                    this.state.errorInfo,
                    this.handleRetry,
                    this.handleReset
                );
            }

            // 기본 에러 UI
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <h2>⚠️ 문제가 발생했습니다</h2>
                        <p className="error-message">
                            {this.props.userFriendlyMessage ||
                             '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <details className="error-details">
                                <summary>개발자 정보 (개발 환경에서만 표시)</summary>
                                <div className="error-info">
                                    <strong>Error:</strong>
                                    <pre>{this.state.error && this.state.error.toString()}</pre>

                                    <strong>Component Stack:</strong>
                                    <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                                </div>
                            </details>
                        )}

                        <div className="error-actions">
                            <button
                                onClick={this.handleRetry}
                                className="btn btn-primary"
                                disabled={this.state.retryCount >= this.props.maxRetries}
                            >
                                다시 시도 {this.state.retryCount > 0 && `(${this.state.retryCount}/${this.props.maxRetries})`}
                            </button>

                            {this.props.allowPageReload && (
                                <button
                                    onClick={this.handleReset}
                                    className="btn btn-secondary"
                                >
                                    페이지 새로고침
                                </button>
                            )}
                        </div>

                        {this.props.contactInfo && (
                            <p className="error-contact">
                                문제가 지속되면 <a href={`mailto:${this.props.contactInfo}`}>
                                    기술 지원팀에 문의
                                </a>해주세요.
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    /** 에러 발생 시 렌더링할 자식 컴포넌트들 */
    children: PropTypes.node.isRequired,

    /** 커스텀 fallback UI 렌더링 함수 */
    fallback: PropTypes.func,

    /** 사용자에게 표시할 친화적인 에러 메시지 */
    userFriendlyMessage: PropTypes.string,

    /** 에러 발생 시 호출될 콜백 함수 */
    onError: PropTypes.func,

    /** 최대 재시도 횟수 */
    maxRetries: PropTypes.number,

    /** 페이지 새로고침 허용 여부 */
    allowPageReload: PropTypes.bool,

    /** 기술 지원 연락처 */
    contactInfo: PropTypes.string,
};

ErrorBoundary.defaultProps = {
    maxRetries: 3,
    allowPageReload: true,
    userFriendlyMessage: null,
    onError: null,
    fallback: null,
    contactInfo: null,
};

export default ErrorBoundary;