import { BlobReader, BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import dayjs from "dayjs";
import { MESSAGE_ZIP_DOWNLOAD } from "../../constants";
import { getDataFromAPI, getImgOrVideoUrl } from "./fn";
import { getFilenameFromUrl } from "./filename";
import { MediaType } from "../../constants";

async function handleZipFirefox(articleNode: HTMLElement) {
    const data = await getDataFromAPI(articleNode);
    const blobList = [];
    if (data.caption) {
        blobList.push({
            filename: "caption.txt",
            content: data.caption.text,
        })
    }
    if ('carousel_media' in data) {
        const list = await Promise.all(
            data.carousel_media.map(async (resource: any, index: number) => {
                const url = getImgOrVideoUrl(resource);
                const filename = await getFilenameFromUrl({
                    url: url,
                    username: resource.owner?.username || data.owner.username,
                    datetime: dayjs.unix(resource.taken_at),
                    id: resource.pk,
                    index: index + 1,
                    type: MediaType.Post,
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
                return { filename: `${(index + 1).toString().padStart(2, '0')}-${filename}`, content };
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
            id: data.code || data.id,
        });
        const content = await response.blob();
        blobList.push({ filename, content });
    }
    chrome.runtime.sendMessage({
        type: MESSAGE_ZIP_DOWNLOAD,
        data: {
            blobList,
            zipFileName: await getFilenameFromUrl({
                url: '',
                username: data.owner.username,
                datetime: dayjs.unix(data.taken_at),
                id: data.code || data.id,
                type: MediaType.Post,
            }),
        },
    });
    return;
}

async function handleZipChrome(articleNode: HTMLElement) {
    const data = await getDataFromAPI(articleNode);
    const zipFileWriter = new BlobWriter();
    const zipWriter = new ZipWriter(zipFileWriter);
    const { setting_format_replace_jpeg_with_jpg } = await chrome.storage.sync.get(['setting_format_replace_jpeg_with_jpg']);
    if (data.caption) {
        await zipWriter.add("caption.txt", new TextReader(data.caption.text), { useWebWorkers: false });
    }
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
                id: resource.pk,
                index: i + 1,
            });
            let extension = content.type.split('/').pop() || 'jpg';
            if (setting_format_replace_jpeg_with_jpg) {
                extension = extension.replace('jpeg', 'jpg');
            }
            await zipWriter.add(
                `${(i + 1).toString().padStart(2, '0')}-${filename}.${extension}`,
                new BlobReader(content), { useWebWorkers: false }
            );
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
            id: data.code || data.id,
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
    a.download = await getFilenameFromUrl({
        url: '',
        username: data.owner.username,
        datetime: dayjs.unix(data.taken_at),
        id: data.code || data.id,
        type: MediaType.Post,
    }) + '.zip';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(blobUrl);
    }, 100);

    return;
}

export function handleZipDownload(articleNode: HTMLElement) {
    const isFirefox = /Firefox/.test(window.navigator.userAgent);
    return isFirefox ? handleZipFirefox(articleNode) : handleZipChrome(articleNode);
}