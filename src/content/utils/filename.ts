import dayjs, { Dayjs } from "dayjs";
import { DEFAULT_DATETIME_FORMAT, DEFAULT_FILENAME_FORMAT, MediaType } from "../../constants";
import { storageCache } from "./storage";

export interface DownloadParams {
    url: string;
    username?: string;
    datetime?: string | null | Dayjs | number;
    id?: string;
    index?: number;
    type?: MediaType;
}

export function getMediaName(url: string) {
    try {
        const urlObj = new URL(url);
        const pathnameArr = urlObj.pathname.split('/');
        const filename = pathnameArr[pathnameArr.length - 1];
        const filenameArr = filename.split('.');
        return filenameArr[0];
    } catch {
        return '';
    }
}

export function hashCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash >>> 0;
}

export const getFilenameFromUrl = async ({ url, username, datetime, id, index, type }: DownloadParams) => {
    const {
        setting_format_datetime = DEFAULT_DATETIME_FORMAT,
        setting_format_filename = DEFAULT_FILENAME_FORMAT,
        setting_enable_datetime_format,
    } = storageCache.settings;

    const MAX_ID_LENGTH = 40;
    const MAX_FILENAME_LENGTH = 128;

    let processedId = id || '';

    // Automatic ID protection: If id is too long (> 40 chars), hash it to a short numeric string (~10 chars).
    if (processedId.length > MAX_ID_LENGTH) {
        processedId = hashCode(processedId).toString();
    }

    // Append index if provided (e.g. _1, _2)
    if (index !== undefined) {
        processedId = `${processedId}_${index}`;
    }

    let filename = processedId;

    if (username && datetime && id) {
        const formattedDatetime = setting_enable_datetime_format
            ? dayjs(datetime).format(setting_format_datetime)
            : dayjs(datetime).unix().toString();

        filename = setting_format_filename
            .replace(/{username}/g, username)
            .replace(/{datetime}/g, formattedDatetime)
            .replace(/{id}/g, processedId)
            .replace(/{type}/g, type || '');
    }

    if (!filename) {
        filename = getMediaName(url);
    }

    // Global protection: Truncate if total length > 128 to prevent OS errors.
    if (filename.length > MAX_FILENAME_LENGTH) {
        filename = filename.substring(0, MAX_FILENAME_LENGTH);
    }

    return filename;
};
