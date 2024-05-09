import type { Stories } from '../types/stories';

// save stories data
export async function saveStories(jsonData: Record<string, any>) {
   if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media?.reels_media)) {
      const data = (jsonData as Stories.Root).data.xdt_api__v1__feed__reels_media.reels_media;
      const { stories_reels_media } = await chrome.storage.local.get(['stories_reels_media']);
      const newMap = new Map(stories_reels_media);
      data.forEach((i) => newMap.set(i.id, i));
      await chrome.storage.local.set({ stories_reels_media: [...newMap] });
   }
}
