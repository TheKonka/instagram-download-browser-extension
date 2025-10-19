import {BlobReader, BlobWriter, ZipWriter} from "@zip.js/zip.js";
import dayjs from "dayjs";
import {DEFAULT_DATETIME_FORMAT, MESSAGE_ZIP_DOWNLOAD} from "../../constants";
import {getDataFromAPI, getFilenameFromUrl, getImgOrVideoUrl} from "./fn";

async function handleZipFirefox(articleNode: HTMLElement) {
    const data = await getDataFromAPI(articleNode);
    const blobList = [];
    if ('carousel_media' in data) {
        const list = await Promise.all(
            data.carousel_media.map(async (resource: any, index: number) => {
                const url = getImgOrVideoUrl(resource);
                const filename = await getFilenameFromUrl({
                    url: url,
                    username: resource.owner?.username || data.owner.username,
                    datetime: dayjs.unix(resource.taken_at),
                    fileId: `${resource.pk}_${index + 1}`,
                });
                const response = await fetch(url, {
                    headers: new Headers({
                        Origin: location.origin,
                    }),
                    mode: 'cors',
                });
                if (!response.ok) {
                    console.error(`Failed to fetch ${url}`);
                    return null;
                }
                const content = await response.blob();
                return {filename, content};
            })
        );
        blobList.push(...list.filter((e) => e));
    } else {
        const url = getImgOrVideoUrl(data);
        const response = await fetch(url, {
            headers: new Headers({
                Origin: location.origin,
            }),
            mode: 'cors',
        });
        if (!response.ok) {
            console.error(`Failed to fetch ${url}`);
            return;
        }
        const filename = await getFilenameFromUrl({
            url: url,
            username: data.owner.username,
            datetime: dayjs.unix(data.taken_at),
            fileId: data.code || data.id,
        });
        const content = await response.blob();
        blobList.push({filename, content});
    }
    const {setting_format_datetime = DEFAULT_DATETIME_FORMAT} = await chrome.storage.sync.get(['setting_format_datetime']);
    chrome.runtime.sendMessage({
        type: MESSAGE_ZIP_DOWNLOAD,
        data: {
            blobList,
            zipFileName: [data.owner.username, data.code, dayjs.unix(data.taken_at).format(setting_format_datetime)].join('_'),
        },
    });
    return;
}

async function handleZipChrome(articleNode: HTMLElement) {
    const data = await getDataFromAPI(articleNode);
    const zipFileWriter = new BlobWriter();
    const zipWriter = new ZipWriter(zipFileWriter);
    const {setting_format_replace_jpeg_with_jpg} = await chrome.storage.sync.get(['setting_format_replace_jpeg_with_jpg']);
    if ('carousel_media' in data) {
        for (let i = 0; i < data.carousel_media.length; i++) {
            const resource = data.carousel_media[i];
            const url = getImgOrVideoUrl(resource);
            const response = await fetch(url, {
                headers: new Headers({
                    Origin: location.origin,
                }),
                mode: 'cors',
            });
            if (!response.ok) {
                console.error(`Failed to fetch ${url}`);
                continue;
            }
            const content = await response.blob();
            const filename = await getFilenameFromUrl({
                url: url,
                username: resource.owner?.username || data.owner.username,
                datetime: dayjs.unix(resource.taken_at),
                fileId: `${resource.pk}_${i + 1}`,
            });
            let extension = content.type.split('/').pop() || 'jpg';
            if (setting_format_replace_jpeg_with_jpg) {
                extension = extension.replace('jpeg', 'jpg');
            }
            await zipWriter.add(filename + '.' + extension, new BlobReader(content), {
                useWebWorkers: false,
            });
        }
    } else {
        const url = getImgOrVideoUrl(data);
        const response = await fetch(url, {
            headers: new Headers({
                Origin: location.origin,
            }),
            mode: 'cors',
        });
        if (!response.ok) {
            console.error(`Failed to fetch ${url}`);
            return;
        }
        const filename = await getFilenameFromUrl({
            url: url,
            username: data.owner.username,
            datetime: dayjs.unix(data.taken_at),
            fileId: data.code || data.id,
        });
        const content = await response.blob();
        let extension = content.type.split('/').pop() || 'jpg';
        if (setting_format_replace_jpeg_with_jpg) {
            extension = extension.replace('jpeg', 'jpg');
        }
        await zipWriter.add(filename + '.' + extension, new BlobReader(content), {
            useWebWorkers: false,
        });
    }

    const zipContent = await zipWriter.close();
    const blobUrl = URL.createObjectURL(zipContent);
    const a = document.createElement('a');
    a.href = blobUrl;
    const {setting_format_datetime = DEFAULT_DATETIME_FORMAT} = await chrome.storage.sync.get(['setting_format_datetime']);
    a.download = [data.owner.username, data.code, dayjs.unix(data.taken_at).format(setting_format_datetime)].join('_') + '.zip';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    }, 100);

    return;
}


export function handleZipDownload(articleNode: HTMLElement) {
    return typeof browser !== 'undefined' ? handleZipFirefox(articleNode) : handleZipChrome(articleNode);
}