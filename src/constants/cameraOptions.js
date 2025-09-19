export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour.toString().padStart(2, "0"));

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => minute.toString().padStart(2, "0"));

export const DEFAULT_SETTINGS = {
    startTime: "08:00",
    endTime: "18:00",
    captureInterval: "10",
    imageSize: "1920x1080",
    quality: "보통",
    iso: "400",
    format: "JPG",
    aperture: "f/2.8",
};

export const IMAGE_SIZE_OPTIONS = [
    { value: "640x480", label: "640x480" },
    { value: "1280x720", label: "1280x720" },
    { value: "1920x1080", label: "1920x1080" },
    { value: "2560x1440", label: "2560x1440" },
    { value: "3840x2160", label: "3840x2160" },
];

export const QUALITY_OPTIONS = [
    { value: "최고", label: "최고" },
    { value: "보통", label: "보통" },
    { value: "낮음", label: "낮음" },
];

export const ISO_OPTIONS = [
    { value: "100", label: "100" },
    { value: "200", label: "200" },
    { value: "400", label: "400" },
    { value: "800", label: "800" },
    { value: "1600", label: "1600" },
    { value: "3200", label: "3200" },
    { value: "6400", label: "6400" },
];

export const FORMAT_OPTIONS = [
    { value: "JPG", label: "JPG" },
    { value: "RAW", label: "RAW" },
    { value: "JPG+RAW", label: "JPG+RAW" },
];

export const APERTURE_OPTIONS = [
    { value: "f/1.4", label: "1.4" },
    { value: "f/2.0", label: "2.0" },
    { value: "f/2.8", label: "2.8" },
    { value: "f/4.0", label: "4.0" },
    { value: "f/5.6", label: "5.6" },
    { value: "f/8.0", label: "8.0" },
    { value: "f/11", label: "11" },
    { value: "f/16", label: "16" },
];