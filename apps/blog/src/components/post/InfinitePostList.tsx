'use client';

import { getMorePosts } from '@/app/actions';
import { Post } from '@/domain/post';
import { useEffect, useRef, useState } from 'react';
import { PostCard } from './PostCard';

interface InfinitePostListProps {
  initialPosts: Post[];
  initialCursor: string | null;
  emptyMessage?: string;
}

export function InfinitePostList({
  initialPosts,
  initialCursor,
  emptyMessage = '게시글이 없습니다.',
}: InfinitePostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // prop 변경 시 상태 동기화 (클라이언트 네비게이션 대응)
  useEffect(() => {
    setPosts(initialPosts);
    setCursor(initialCursor);
  }, [initialPosts, initialCursor]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && cursor && !isLoading) {
          setIsLoading(true);
          try {
            const { results, nextCursor } = await getMorePosts(cursor);
            setPosts((prev) => [...prev, ...results]);
            setCursor(nextCursor);
          } catch (error) {
            console.error('Failed to load more posts:', error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [cursor, isLoading]);

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
      <div ref={observerTarget} className="h-4 w-full flex justify-center p-4">
        {isLoading && <span className="loading loading-spinner loading-sm text-(--muted)">Loading...</span>}
      </div>
    </div>
  );
}
