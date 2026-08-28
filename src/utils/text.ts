export interface InlineLinkParts {
  beforeLink: string;
  linkLabel: string | null;
  linkHref: string | null;
  afterLink: string;
}

// Splits a single "[link text](href)" markdown link out of a plain text string.
export function parseInlineLink(text: string): InlineLinkParts {
  const match = text.match(/\[([^\]]+)\]\(([^)]+)\)/);

  if (!match) {
    return { beforeLink: text, linkLabel: null, linkHref: null, afterLink: "" };
  }

  return {
    beforeLink: text.slice(0, match.index),
    linkLabel: match[1],
    linkHref: match[2],
    afterLink: text.slice(match.index! + match[0].length)
  };
}
