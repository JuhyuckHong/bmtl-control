import { useState, useEffect, useCallback, useRef } from "react";

export const useColumnResize = () => {
    // 최소 보장 폭(컬럼별 바닥값). 실제 DOM 측정값과 max로 사용
    // 순서: 용량, 촬영진행, 누락, 마지막 촬영, 마지막 부팅, 재부팅, SW버전, 업데이트, 시작, 종료, 간격, 이미지크기, 품질, ISO, 포맷, 조리개, 설정
    const minFloorWidths = useRef([
        // 용량, 촬영진행, 누락, 마지막 촬영, 마지막 부팅, 재부팅, SW버전, 업데이트, 시작, 종료, 간격, 이미지크기, 품질, ISO, 포맷, 조리개, 설정
        28, 40, 32, 84, 84, 78, 44, 54, 72, 72, 48, 64, 40, 36, 48, 44, 100,
    ]);

    // DOM을 직접 측정하여 컬럼 폭 자동 산출
    const calculateWidthsFromDOM = () => {
        try {
            const header = document.querySelector(
                ".modules-table-header .modules-table-scrollable"
            );
            if (!header) return null;

            const headerCells = Array.from(header.children);
            const colCount = headerCells.length;
            if (!colCount) return null;

            // 각 컬럼의 최대 콘텐츠 폭(헤더 포함)을 계산
            const rowContainers = Array.from(
                document.querySelectorAll(
                    ".camera-module-row .camera-module-scrollable"
                )
            );

            const measured = new Array(colCount).fill(0);

            const measureEl = (el) => {
                if (!el) return 0;
                // scrollWidth는 패딩 포함, 마진 제외. 절대 positioned 자식은 제외되므로 안전.
                const width = Math.ceil(el.scrollWidth || 0);
                // 안전 여유값 2px로 축소
                return width + 2;
            };

            // 헤더 측정
            for (let i = 0; i < colCount; i++) {
                measured[i] = Math.max(measured[i], measureEl(headerCells[i]));
            }

            // 각 행 측정 (모든 렌더된 행 대상)
            for (const row of rowContainers) {
                const cells = Array.from(row.children);
                for (let i = 0; i < Math.min(colCount, cells.length); i++) {
                    measured[i] = Math.max(measured[i], measureEl(cells[i]));
                }
            }

            // 바닥값과 병합
            return measured.map((w, i) =>
                Math.max(w || 0, minFloorWidths.current[i] || 40)
            );
        } catch (e) {
            return null;
        }
    };

    // 최초 fallback (DOM 측정 전 임시값)
    const defaultWidths = minFloorWidths.current;

    const [columnWidths, setColumnWidths] = useState(() => {
        try {
            const saved = localStorage.getItem("bmtl-column-widths");
            if (saved) {
                const savedWidths = JSON.parse(saved);
                if (
                    Array.isArray(savedWidths) &&
                    savedWidths.length === defaultWidths.length
                ) {
                    return savedWidths;
                }
            }
        } catch (_) {}
        return defaultWidths;
    });

    // 저장된 사용자 지정 폭이 있는지 여부 기억 (있으면 자동 측정으로 덮어쓰지 않음)
    const hasSaved = useRef(false);

    useEffect(() => {
        try {
            const src = localStorage.getItem("bmtl-column-widths-source");
            hasSaved.current = src === "manual";
        } catch (_) {}
    }, []);

    const [isResizing, setIsResizing] = useState(false);
    const [resizingColumn, setResizingColumn] = useState(null);

    useEffect(() => {
        try {
            localStorage.setItem("bmtl-column-widths", JSON.stringify(columnWidths));
        } catch (_) {}
    }, [columnWidths]);

    // DOM 기반 자동 측정: 마운트 시 한 번 계산 (사용자 저장치가 없을 때만)
    useEffect(() => {
        let frame = null;
        const nearlyEqual = (a, b) => {
            if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (Math.abs((a[i] || 0) - (b[i] || 0)) >= 1) return false;
            }
            return true;
        };

        const updateFromDOM = () => {
            if (hasSaved.current) return; // 사용자 저장값이 있으면 유지
            const measured = calculateWidthsFromDOM();
            if (measured && measured.length === defaultWidths.length) {
                setColumnWidths((prev) => {
                    if (nearlyEqual(prev, measured)) return prev;
                    return measured;
                });
                try {
                    localStorage.setItem("bmtl-column-widths-source", "auto");
                } catch (_) {}
            }
        };

        const schedule = () => {
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(updateFromDOM);
        };

        // 초기 한 번 측정
        schedule();

        // DOM 구조 변경 대응 (행 증감 등) 시에만 재측정 (리사이즈/크기변화는 관찰하지 않음)
        const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(schedule) : null;
        const tableContent = document.querySelector(".modules-table-content");
        if (mo && tableContent) {
            mo.observe(tableContent, { childList: true, subtree: true });
        }

        return () => {
            if (frame) cancelAnimationFrame(frame);
            if (mo) mo.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startResize = useCallback(
        (columnIndex, startX) => {
            setIsResizing(true);
            setResizingColumn(columnIndex);
            document.body.classList.add("column-resizing");

            const startWidth = columnWidths[columnIndex];

            const handleMouseMove = (e) => {
                const diff = e.clientX - startX;
                const newWidth = Math.max(24, startWidth + diff); // 최소 24px로 축소

                setColumnWidths((prev) => {
                    const newWidths = [...prev];
                    newWidths[columnIndex] = newWidth;
                    return newWidths;
                });
            };

            const handleMouseUp = () => {
                setIsResizing(false);
                setResizingColumn(null);
                document.body.classList.remove("column-resizing");
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                // 사용자 수동 조정으로 표시
                hasSaved.current = true;
                try {
                    localStorage.setItem("bmtl-column-widths-source", "manual");
                } catch (_) {}
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        },
        [columnWidths]
    );

    const resetColumnWidths = useCallback(() => {
        try {
            localStorage.removeItem("bmtl-column-widths");
            localStorage.removeItem("bmtl-column-widths-source");
        } catch (_) {}
        hasSaved.current = false;
        const measured = calculateWidthsFromDOM();
        if (measured && measured.length === defaultWidths.length) {
            setColumnWidths(measured);
        } else {
            setColumnWidths(defaultWidths);
        }
    }, []);

    const gridTemplateColumns = columnWidths.map((width) => `${width}px`).join(" ");

    return {
        columnWidths,
        gridTemplateColumns,
        startResize,
        isResizing,
        resizingColumn,
        resetColumnWidths,
    };
};
