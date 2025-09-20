import React, { useState, useEffect, useCallback } from "react";

const SiteNameModalComponent = ({ isOpen, onClose, onSubmit, currentSiteName, moduleId }) => {
    const [siteName, setSiteName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (isOpen) {
            setSiteName(currentSiteName || "");
            setErrorMessage("");
        }
    }, [isOpen, currentSiteName]);

    // 사이트 이름 유효성 검사 (useCallback으로 메모이제이션)
    const validateSiteName = useCallback((name) => {
        if (!name.trim()) {
            return "사이트 이름을 입력해주세요.";
        }

        // 영문, 숫자, -, _ 만 허용하는 정규식
        const validPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validPattern.test(name)) {
            return "영문, 숫자, -, _ 만 사용 가능합니다.";
        }

        if (name.length < 2) {
            return "최소 2자 이상 입력해주세요.";
        }

        if (name.length > 30) {
            return "최대 30자까지 입력 가능합니다.";
        }

        return "";
    }, []);

    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setSiteName(value);

        // 실시간 유효성 검사
        const error = validateSiteName(value);
        setErrorMessage(error);
    }, [validateSiteName]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        const error = validateSiteName(siteName);
        if (error) {
            setErrorMessage(error);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(siteName.trim());
            onClose();
        } catch (error) {
            console.error("사이트 이름 변경 실패:", error);
            setErrorMessage("사이트 이름 변경에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }, [siteName, validateSiteName, onSubmit, onClose]);

    const handleClose = useCallback(() => {
        if (!isSubmitting) {
            onClose();
        }
    }, [isSubmitting, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>사이트 이름 변경</h3>
                    <button className="modal-close-btn" onClick={handleClose} disabled={isSubmitting}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label htmlFor="siteName">모듈 {moduleId.toString().padStart(2, "0")} 사이트 이름:</label>
                        <input
                            id="siteName"
                            type="text"
                            value={siteName}
                            onChange={handleInputChange}
                            placeholder="site-name-01"
                            maxLength={30}
                            disabled={isSubmitting}
                            autoFocus
                            className={errorMessage ? "error" : ""}
                        />

                        <div className="input-guidelines">
                            <strong>입력 규칙:</strong>
                            <ul>
                                <li>영문, 숫자만 사용 (a-z, A-Z, 0-9)</li>
                                <li>특수문자는 하이픈(-), 언더스코어(_)만 허용</li>
                                <li>띄어쓰기 및 한글 사용 불가</li>
                                <li>2~30자 길이</li>
                            </ul>
                        </div>

                        {errorMessage && (
                            <div className="error-message">
                                {errorMessage}
                            </div>
                        )}

                        <small className="help-text">
                            현재: {currentSiteName || "미설정"}
                        </small>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-cancel"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || !siteName.trim() || !!errorMessage}
                        >
                            {isSubmitting ? "변경 중..." : "변경"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 모달이 열려있지 않을 때는 리렌더링하지 않도록 최적화
export const SiteNameModal = React.memo(SiteNameModalComponent, (prevProps, nextProps) => {
    // 모달이 닫혀있다면 다른 props 변경을 무시
    if (!prevProps.isOpen && !nextProps.isOpen) {
        return true;
    }

    // 모달이 열려있을 때는 모든 props 비교
    return (
        prevProps.isOpen === nextProps.isOpen &&
        prevProps.currentSiteName === nextProps.currentSiteName &&
        prevProps.moduleId === nextProps.moduleId &&
        prevProps.onClose === nextProps.onClose &&
        prevProps.onSubmit === nextProps.onSubmit
    );
});