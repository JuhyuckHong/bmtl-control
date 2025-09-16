import { useState, useEffect, useCallback } from "react";

export const useColumnResize = () => {
    const defaultWidths = [40, 50, 40, 110, 110, 110, 85, 85, 70, 100, 60, 60, 60, 55, 150];

    const [columnWidths, setColumnWidths] = useState(() => {
        const saved = localStorage.getItem("bmtl-column-widths");
        return saved ? JSON.parse(saved) : defaultWidths;
    });

    const [isResizing, setIsResizing] = useState(false);
    const [resizingColumn, setResizingColumn] = useState(null);

    useEffect(() => {
        localStorage.setItem("bmtl-column-widths", JSON.stringify(columnWidths));
    }, [columnWidths]);

    const startResize = useCallback(
        (columnIndex, startX) => {
            setIsResizing(true);
            setResizingColumn(columnIndex);
            document.body.classList.add("column-resizing");

            const startWidth = columnWidths[columnIndex];

            const handleMouseMove = (e) => {
                const diff = e.clientX - startX;
                const newWidth = Math.max(30, startWidth + diff); // 최소 30px

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
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        },
        [columnWidths]
    );

    const resetColumnWidths = useCallback(() => {
        setColumnWidths(defaultWidths);
        localStorage.removeItem("bmtl-column-widths");
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
