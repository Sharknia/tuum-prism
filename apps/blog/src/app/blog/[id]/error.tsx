'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="container-blog text-center">
        <h1 className="text-7xl font-bold text-red-500 dark:text-red-400 mb-6">
          오류
        </h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          서버에서 문제가 발생했습니다
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto">
          잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left text-sm overflow-auto max-w-2xl mx-auto border border-gray-200 dark:border-gray-700">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}
        <button onClick={reset} className="btn btn-primary">
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
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          다시 시도
        </button>
      </div>
    </div>
  );
}
