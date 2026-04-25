// 콘텐츠 마크다운의 마지막 해시태그 라인 직전에 홈페이지·블로그 링크 블록을 삽입.
// homepage_url, blog_url이 모두 없으면 원본 그대로 반환 (no-op).

export interface ProjectLinkInfo {
  homepage_url?: string | null;
  blog_url?: string | null;
  company_name?: string | null;
}

const HASHTAG_LINE = /^\s*#[가-힣A-Za-z0-9_][^\n]*$/;

export function injectProjectLinks(content: string, project?: ProjectLinkInfo | null): string {
  if (!content) return content;
  const homepage = project?.homepage_url?.trim();
  const blog = project?.blog_url?.trim();
  if (!homepage && !blog) return content;

  // 이미 삽입된 경우 중복 방지
  if (content.includes('<!-- project-links -->')) return content;

  const lines = content.split('\n');

  // 마지막 해시태그 라인 위치 찾기 (역방향 검색)
  let hashtagIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (!t) continue;
    // 마크다운 헤더(##, ###...)는 제외하고 단일 # 시작 라인만
    if (HASHTAG_LINE.test(t) && !t.startsWith('## ') && !t.startsWith('### ')) {
      hashtagIdx = i;
      break;
    }
    // 본문에 들어왔는데 해시태그 못 찾으면 끝까지 진행
  }

  const block: string[] = [];
  block.push('');
  block.push('<!-- project-links -->');
  block.push('---');
  block.push('');
  if (project?.company_name) {
    block.push(`**📍 ${project.company_name} 더 알아보기**`);
    block.push('');
  }
  if (homepage) block.push(`- 🌐 **홈페이지**: [${homepage}](${homepage})`);
  if (blog) block.push(`- 📝 **블로그**: [${blog}](${blog})`);
  block.push('');
  block.push('---');
  block.push('');

  if (hashtagIdx >= 0) {
    lines.splice(hashtagIdx, 0, ...block);
  } else {
    // 해시태그가 없으면 끝에 추가
    lines.push(...block);
  }
  return lines.join('\n');
}
