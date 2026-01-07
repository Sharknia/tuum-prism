import type { Post } from '@/domain/post';
import { PostCard } from './PostCard';

interface PostListProps {
  posts: Post[];
  emptyMessage?: string;
}

export function PostList({
  posts,
  emptyMessage = '게시글이 없습니다.',
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 bg-(--surface) rounded-lg border border-(--border)">
        <p className="text-(--muted)">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
