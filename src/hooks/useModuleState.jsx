import { useState, useCallback } from 'react';
import { hasStatusDiff } from '../utils/moduleUtils';

/**
 * 모듈 상태 관리를 위한 커스텀 훅
 * @returns {Object} 상태와 상태 업데이트 함수들
 */
export const useModuleState = () => {
    const [moduleStatuses, setModuleStatuses] = useState({});
    const [moduleSettings, setModuleSettings] = useState({});
    const [moduleOptions, setModuleOptions] = useState({});

    /**
     * 모듈 상태 업데이트
     * @param {string|number} moduleId - 모듈 ID
     * @param {Object} statusData - 업데이트할 상태 데이터
     */
    const updateModuleStatus = useCallback((moduleId, statusData = {}) => {
        setModuleStatuses((prev) => {
            const existingModule = prev[moduleId];
            const nextTimestamp = new Date();
            const hasChange = hasStatusDiff(existingModule, statusData);
            const baseModule = existingModule || {};

            const nextModule = hasChange
                ? { ...baseModule, ...statusData, lastUpdated: nextTimestamp }
                : { ...baseModule, lastUpdated: nextTimestamp };

            return {
                ...prev,
                [moduleId]: nextModule,
            };
        });
    }, []);

    /**
     * 모듈 설정 업데이트
     * @param {string|number} moduleId - 모듈 ID
     * @param {Object} settingsData - 설정 데이터
     */
    const updateModuleSettings = useCallback((moduleId, settingsData) => {
        setModuleSettings((prev) => ({
            ...prev,
            [moduleId]: settingsData,
        }));
    }, []);

    /**
     * 모듈 옵션 업데이트
     * @param {string|number} moduleId - 모듈 ID
     * @param {Object} optionsData - 옵션 데이터
     */
    const updateModuleOptions = useCallback((moduleId, optionsData) => {
        setModuleOptions((prev) => ({
            ...prev,
            [moduleId]: optionsData,
        }));
    }, []);

    /**
     * 모듈 연결 상태 업데이트 (타임아웃 기반)
     * @param {number} timeoutMinutes - 타임아웃 시간(분)
     */
    const updateConnectionStatus = useCallback((timeoutMinutes = 5) => {
        const now = new Date();
        const timeoutMs = timeoutMinutes * 60 * 1000;

        setModuleStatuses((prev) => {
            const updated = {};
            let hasChanges = false;

            Object.keys(prev).forEach((moduleId) => {
                const module = prev[moduleId];
                const lastUpdated = module.lastUpdated;

                if (lastUpdated && now - lastUpdated > timeoutMs && module.isConnected !== false) {
                    updated[moduleId] = { ...module, isConnected: false };
                    hasChanges = true;
                } else {
                    updated[moduleId] = module;
                }
            });

            return hasChanges ? updated : prev;
        });
    }, []);

    /**
     * 특정 모듈 삭제
     * @param {string|number} moduleId - 삭제할 모듈 ID
     */
    const removeModule = useCallback((moduleId) => {
        setModuleStatuses(prev => {
            const { [moduleId]: removed, ...rest } = prev;
            return rest;
        });
        setModuleSettings(prev => {
            const { [moduleId]: removed, ...rest } = prev;
            return rest;
        });
        setModuleOptions(prev => {
            const { [moduleId]: removed, ...rest } = prev;
            return rest;
        });
    }, []);

    /**
     * 모든 모듈 데이터 초기화
     */
    const clearAllModules = useCallback(() => {
        setModuleStatuses({});
        setModuleSettings({});
        setModuleOptions({});
    }, []);

    return {
        // State
        moduleStatuses,
        moduleSettings,
        moduleOptions,

        // Actions
        updateModuleStatus,
        updateModuleSettings,
        updateModuleOptions,
        updateConnectionStatus,
        removeModule,
        clearAllModules
    };
};