// 콘텐츠 마크다운의 마지막 해시태그 라인 직전에 홈페이지·블로그 링크 블록을 삽입.
// homepage_url, blog_url이 모두 없으면 원본 그대로 반환 (no-op).
//
// ⚠️ 잘림 보호:
//  - 응답이 종결 부호로 안 끝나면(잘렸을 가능성) 광고 블록을 추가하지 않고 원본 반환
//  - 이미 광고 블록 마커가 있으면 중복 삽입 방지
//  - 광고 블록은 항상 본문 맨 끝(해시태그 직전)에만 삽입, 본문 중간 절대 금지

export interface ProjectLinkInfo {
  homepage_url?: string | null;
  blog_url?: string | null;
  company_name?: string | null;
}

const HASHTAG_LINE = /^\s*#[가-힣A-Za-z0-9_][^\n]*$/;

// 응답이 정상 종결됐는지 검사 (마침표·물음표·느낌표·닫는 괄호·인용부호·해시태그·표 종료 등)
function isContentComplete(content: string): boolean {
  const trimmed = content.trimEnd();
  if (!trimmed) return false;
  const last = trimmed.slice(-1);
  // 한글·영문 종결 부호 + 마크다운 안전 종결 문자
  if (/[.。?!？！)）"'』」\]]/.test(last)) return true;
  // 마지막 라인이 해시태그면 정상 종결로 간주
  const lastLine = trimmed.split('\n').pop()?.trim() || '';
  if (HASHTAG_LINE.test(lastLine) && !lastLine.startsWith('## ') && !lastLine.startsWith('### ')) {
    return true;
  }
  // 마지막 라인이 표(|)로 끝나면 표 종료 가능성 → 통과
  if (/^\|.*\|$/.test(lastLine)) return true;
  return false;
}

// 이미 광고 블록이 들어가 있는지 검사 (마커·회사명·홈페이지 URL 중 하나라도 발견되면 중복)
function hasExistingAdBlock(content: string, project?: ProjectLinkInfo | null): boolean {
  if (content.includes('<!-- project-links -->')) return true;
  // "📍 ... 더 알아보기" 형태가 본문에 이미 있으면 중복
  if (/📍\s*.+더\s*알아보기/.test(content)) return true;
  const homepage = project?.homepage_url?.trim();
  if (homepage && content.includes(homepage)) return true;
  const blog = project?.blog_url?.trim();
  if (blog && content.includes(blog)) return true;
  return false;
}

/**
 * 콘텐츠에서 광고 블록(project-links)과 trailing 해시태그 라인을 모두 제거.
 * 이어쓰기(continueGeneration) 합치기 직전에 호출해 광고/해시태그가 본문 중간에
 * 끼어들거나 누적되는 사고를 방지.
 */
export function stripProjectLinks(content: string): string {
  if (!content) return content;
  let out = content;

  // 1) 마커가 있는 광고 블록: <!-- project-links --> 부터 다음 --- 라인까지
  out = out.replace(/\n*<!-- project-links -->[\s\S]*?\n-{3,}\s*(?=\n|$)/g, '');

  // 2) 마커가 없는 광고 블록 (LLM이 직접 만들었거나 구버전):
  //    --- + (빈줄) + 📍 ... 더 알아보기 + ... + --- 패턴
  out = out.replace(
    /\n*-{3,}\s*\n+\s*\*?\*?\s*📍[^\n]*?더\s*알아보기[^\n]*\*?\*?[\s\S]*?\n-{3,}\s*(?=\n|$)/g,
    ''
  );

  // 3) trailing 해시태그 라인 제거 (이어쓰기 시 새 응답이 자연스럽게 이어지게)
  out = out.replace(/\n+\s*#[가-힣A-Za-z0-9_][^\n]*(?:\n\s*#[가-힣A-Za-z0-9_][^\n]*)*\s*$/m, '');

  return out.trimEnd();
}

export function injectProjectLinks(content: string, project?: ProjectLinkInfo | null): string {
  if (!content) return content;
  const homepage = project?.homepage_url?.trim();
  const blog = project?.blog_url?.trim();
  if (!homepage && !blog) return content;

  // 1) 중복 방지: 이미 삽입돼 있으면 그대로 반환
  if (hasExistingAdBlock(content, project)) return content;

  // 2) 잘림 감지: 응답이 잘렸을 가능성이 있으면 광고 블록 추가 금지 (원본 그대로 반환)
  //    이중 잘림(본문+광고 블록 둘 다 잘림) 사고를 방지하기 위함
  if (!isContentComplete(content)) {
    return content;
  }

  const lines = content.split('\n');

  // 3) 마지막 해시태그 라인 위치 찾기 (역방향 검색)
  let hashtagIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (!t) continue;
    // 마크다운 헤더(##, ###...)는 제외하고 단일 # 시작 라인만
    if (HASHTAG_LINE.test(t) && !t.startsWith('## ') && !t.startsWith('### ')) {
      hashtagIdx = i;
      break;
    }
    // 본문 라인에 도달하면 더 위쪽에 해시태그가 있을 수 있으므로 계속 진행
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

  // 4) 항상 본문 맨 끝(해시태그 직전)에만 삽입. 중간 삽입 절대 금지.
  if (hashtagIdx >= 0) {
    lines.splice(hashtagIdx, 0, ...block);
  } else {
    // 해시태그가 없으면 끝에 추가
    lines.push(...block);
  }
  return lines.join('\n');
}
