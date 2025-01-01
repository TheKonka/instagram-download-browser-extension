import type { Stories } from '../types/stories';
import type { Highlight } from '../types/highlights';
import type { Reels } from '../types/reels';
import type { ProfileReel } from '../types/profileReel';

// save highlights data from json
export async function saveHighlights(jsonData: Record<string, any>) {
   if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media__connection?.edges)) {
      const data = (jsonData as Highlight.Root).data.xdt_api__v1__feed__reels_media__connection.edges.map((i) => i.node);
      const { highlights_data } = await chrome.storage.local.get(['highlights_data']);
      const newMap = new Map(highlights_data);
      data.forEach((i) => newMap.set(i.id, i));
      await chrome.storage.local.set({ highlights_data: [...newMap] });

      //? The presentation stories in home page top url is /stories/{username} now
      //? before was /stories/highlights/{pk}
      //? so we need to save the data to stories_reels_media
      saveStoriesToLocal(data);
   }
}

// save reels data from json
export async function saveReels(jsonData: Record<string, any>) {
   if (Array.isArray(jsonData.data?.xdt_api__v1__clips__home__connection_v2?.edges)) {
      const data = (jsonData as Reels.Root).data.xdt_api__v1__clips__home__connection_v2.edges.map((i) => i.node.media);
      const { reels_edges_data } = await chrome.storage.local.get(['reels_edges_data']);
      const newMap = new Map(reels_edges_data);
      data.forEach((i) => newMap.set(i.code, i));
      await chrome.storage.local.set({ reels_edges_data: [...newMap] });
   }
}

export async function saveProfileReel(jsonData: Record<string, any>) {
   if (Array.isArray(jsonData.data?.xdt_api__v1__clips__user__connection_v2?.edges)) {
      const data = (jsonData as ProfileReel.Root).data.xdt_api__v1__clips__user__connection_v2.edges.map((i) => i.node.media);
      const { profile_reels_edges_data } = await chrome.storage.local.get(['profile_reels_edges_data']);
      const newMap = new Map(profile_reels_edges_data);
      data.forEach((i) => newMap.set(i.code, i));
      await chrome.storage.local.set({ profile_reels_edges_data: [...newMap] });
   }
}

// save stories data from json
export async function saveStories(jsonData: Record<string, any>) {
   if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media?.reels_media)) {
      const data = (jsonData as Stories.Root).data.xdt_api__v1__feed__reels_media.reels_media;
      saveStoriesToLocal(data);
   }
}

export async function saveStoriesToLocal(data: Stories.ReelsMedum[]) {
   const { stories_reels_media } = await chrome.storage.local.get(['stories_reels_media']);
   const newMap = new Map(stories_reels_media);
   data.forEach((i) => newMap.set(i.id, i));
   await chrome.storage.local.set({ stories_reels_media: [...newMap] });
}
