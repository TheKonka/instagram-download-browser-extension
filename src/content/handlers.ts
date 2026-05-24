import { PostPageHandler } from './post';
import { StoriesPageHandler } from './stories';
import { ReelsPageHandler } from './reels';
import { ReelPageHandler } from './profile-reel';
import { ProfilePageHandler } from './profile';
import { IconColor } from '../types/global';
import { FeedPageHandler } from "./homefeed";
import { ThreadsPageHandler } from "./threads";

export interface PageHandler {
    match(url: URL, pathnameList: string[]): boolean;

    process(iconColor: IconColor): void;

    onCustomButtonClick(target: HTMLAnchorElement): Promise<any>;
}


export const registeredHandlers: PageHandler[] = [
    new ThreadsPageHandler(),
    new PostPageHandler(),
    new FeedPageHandler(),
    new StoriesPageHandler(),
    new ReelsPageHandler(),
    new ReelPageHandler(),
    new ProfilePageHandler()
];
