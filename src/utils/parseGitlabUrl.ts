export interface ParsedGitlabUrl {
  group: string;
  repo: string;
  branch: string;
  path: string;
}

const GITLAB_URL_RE = /^https:\/\/[^/]+\/([^/]+)\/([^/]+)\/-\/blob\/([^/]+)\/(.+)$/;

export function parseGitlabUrl(url: string): ParsedGitlabUrl | null {
  const match = GITLAB_URL_RE.exec(url.trim());
  if (!match) return null;
  const [, group, repo, branch, path] = match;
  return { group, repo, branch, path };
}
