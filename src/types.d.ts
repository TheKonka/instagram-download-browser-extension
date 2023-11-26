export type IconColor = 'white' | 'black';
export type IconClassName = 'newtab-btn' | 'download-btn';

declare namespace ReelsMedia {
   export interface Root {
      reels: Record<string, ReelsMedum>;
      reels_media: ReelsMedum[];
      status: string;
   }

   export interface User {
      pk: string;
      pk_id: string;
      full_name: string;
      is_private: boolean;
      strong_id__: string;
      username: string;
      is_verified: boolean;
      profile_pic_id?: string;
      profile_pic_url: string;
      friendship_status: FriendshipStatus;
      interop_messaging_user_fbid: number;
   }

   export interface FriendshipStatus {
      following: boolean;
      is_private: boolean;
      incoming_request: boolean;
      outgoing_request: boolean;
      is_bestie: boolean;
      is_restricted: boolean;
      is_feed_favorite: boolean;
   }

   export interface Item {
      taken_at: number;
      pk: string;
      id: string;
      caption_position: number;
      is_reel_media: boolean;
      is_terminal_video_segment: boolean;
      device_timestamp: number;
      client_cache_key: string;
      filter_type: number;
      caption_is_edited: boolean;
      like_and_view_counts_disabled: boolean;
      strong_id__: string;
      is_reshare_of_text_post_app_media_in_ig: boolean;
      is_post_live_clips_media: boolean;
      imported_taken_at?: number;
      deleted_reason: number;
      integrity_review_decision: string;
      has_shared_to_fb: number;
      expiring_at: number;
      is_unified_video: boolean;
      should_request_ads: boolean;
      is_visual_reply_commenter_notice_enabled: boolean;
      commerciality_status: string;
      explore_hide_comments: boolean;
      shop_routing_user_id: any;
      can_see_insights_as_brand: boolean;
      is_organic_product_tagging_eligible: boolean;
      likers: any[];
      media_type: number;
      code: string;
      caption: any;
      clips_tab_pinned_user_ids: any[];
      comment_inform_treatment: CommentInformTreatment;
      sharing_friction_info: SharingFrictionInfo;
      has_translation: boolean;
      accessibility_caption?: string;
      original_media_has_visual_reply_media: boolean;
      fb_user_tags: FbUserTags;
      invited_coauthor_producers: any[];
      can_viewer_save: boolean;
      is_in_profile_grid: boolean;
      profile_grid_control_enabled: boolean;
      is_comments_gif_composer_enabled: boolean;
      product_suggestions: any[];
      attribution_content_url?: string;
      image_versions2: ImageVersions2;
      original_width: number;
      original_height: number;
      enable_media_notes_production: boolean;
      product_type: string;
      is_paid_partnership: boolean;
      music_metadata: any;
      organic_tracking_token: string;
      ig_media_sharing_disabled: boolean;
      boost_unavailable_identifier: any;
      boost_unavailable_reason: any;
      open_carousel_submission_state: string;
      is_open_to_public_submission: boolean;
      has_delayed_metadata: boolean;
      is_auto_created: boolean;
      is_cutout_sticker_allowed: boolean;
      owner: Owner;
      is_dash_eligible?: number;
      video_dash_manifest?: string;
      video_codec?: string;
      number_of_qualities?: number;
      video_versions?: VideoVersion[];
      video_duration?: number;
      has_audio?: boolean;
      user: Owner;
      can_reshare: boolean;
      can_reply: boolean;
      can_send_prompt: boolean;
      is_first_take: boolean;
      is_rollcall_v2: boolean;
      is_superlative: boolean;
      is_fb_post_from_fb_story: boolean;
      can_play_spotify_audio: boolean;
      archive_story_deletion_ts: number;
      should_render_soundwave: boolean;
      created_from_add_yours_browsing: boolean;
      story_feed_media?: StoryFeedMedum[];
      has_liked: boolean;
      supports_reel_reactions: boolean;
      can_send_custom_emojis: boolean;
      show_one_tap_fb_share_tooltip: boolean;
      story_bloks_stickers?: StoryBloksSticker[];
   }

   export interface CommentInformTreatment {
      should_have_inform_treatment: boolean;
      text: string;
      url: any;
      action_type: any;
   }

   export interface SharingFrictionInfo {
      should_have_sharing_friction: boolean;
      bloks_app_url: any;
      sharing_friction_payload: any;
   }

   export interface FbUserTags {
      in: any[];
   }

   export interface ImageVersions2 {
      candidates: Candidate[];
   }

   export interface Candidate {
      width: number;
      height: number;
      url: string;
   }

   export interface Owner {
      pk: string;
      is_private: boolean;
   }

   export interface VideoVersion {
      type: number;
      width: number;
      height: number;
      url: string;
      id: string;
   }

   export interface StoryFeedMedum {
      x: number;
      y: number;
      z: number;
      width: number;
      height: number;
      rotation: number;
      is_pinned: number;
      is_hidden: number;
      is_sticker: number;
      is_fb_sticker: number;
      start_time_ms: number;
      end_time_ms: number;
      media_id: string;
      product_type: string;
      media_code: string;
      media_compound_str: string;
      clips_creation_entry_point: string;
   }

   export interface StoryBloksSticker {
      bloks_sticker: BloksSticker;
      x: number;
      y: number;
      z: number;
      width: number;
      height: number;
      rotation: number;
   }

   export interface BloksSticker {
      id: string;
      app_id: string;
      sticker_data: StickerData;
      bloks_sticker_type: string;
   }

   export interface StickerData {
      ig_mention: IgMention;
   }

   export interface IgMention {
      account_id: string;
      username: string;
      full_name: string;
      profile_pic_url: string;
   }

   export interface ReelsMedum {
      id: string;
      strong_id__: string;
      latest_reel_media: number;
      expiring_at: number;
      seen: number;
      can_reply: boolean;
      can_gif_quick_reply: boolean;
      can_reshare: boolean;
      can_react_with_avatar: boolean;
      reel_type: string;
      ad_expiry_timestamp_in_millis: any;
      is_cta_sticker_available: any;
      app_sticker_info: any;
      should_treat_link_sticker_as_cta: any;
      user: User;
      items: Item[];
      prefetch_count: number;
      media_count: number;
      media_ids: string[];
      is_cacheable: boolean;
      disabled_reply_types: string[];
   }
}
