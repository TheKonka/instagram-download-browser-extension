export namespace Reels {
   export interface Root {
      data: Data;
      extensions: Extensions;
      status: string;
   }

   export interface Data {
      xdt_api__v1__clips__home__connection_v2: XdtApiV1ClipsHomeConnectionV2;
   }

   export interface XdtApiV1ClipsHomeConnectionV2 {
      edges: Edge[];
      page_info: PageInfo;
   }

   export interface Edge {
      node: Node;
      cursor: string;
   }

   export interface Node {
      media: Media;
      __typename: string;
   }

   export interface Media {
      code: string;
      pk: string;
      actor_fbid: any;
      has_liked: boolean;
      comments_disabled: any;
      like_count: number;
      user: User;
      product_type: string;
      view_count: any;
      like_and_view_counts_disabled: boolean;
      owner: Owner;
      id: string;
      organic_tracking_token: string;
      clips_metadata: ClipsMetadata;
      comment_count: number;
      taken_at: number;
      caption: Caption;
      media_type: number;
      commenting_disabled_for_viewer: any;
      can_reshare: any;
      can_viewer_reshare: boolean;
      audience: any;
      ig_media_sharing_disabled: boolean;
      inventory_source: string;
      logging_info_token: string;
      carousel_media: any;
      image_versions2: ImageVersions2;
      media_overlay_info: any;
      share_urls: any;
      saved_collection_ids: any;
      has_viewer_saved: any;
      original_height: number;
      original_width: number;
      is_dash_eligible: number;
      number_of_qualities: number;
      video_dash_manifest: string;
      video_versions: VideoVersion[];
      has_audio: boolean;
      creative_config?: CreativeConfig;
      usertags?: Usertags;
      location?: Location;
      clips_attribution_info: any;
      invited_coauthor_producers: any[];
      carousel_media_count: any;
      preview: any;
   }

   export interface User {
      pk: string;
      username: string;
      profile_pic_url: string;
      id: string;
      is_verified: boolean;
      is_unpublished: boolean;
      is_private: boolean;
      friendship_status: FriendshipStatus;
   }

   export interface FriendshipStatus {
      following: boolean;
   }

   export interface Owner {
      pk: string;
      username: string;
      id: string;
      is_unpublished: boolean;
   }

   export interface ClipsMetadata {
      music_info?: MusicInfo;
      original_sound_info?: OriginalSoundInfo;
   }

   export interface MusicInfo {
      music_asset_info: MusicAssetInfo;
      music_consumption_info: MusicConsumptionInfo;
   }

   export interface MusicAssetInfo {
      audio_cluster_id: string;
      cover_artwork_thumbnail_uri: string;
      title: string;
      display_artist: string;
      is_explicit: boolean;
   }

   export interface MusicConsumptionInfo {
      should_mute_audio: boolean;
      is_trending_in_clips: boolean;
   }

   export interface OriginalSoundInfo {
      audio_asset_id: string;
      ig_artist: IgArtist;
      consumption_info: ConsumptionInfo;
      original_audio_title: string;
      is_explicit: boolean;
   }

   export interface IgArtist {
      profile_pic_url: string;
      id: string;
      username: string;
   }

   export interface ConsumptionInfo {
      should_mute_audio_reason_type: any;
      is_trending_in_clips: boolean;
   }

   export interface Caption {
      text: string;
      pk: string;
      has_translation?: boolean;
   }

   export interface ImageVersions2 {
      candidates: Candidate[];
   }

   export interface Candidate {
      height: number;
      url: string;
      width: number;
   }

   export interface VideoVersion {
      type: number;
      url: string;
   }

   export interface CreativeConfig {
      effect_configs: any;
   }

   export interface Usertags {
      in: In[];
   }

   export interface In {
      user: User2;
   }

   export interface User2 {
      username: string;
      id: string;
   }

   export interface Location {
      pk: string;
      name: string;
   }

   export interface PageInfo {
      end_cursor: string;
      has_next_page: boolean;
      has_previous_page: boolean;
      start_cursor: any;
   }

   export interface Extensions {
      is_final: boolean;
   }
}
