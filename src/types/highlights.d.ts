export namespace Highlight {
   export interface Root {
      data: Data;
      extensions: Extensions;
      status: string;
   }

   export interface Data {
      xdt_api__v1__feed__reels_media__connection: XdtApiV1FeedReelsMediaConnection;
   }

   export interface XdtApiV1FeedReelsMediaConnection {
      edges: Edge[];
      page_info: PageInfo;
   }

   export interface Edge {
      node: Node;
      cursor: string;
   }

   export interface Node {
      id: string;
      items: Item[];
      user: User2;
      reel_type: string;
      cover_media: CoverMedia;
      title: string;
      seen: any;
      __typename: string;
   }

   export interface Item {
      pk: string;
      id: string;
      viewer_count: any;
      video_duration?: number;
      media_type: number;
      audience: any;
      taken_at: number;
      story_cta: any;
      user: User;
      has_liked: boolean;
      viewers: any;
      sharing_friction_info: SharingFrictionInfo;
      can_viewer_reshare: any;
      expiring_at: any;
      ig_media_sharing_disabled: boolean;
      product_type: string;
      media_overlay_info: any;
      image_versions2: ImageVersions2;
      can_reply: boolean;
      can_reshare: boolean;
      has_audio?: boolean;
      story_music_stickers: any;
      carousel_media_count: any;
      carousel_media: any;
      accessibility_caption?: string;
      original_width: number;
      original_height: number;
      organic_tracking_token: string;
      is_dash_eligible?: number;
      number_of_qualities?: number;
      video_dash_manifest?: string;
      video_versions?: VideoVersion[];
      visual_comment_reply_sticker_info: any;
      story_bloks_stickers?: StoryBloksSticker[];
      story_link_stickers: any;
      story_hashtags?: StoryHashtag[];
      story_locations: any;
      story_feed_media: any;
      text_post_share_to_ig_story_stickers: any;
      story_countdowns: any;
      story_questions: any;
      story_sliders: any;
      preview: any;
      is_paid_partnership: boolean;
      sponsor_tags: any;
      reshared_story_media_author: any;
      story_app_attribution: any;
      has_translation: boolean;
      boosted_status: any;
      can_see_insights_as_brand: boolean;
      boost_unavailable_identifier: any;
      boost_unavailable_reason: any;
      inventory_source: any;
      __typename: string;
   }

   export interface User {
      pk: string;
      id: any;
      is_private: boolean;
      profile_pic_url: any;
      username: any;
      interop_messaging_user_fbid: any;
   }

   export interface SharingFrictionInfo {
      should_have_sharing_friction: boolean;
      bloks_app_url: any;
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

   export interface StoryBloksSticker {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      bloks_sticker: BloksSticker;
      id: any;
   }

   export interface BloksSticker {
      sticker_data: StickerData;
      id: string;
   }

   export interface StickerData {
      ig_mention: IgMention;
   }

   export interface IgMention {
      full_name: string;
      username: string;
   }

   export interface StoryHashtag {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      hashtag: Hashtag;
      id: any;
   }

   export interface Hashtag {
      name: string;
      id: string;
   }

   export interface User2 {
      interop_messaging_user_fbid: string;
      id: any;
      pk: string;
      friendship_status: any;
      username: string;
      is_private: boolean;
      profile_pic_url: string;
      is_verified: boolean;
   }

   export interface CoverMedia {
      cropped_image_version: CroppedImageVersion;
      full_image_version: any;
   }

   export interface CroppedImageVersion {
      url: string;
   }

   export interface PageInfo {
      end_cursor: string;
      has_next_page: boolean;
      has_previous_page: boolean;
      start_cursor: string;
   }

   export interface Extensions {
      is_final: boolean;
   }
}
