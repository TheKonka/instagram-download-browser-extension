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

export interface StorageData {
    reels?: Record<string, any>;
    reels_media?: any[];
    stories_reels_media?: any[];
    stories_user_ids?: any[];
    id_to_username_map?: any[];
    threads?: any[];
    reels_edges_data?: any[];
    user_profile_pic_url?: any[];
    profile_reels_edges_data?: any[];
    highlights_data?: any[];
    [key: string]: any;
}

class StorageCache {
    public settings: StorageSettings = {};
    public data: StorageData = {};
    private initialized = false;

    public async init() {
        if (this.initialized) return;

        const [syncRes, localRes] = await Promise.all([
            chrome.storage.sync.get(CONFIG_LIST),
            chrome.storage.local.get([
                'reels',
                'reels_media',
                'stories_reels_media',
                'stories_user_ids',
                'id_to_username_map',
                'threads',
                'reels_edges_data',
                'user_profile_pic_url',
                'profile_reels_edges_data',
                'highlights_data'
            ])
        ]);

        this.settings = syncRes;
        this.data = localRes;

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync') {
                for (const [key, { newValue }] of Object.entries(changes)) {
                    this.settings[key] = newValue;
                }
            } else if (areaName === 'local') {
                for (const [key, { newValue }] of Object.entries(changes)) {
                    this.data[key] = newValue;
                }
            }
        });

        this.initialized = true;
    }
}

export const storageCache = new StorageCache();

export const initStorageCache = () => storageCache.init();
