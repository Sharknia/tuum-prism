'use client';

import { getMorePosts } from '@/app/actions';
import { Post } from '@/domain/post';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { PostCard } from './PostCard';

interface InfinitePostListProps {
  initialPosts: Post[];
  initialCursor: string | null;
  queryKey?: unknown[]; // 필터별 캐시 분리용
  emptyMessage?: string;
}

export function InfinitePostList({
  initialPosts,
  initialCursor,
  queryKey = ['posts'],
  emptyMessage = '게시글이 없습니다.',
}: InfinitePostListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      if (!pageParam) {
        // 첫 페이지는 initialData에서 제공
        return { results: initialPosts, nextCursor: initialCursor };
      }
      return getMorePosts(pageParam);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: {
      pages: [{ results: initialPosts, nextCursor: initialCursor }],
      pageParams: [null],
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유효
  });

  // Intersection Observer로 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.results) ?? [];

  if (allPosts.length === 0) {
    return (
      <div className="text-center py-16 bg-(--surface) rounded-lg border border-(--border)">
        <p className="text-(--muted)">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={observerTarget} className="h-4 w-full flex justify-center p-4">
        {isFetchingNextPage && (
          <span className="loading loading-spinner loading-sm text-(--muted)">
            Loading...
          </span>
        )}
      </div>
    </div>
  );
}

