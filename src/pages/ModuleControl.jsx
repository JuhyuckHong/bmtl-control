import React from "react";
import { CameraModuleRow } from "../components/CameraModuleRow";
import { LoginForm } from "../components/LoginForm";
import { useCameraStatus } from "../hooks/useCameraStatus";

const formatModuleId = (moduleId) => moduleId.toString().padStart(2, "0");

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

        const matchesSearch = (moduleId, moduleStatus) => {
            if (!normalizedSearch) {
                return true;
            }

            const numericIdText = moduleId.toString();
            const displayId = formatModuleId(moduleId).toLowerCase();

            const moduleIdMatch = numericIdText.includes(normalizedSearch) || displayId.includes(normalizedSearch);
            const siteNameMatch = moduleStatus?.siteName && moduleStatus.siteName.toLowerCase().includes(normalizedSearch);

            return moduleIdMatch || siteNameMatch;
        };

        knownModuleIds.forEach((moduleId) => {
            const moduleStatus = moduleStatuses[moduleId] || { isConnected: null };

            if (filter === "online" && moduleStatus.isConnected !== true) {
                return;
            }
            if (filter === "offline" && moduleStatus.isConnected !== false) {
                return;
            }
            if (!matchesSearch(moduleId, moduleStatus)) {
                return;
            }

            modules.push({
                id: moduleId,
                status: moduleStatus,
                settings: moduleSettings[moduleId],
            });
        });

        const isDevelopment = process.env.NODE_ENV === "development";

        if (isDevelopment && !modules.some((module) => module.id === 0)) {
            const dummyStatus = {
                isConnected: true,
                lastCaptureTime: new Date("2024-12-15T14:30:25"),
                lastBootTime: new Date("2024-12-15T08:15:10"),
                storageUsed: 45.2,
                temperature: 24.7,
                siteName: "테스트_현장",
                swVersion: "v1.2.2",
                todayTotalCaptures: 120,
                todayCapturedCount: 80,
                missedCaptures: 2,
            };

            let includesDummy = true;
            if (normalizedSearch) {
                const displayId = formatModuleId(0).toLowerCase();
                const moduleIdMatch = "0".includes(normalizedSearch) || displayId.includes(normalizedSearch);
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

    const handleGlobalCommand = React.useCallback(
        (command) => {
            if (command === "status_request") {
                sendCommand("global", "status_request_all", {});
            } else if (command === "options_request") {
                sendCommand("global", "options_request", {});
            } else if (command === "reboot") {
                sendCommand("global", "reboot", {});
            }
        },
        [sendCommand]
    );

    const getStatusCounts = () => {
        const counts = { online: 0, offline: 0, unknown: 0 };
        const knownModuleIds = collectKnownModuleIds();

        if (knownModuleIds.length === 0) {
            return counts;
        }

        knownModuleIds.forEach((moduleId) => {
            const moduleStatus = moduleStatuses[moduleId];
            if (moduleStatus?.isConnected === true) {
                counts.online += 1;
            } else if (moduleStatus?.isConnected === false) {
                counts.offline += 1;
            } else {
                counts.unknown += 1;
            }
        });

        return counts;
    };

    const statusCounts = React.useMemo(() => getStatusCounts(), [moduleStatuses, moduleSettings]);

    // 상위 컴포넌트(App)로 전역 커맨드 핸들러와 상태 요약 전달
    React.useEffect(() => {
        if (onGlobalCommand) {
            onGlobalCommand(handleGlobalCommand, statusCounts);
        }
    }, [onGlobalCommand, handleGlobalCommand, statusCounts]);

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
                                <div className="table-header">저장공간</div>
                                <div className="table-header">디바이스</div>
                                <div className="table-header">촬영 현황</div>
                                <div className="table-header">운영 시간</div>
                                <div className="table-header">모듈 제어</div>
                                <div className="table-header">소프트웨어</div>
                                <div className="table-header">카메라 설정</div>
                                <div className="table-header">설정 관리</div>
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
                                        moduleDisplayId={formatModuleId(module.id)}
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
