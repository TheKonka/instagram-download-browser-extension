import { CONFIG_LIST } from '../../constants';

export interface StorageSettings {
    setting_show_open_in_new_tab_icon?: boolean;
    setting_show_zip_download_icon?: boolean;
    setting_enable_threads?: boolean;
    setting_enable_video_controls?: boolean;
    setting_enable_explore_video_clickthrough?: boolean;
    setting_format_replace_jpeg_with_jpg?: boolean;
    setting_format_use_indexing?: boolean;
    setting_enable_datetime_format?: boolean;
    setting_format_filename?: string;
    setting_format_datetime?: string;

    [key: string]: any;
}

class StorageCache {
    public settings: StorageSettings = {};
    private initialized = false;

    public async init() {
        if (this.initialized) return;

        this.settings = await chrome.storage.sync.get(CONFIG_LIST);

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync') {
                for (const [key, { newValue }] of Object.entries(changes)) {
                    this.settings[key] = newValue;
                }
            }
        });

        this.initialized = true;
    }
}

export const storageCache = new StorageCache();

export const initStorageCache = () => storageCache.init();
