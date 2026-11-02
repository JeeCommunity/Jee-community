import React from 'react';

const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<]+)/gi;

export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function splitTrailingPunctuation(rawMatch: string): { cleanUrl: string; trailing: string } {
  let cleanUrl = rawMatch;
  let trailing = '';

  while (cleanUrl.length > 0) {
    const lastChar = cleanUrl[cleanUrl.length - 1];
    if (/[.,!?;:'"]/.test(lastChar)) {
      trailing = lastChar + trailing;
      cleanUrl = cleanUrl.slice(0, -1);
    } else if (lastChar === ')') {
      const openCount = (cleanUrl.match(/\(/g) || []).length;
      const closeCount = (cleanUrl.match(/\)/g) || []).length;
      if (closeCount > openCount) {
        trailing = lastChar + trailing;
        cleanUrl = cleanUrl.slice(0, -1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { cleanUrl, trailing };
}

export interface LinkifyOptions {
  linkClassName?: string;
}

export function renderTextWithLinks(
  text: string | null | undefined,
  options?: LinkifyOptions
): React.ReactNode {
  if (!text) return null;

  const defaultClass =
    options?.linkClassName ||
    'text-blue-600 dark:text-blue-400 hover:underline font-medium break-all cursor-pointer';

  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    if (!part) return null;

    if (/^(?:https?:\/\/|www\.)/i.test(part)) {
      const { cleanUrl, trailing } = splitTrailingPunctuation(part);
      if (!cleanUrl) return <React.Fragment key={index}>{part}</React.Fragment>;

      const href = normalizeUrl(cleanUrl);
      return (
        <React.Fragment key={index}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={defaultClass}
          >
            {cleanUrl}
          </a>
          {trailing}
        </React.Fragment>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function LinkifyText({
  text,
  linkClassName,
}: {
  text: string | null | undefined;
  linkClassName?: string;
}) {
  return <>{renderTextWithLinks(text, { linkClassName })}</>;
}
