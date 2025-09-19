import React, { useState } from "react";
import { CameraModuleRow } from "../components/CameraModuleRow";
import { LoginForm } from "../components/LoginForm";
import { useCameraStatus } from "../hooks/useCameraStatus";

export const ModuleControl = ({ mqttClient, connect, isConnecting, isConnected, status, subscribedTopics, filter, setFilter, searchTerm, setSearchTerm, onGlobalCommand, recordPublish }) => {
    const { moduleStatuses, moduleSettings, sendCommand, requestSettings } = useCameraStatus(mqttClient, subscribedTopics, recordPublish);

    const collectKnownModuleIds = () => {
        const ids = new Set();

        Object.keys(moduleStatuses || {}).forEach((key) => {
            const numericId = Number(key);
            if (!Number.isNaN(numericId)) {
                ids.add(numericId);
            }
        });

        Object.keys(moduleSettings || {}).forEach((key) => {
            const numericId = Number(key);
            if (!Number.isNaN(numericId)) {
                ids.add(numericId);
            }
        });

        return Array.from(ids);
    };

    const getFilteredModules = () => {
        const modules = [];
        const knownModuleIds = collectKnownModuleIds().sort((a, b) => a - b);
        const normalizedSearch = (searchTerm || "").trim().toLowerCase();

        const matchesSearch = (moduleId, status) => {
            if (!normalizedSearch) return true;
            const moduleIdMatch = moduleId.toString().includes(normalizedSearch);
            const siteNameMatch = status?.siteName && status.siteName.toLowerCase().includes(normalizedSearch);
            return moduleIdMatch || siteNameMatch;
        };

        knownModuleIds.forEach((moduleId) => {
            const status = moduleStatuses[moduleId] || { isConnected: null };

            if (filter === "online" && status.isConnected !== true) return;
            if (filter === "offline" && status.isConnected !== false) return;
            if (!matchesSearch(moduleId, status)) return;

            modules.push({
                id: moduleId,
                status,
                settings: moduleSettings[moduleId],
            });
        });

        const isDevelopment = process.env.NODE_ENV === "development";

        if (isDevelopment && !modules.some((module) => module.id === 0)) {
            // 더미 모듈 00번 추가 (항상 연결된 상태로 표시)
            const dummyStatus = {
                isConnected: true,
                lastCaptureTime: new Date("2024-12-15T14:30:25"),
                lastBootTime: new Date("2024-12-15T08:15:10"),
                batteryLevel: 95,
                storageUsed: 45.2,
                siteName: "테스트 현장",
            };

            // 더미 모듈 검색 조건 확인
            let includesDummy = true;
            if (normalizedSearch) {
                const moduleIdMatch = "0".includes(normalizedSearch);
                const siteNameMatch = dummyStatus.siteName.toLowerCase().includes(normalizedSearch);
                includesDummy = moduleIdMatch || siteNameMatch;
            }

            const passesFilter = filter === "all" || filter === "online";

            if (includesDummy && passesFilter && matchesSearch(0, dummyStatus)) {
                modules.push({
                    id: 0,
                    status: dummyStatus,
                    settings: moduleSettings[0] || {
                        startTime: "08:00",
                        endTime: "18:00",
                        captureInterval: "10",
                        imageSize: "1920x1080",
                        quality: "85",
                        iso: "auto",
                        format: "jpeg",
                        aperture: "f/2.8",
                    },
                    isDummy: true,
                });
            }
        }

        return modules.sort((a, b) => a.id - b.id);
    };

    const handleCommand = (moduleId, command, data) => {
        sendCommand(moduleId, command, data);
    };

    const handleLoadSettings = (moduleId) => {
        requestSettings(moduleId);
    };

    const handleGlobalCommand = (command) => {
        if (command === "status_request") {
            // 전체 설정 불러오기 요청
            sendCommand("global", "status_request", {});
        } else if (command === "reboot") {
            // 전체 재부팅 명령
            sendCommand("global", "reboot", {});
        }
    };

    // 상위 컴포넌트에서 사용할 수 있도록 전역 커맨드 핸들러와 상태 카운트 전달
    React.useEffect(() => {
        if (onGlobalCommand) {
            onGlobalCommand(handleGlobalCommand, getStatusCounts());
        }
    }, [moduleStatuses, onGlobalCommand]);

    const getStatusCounts = () => {
        const counts = { online: 0, offline: 0, unknown: 0 };
        const knownModuleIds = collectKnownModuleIds();

        if (knownModuleIds.length === 0) {
            return counts;
        }

        knownModuleIds.forEach((moduleId) => {
            const status = moduleStatuses[moduleId];
            if (status?.isConnected === true) {
                counts.online += 1;
            } else if (status?.isConnected === false) {
                counts.offline += 1;
            } else {
                counts.unknown += 1;
            }
        });

        return counts;
    };

    const statusCounts = getStatusCounts();
    const filteredModules = getFilteredModules();

    return (
        <div className="module-control">
            {!isConnected ? (
                <div className="mqtt-login-container">
                    <LoginForm onConnect={connect} isConnecting={isConnecting} isConnected={isConnected} status={status} />
                </div>
            ) : (
                <div className="modules-table">
                    <div className="modules-table-scroll-container">
                        <div className="modules-table-content">
                            <div className="modules-table-header">
                                <div>모듈</div>
                                <div>상태</div>
                                <div>현장 이름</div>
                                <div className="table-header">용량</div>
                                <div className="table-header">촬영 현황</div>
                                <div className="table-header">마지막 촬영</div>
                                <div className="table-header">마지막 부팅</div>
                                <div className="table-header">제어</div>
                                <div className="table-header">소프트웨어</div>
                                <div className="table-header">시간 설정</div>
                                <div className="table-header">카메라 설정</div>
                                <div className="table-header">설정</div>
                            </div>

                            {filteredModules.length === 0 ? (
                                <div className="no-modules">
                                    <p>표시할 모듈이 없습니다.</p>
                                </div>
                            ) : (
                                filteredModules.map((module) => (
                                    <CameraModuleRow
                                        key={module.id}
                                        moduleId={module.id}
                                        status={module.status}
                                        onCommand={handleCommand}
                                        onLoadSettings={handleLoadSettings}
                                        isDummy={module.isDummy}
                                        initialSettings={module.settings}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
