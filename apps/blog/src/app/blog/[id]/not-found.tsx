import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="container-blog text-center">
        <h1 className="text-7xl font-bold text-blue-600 dark:text-blue-400 mb-6">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          포스트를 찾을 수 없습니다
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 삭제되었을 수 있습니다.
        </p>
        <Link href="/" className="btn btn-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
