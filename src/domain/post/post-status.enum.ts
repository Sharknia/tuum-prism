export const PostStatus = {
  Writing: 'Writing',
  Ready: 'Ready',
  Updated: 'Updated',
  ToBeDeleted: 'ToBeDeleted',
  Deleted: 'Deleted',
  Error: 'Error',
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];
