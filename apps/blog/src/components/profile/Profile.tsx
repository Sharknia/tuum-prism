import { siteConfig } from '@/config/site.config';
import { cn } from '@/lib/utils'; // Assuming cn utility exists in lib/utils
import Image from 'next/image';
import Link from 'next/link';
import { SocialIcons } from './SocialIcons';

interface ProfileProps {
  className?: string;
  variant?: 'main-header' | 'article-footer';
}

export function Profile({ className, variant = 'main-header' }: ProfileProps) {
  const { owner } = siteConfig;

  // 소셜 링크 렌더링 헬퍼
  const renderSocialLinks = () => {
    const { social } = owner;
    if (!social) return null;

    return (
      <div className="flex items-center gap-3 mt-3">
        {social.github && (
          <Link
            href={social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="!text-[var(--muted)] hover:!text-[var(--foreground)] transition-colors"
          >
            <SocialIcons.github className="w-5 h-5 fill-current" />
          </Link>
        )}
        {social.linkedin && (
          <Link
            href={social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="!text-[var(--muted)] hover:!text-[var(--foreground)] transition-colors"
          >
            <SocialIcons.linkedin className="w-5 h-5 fill-current" />
          </Link>
        )}
        {social.x && (
          <Link
            href={social.x}
            target="_blank"
            rel="noopener noreferrer"
            className="!text-[var(--muted)] hover:!text-[var(--foreground)] transition-colors"
          >
            <SocialIcons.twitter className="w-5 h-5 fill-current" />
          </Link>
        )}
        {social.threads && (
          <Link
            href={social.threads}
            target="_blank"
            rel="noopener noreferrer"
            className="!text-[var(--muted)] hover:!text-[var(--foreground)] transition-colors"
          >
            <SocialIcons.threads className="w-5 h-5 fill-current" />
          </Link>
        )}
        {social.email && (
          <Link
            href={`mailto:${social.email}`}
            className="!text-[var(--muted)] hover:!text-[var(--foreground)] transition-colors"
          >
            <SocialIcons.email className="w-5 h-5 fill-current" />
          </Link>
        )}
      </div>
    );
  };

  // 메인 페이지 헤더 스타일
  if (variant === 'main-header') {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
            <Image
              src={owner.avatar}
              alt={owner.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {owner.name}
            </h1>
            <p className="mt-1 text-lg text-[var(--muted)]">
              {owner.description}
            </p>
            {renderSocialLinks()}
          </div>
        </div>
      </div>
    );
  }

  // 상세 페이지 하단 스타일
  return (
    <div
      className={cn(
        'flex items-center gap-4 py-6 mt-12 border-t border-[var(--border)]',
        className
      )}
    >
      <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
        <Image
          src={owner.avatar}
          alt={owner.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-col">
        <div className="font-semibold text-lg">{owner.name}</div>
        <p className="text-[var(--muted)] text-sm">{owner.description}</p>
        {renderSocialLinks()}
      </div>
    </div>
  );
}
