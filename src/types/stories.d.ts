export namespace Stories {
   export interface Root {
      data: Data;
      extensions: Extensions;
   }

   export interface Data {
      xdt_viewer: XdtViewer;
      xdt_api__v1__feed__reels_media: XdtApiV1FeedReelsMedia;
   }

   export interface XdtViewer {
      user: User;
   }

   export interface User {
      pk: string;
      id: string;
      can_see_organic_insights: boolean;
   }

   export interface XdtApiV1FeedReelsMedia {
      reels_media: ReelsMedum[];
   }

   export interface ReelsMedum {
      id: string;
      items: Item[];
      user: User3;
      seen: number;
      cover_media: any;
      title: any;
      reel_type: string;
   }

   export interface Item {
      pk: string;
      id: string;
      viewer_count: any;
      video_duration?: number;
      media_type: number;
      taken_at: number;
      story_cta: any;
      user: User2;
      has_liked: boolean;
      sharing_friction_info: SharingFrictionInfo;
      media_overlay_info: any;
      image_versions2: ImageVersions2;
      accessibility_caption?: string;
      organic_tracking_token: string;
      is_dash_eligible?: number;
      number_of_qualities?: number;
      video_dash_manifest?: string;
      video_versions?: VideoVersion[];
      boosted_status: any;
      original_width: number;
      original_height: number;
      story_countdowns: any;
      story_questions: any;
      story_sliders: any;
      preview: any;
      boost_unavailable_identifier: any;
      boost_unavailable_reason: any;
      product_type: string;
      audience: any;
      can_viewer_reshare: any;
      expiring_at: number;
      ig_media_sharing_disabled: boolean;
      story_music_stickers: any;
      carousel_media_count: any;
      carousel_media: any;
      visual_comment_reply_sticker_info: any;
      // story_bloks_stickers: any;
      // story_link_stickers: any;
      // story_hashtags: any;
      // story_locations?: StoryLocation[];
      // story_feed_media?: StoryFeedMedum[];
      // text_post_share_to_ig_story_stickers: any;
      // is_paid_partnership: boolean;
      // sponsor_tags: any;
      // reshared_story_media_author: any;
      // story_app_attribution?: StoryAppAttribution;
      // has_translation: boolean;
      // can_see_insights_as_brand: boolean;
      // viewers: any;
      // can_reply: boolean;
      // can_reshare: boolean;
      // has_audio?: boolean;
      // inventory_source: any;
      // __typename: string;
   }

   export interface User2 {
      pk: string;
      id: any;
      interop_messaging_user_fbid: any;
      is_private: boolean;
      profile_pic_url: any;
      username: any;
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

   export interface StoryLocation {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      location: Location;
      id: any;
   }

   export interface Location {
      pk: number;
   }

   export interface StoryFeedMedum {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      media_code: string;
      id: any;
      product_type: string;
   }

   export interface StoryAppAttribution {
      app_action_text: string;
      app_icon_url: string;
      name: string;
      content_url: string;
      link: any;
      id: string;
   }

   export interface User3 {
      username: string;
      id: any;
      pk: string;
      profile_pic_url: string;
      interop_messaging_user_fbid: string;
      is_private: boolean;
      is_verified: boolean;
      friendship_status: FriendshipStatus;
   }

   export interface FriendshipStatus {
      following: boolean;
   }

   export interface Extensions {
      is_final: boolean;
   }
}
