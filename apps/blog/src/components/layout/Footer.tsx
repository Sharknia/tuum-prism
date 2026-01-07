export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-(--border) bg-(--surface)">
      <div className="container-blog py-8 text-center">
        <p className="text-sm text-(--muted)">
          © {currentYear} Tuum Prism. All rights reserved.
        </p>
        <p className="mt-2 text-xs text-(--muted)">
          Built with{' '}
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-(--accent)"
          >
            Next.js
          </a>
          {' · '}
          <a
            href="https://notion.so"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-(--accent)"
          >
            Notion
          </a>
        </p>
      </div>
    </footer>
  );
}
