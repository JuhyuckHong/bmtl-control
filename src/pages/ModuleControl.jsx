import React, { useState } from "react";
import { CameraModuleRow } from "../components/CameraModuleRow";
import { LoginForm } from "../components/LoginForm";
import { useCameraStatus } from "../hooks/useCameraStatus";

export const ModuleControl = ({ mqttClient, connect, isConnecting, isConnected, status, subscribedTopics, filter, setFilter, searchTerm, setSearchTerm, onGlobalCommand, recordPublish }) => {
    const { moduleStatuses, moduleSettings, sendCommand, requestSettings } = useCameraStatus(mqttClient, subscribedTopics, recordPublish);

    const getFilteredModules = () => {
        const modules = [];

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
        if (searchTerm) {
            const moduleIdMatch = "0".includes(searchTerm);
            const siteNameMatch = dummyStatus.siteName.toLowerCase().includes(searchTerm.toLowerCase());
            includesDummy = moduleIdMatch || siteNameMatch;
        }

        if (includesDummy && (filter === "all" || filter === "online")) {
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

        for (let i = 1; i <= 99; i++) {
            const status = moduleStatuses[i] || { isConnected: null };

            if (filter === "online" && !status.isConnected) continue;
            if (filter === "offline" && status.isConnected !== false) continue;

            // 모듈 번호 또는 현장 이름으로 검색
            if (searchTerm) {
                const moduleIdMatch = i.toString().includes(searchTerm);
                const siteNameMatch = status.siteName && status.siteName.toLowerCase().includes(searchTerm.toLowerCase());
                if (!moduleIdMatch && !siteNameMatch) continue;
            }

            modules.push({
                id: i,
                status,
                settings: moduleSettings[i],
            });
        }
        return modules;
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
        for (let i = 1; i <= 99; i++) {
            const status = moduleStatuses[i]?.isConnected;
            if (status === true) counts.online++;
            else if (status === false) counts.offline++;
            else counts.unknown++;
        }
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
