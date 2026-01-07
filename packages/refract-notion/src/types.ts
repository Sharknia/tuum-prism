import type { BlockObjectResponse, PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type NotionBlock = BlockObjectResponse & {
  children?: NotionBlock[];
};

export type AnyBlock = BlockObjectResponse | PartialBlockObjectResponse;
