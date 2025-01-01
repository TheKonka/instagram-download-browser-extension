export namespace ProfileReel {
   export interface Root {
      data: Data;
      extensions: Extensions;
      status: string;
   }

   export interface Data {
      xdt_api__v1__clips__user__connection_v2: XdtApiV1ClipsUserConnectionV2;
      xdt_viewer: XdtViewer;
   }

   export interface XdtApiV1ClipsUserConnectionV2 {
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
      pk: string;
      id: string;
      code: string;
      media_overlay_info: any;
      media_type: number;
      user: User;
      video_versions?: VideoVersion[];
      carousel_media: any;
      image_versions2: ImageVersions2;
      preview: any;
      product_type: string;
      play_count: any;
      view_count?: number;
      like_and_view_counts_disabled: boolean;
      comment_count: number;
      like_count: number;
      audience: any;
      clips_tab_pinned_user_ids: any[];
      original_height: number;
      original_width: number;
   }

   export interface User {
      pk: string;
      id: string;
   }

   export interface VideoVersion {
      url: string;
      type: number;
   }

   export interface ImageVersions2 {
      candidates: Candidate[];
   }

   export interface Candidate {
      height: number;
      url: string;
      width: number;
   }

   export interface PageInfo {
      end_cursor: string;
      has_next_page: boolean;
      has_previous_page: boolean;
      start_cursor: any;
   }

   export interface XdtViewer {
      user: User2;
   }

   export interface User2 {
      id: string;
   }

   export interface Extensions {
      is_final: boolean;
   }
}
