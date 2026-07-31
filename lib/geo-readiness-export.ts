// GEO Readiness 결과 내보내기 — 마크다운 / HTML / DOCX
// 클라이언트에서 호출 (file-saver + docx 는 이미 프로젝트 의존성)

import {
  Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType, Packer,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ReadinessResult } from './geo-readiness';
import type { CepAuditResult } from './geo-cep-audit';
import { COVERAGE_LABEL } from './geo-cep-audit';

export interface ExportPayload {
  result: ReadinessResult;
  cep?: CepAuditResult | null;
}

function fileStem(url: string): string {
  let stem = 'geo-readiness';
  try {
    const u = new URL(url);
    stem = `geo-readiness-${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '').replace(/\//g, '-')}`;
  } catch { /* 기본값 유지 */ }
  return `${stem.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-').slice(0, 80)}-${new Date().toISOString().slice(0, 10)}`;
}

/* ────────────────────────────────────────── 마크다운 ────────── */

export function buildMarkdown({ result: r, cep }: ExportPayload): string {
  const L: string[] = [];
  L.push(`# GEO 인용 준비도 진단 보고서`, '');
  L.push(`- **대상 URL**: ${r.url}`);
  L.push(`- **측정 시각**: ${r.fetchedAt.slice(0, 19).replace('T', ' ')}`);
  L.push(`- **GEO Readiness Score**: **${r.score} / 100** — ${r.verdictLabel}`);
  L.push(`- **콘텐츠 점수**: ${r.contentScore} / 100 · **기술 점수**: ${r.technicalScore} / 100`);
  if (cep) L.push(`- **CEP 대응률**: ${cep.cepCoverageScore}% (${cep.ceps.length}개 진입점 기준)`);
  L.push('');

  if (r.notes.length) {
    L.push('## ⚠️ 측정 시 유의사항', '');
    r.notes.forEach(n => L.push(`- ${n}`));
    L.push('');
  }

  L.push('## ✅ 인용될 가능성이 높은 이유 Top 3', '');
  r.strengths.forEach((s, i) => L.push(`${i + 1}. **${s.title}** — ${s.detail}`));
  L.push('');

  L.push('## ❌ 인용되기 어려운 이유 Top 3', '');
  r.weaknesses.forEach((w, i) => {
    L.push(`${i + 1}. **${w.title}** — ${w.detail}`);
    L.push(`   - 처방: ${w.fix}`);
  });
  L.push('');

  L.push('## 📊 항목별 스코어카드', '');
  L.push('| 구분 | 항목 | 점수 | 가중치 |');
  L.push('|---|---|---:|---:|');
  r.checks.forEach(c => {
    L.push(`| ${c.group === 'content' ? '콘텐츠' : '기술'} | ${c.label} | ${c.score} | ${c.weight} |`);
  });
  L.push('');

  L.push('### 항목별 상세', '');
  r.checks.forEach(c => {
    L.push(`#### ${c.label} — ${c.score}점`);
    if (c.signals.length) { L.push('', '**감지된 신호**'); c.signals.forEach(s => L.push(`- ${s}`)); }
    if (c.gaps.length) { L.push('', '**부족한 점**'); c.gaps.forEach(g => L.push(`- ${g}`)); }
    L.push('', `**처방**: ${c.fix}`, '');
  });

  if (cep) {
    L.push('## 🎯 CEP(Category Entry Point) 진단', '');
    if (cep.summary) L.push(cep.summary, '');
    cep.ceps.forEach((c, i) => {
      L.push(`### CEP ${i + 1}. ${c.situation} — ${COVERAGE_LABEL[c.coverage]}`);
      L.push('');
      L.push(`- **누가**: ${c.who}`);
      L.push(`- **언제**: ${c.when}`);
      L.push(`- **왜**: ${c.why}`);
      if (c.constraint) L.push(`- **제약**: ${c.constraint}`);
      if (c.decisionCriteria.length) L.push(`- **선택 기준**: ${c.decisionCriteria.join(' / ')}`);
      if (c.likelyQuestions.length) {
        L.push('- **AI에게 물을 법한 질문**');
        c.likelyQuestions.forEach(q => L.push(`  - ${q}`));
      }
      L.push(`- **판정 근거**: ${c.coverageReason}`);
      if (c.rewrite) {
        L.push('', '**Before → After 재작성안**', '');
        L.push('```text');
        L.push(`[Before] ${c.rewrite.before}`);
        L.push(`[After ] ${c.rewrite.after}`);
        L.push('```');
        if (c.rewrite.evidenceNeeded.length) {
          L.push('', '**추가로 확보할 근거**');
          c.rewrite.evidenceNeeded.forEach(e => L.push(`- ${e}`));
        }
      }
      L.push('');
    });

    if (cep.qualitative.length) {
      L.push('### 정성 평가', '');
      cep.qualitative.forEach(q => {
        L.push(`- **[${q.severity.toUpperCase()}] ${q.title}** — ${q.detail}`);
        if (q.fix) L.push(`  - 처방: ${q.fix}`);
      });
      L.push('');
    }
    if (cep.improvedLead) {
      L.push('### 상황 중심으로 재작성한 도입부 (복사용)', '', '```text', cep.improvedLead, '```', '');
    }
  }

  L.push('## 📋 즉시 적용 스니펫', '');
  L.push('### 개선된 도입부', '', '```text', r.snippets.improvedLead, '```', '');
  L.push('### robots.txt', '', '```text', r.snippets.robotsTxt, '```', '');
  L.push('### JSON-LD', '', '```json', r.snippets.jsonLd, '```', '');
  L.push('### llms.txt', '', '```text', r.snippets.llmsTxt, '```', '');

  L.push('---', '', `_GEO-AIO 인용 준비도 진단 · ${new Date().toISOString().slice(0, 10)} · https://www.geo-aio.com_`);
  return L.join('\n');
}

export function downloadMarkdown(payload: ExportPayload) {
  const blob = new Blob([buildMarkdown(payload)], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${fileStem(payload.result.url)}.md`);
}

/* ────────────────────────────────────────── HTML ────────── */

function esc(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function buildHtml({ result: r, cep }: ExportPayload): string {
  const bar = (score: number) => {
    const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : score >= 40 ? '#ea580c' : '#e11d48';
    return `<div class="bar"><span style="width:${score}%;background:${color}"></span></div>`;
  };

  const checkRows = r.checks.map(c => `
    <tr>
      <td><span class="tag ${c.group}">${c.group === 'content' ? '콘텐츠' : '기술'}</span></td>
      <td><strong>${esc(c.label)}</strong>
        ${c.signals.length ? `<ul class="sig">${c.signals.map(s => `<li>✅ ${esc(s)}</li>`).join('')}</ul>` : ''}
        ${c.gaps.length ? `<ul class="gap">${c.gaps.map(g => `<li>⚠️ ${esc(g)}</li>`).join('')}</ul>` : ''}
        <p class="fix">💡 ${esc(c.fix)}</p>
      </td>
      <td class="num">${c.score}${bar(c.score)}</td>
      <td class="num">${c.weight}</td>
    </tr>`).join('');

  const cepSection = cep ? `
    <h2>🎯 CEP 진단 <span class="pill">대응률 ${cep.cepCoverageScore}%</span></h2>
    ${cep.summary ? `<p class="lead">${esc(cep.summary)}</p>` : ''}
    ${cep.ceps.map((c, i) => `
      <div class="cep ${c.coverage}">
        <h3>CEP ${i + 1}. ${esc(c.situation)} <span class="pill ${c.coverage}">${COVERAGE_LABEL[c.coverage]}</span></h3>
        <table class="kv">
          <tr><th>누가</th><td>${esc(c.who)}</td></tr>
          <tr><th>언제</th><td>${esc(c.when)}</td></tr>
          <tr><th>왜</th><td>${esc(c.why)}</td></tr>
          ${c.constraint ? `<tr><th>제약</th><td>${esc(c.constraint)}</td></tr>` : ''}
          ${c.decisionCriteria.length ? `<tr><th>선택 기준</th><td>${c.decisionCriteria.map(esc).join(' · ')}</td></tr>` : ''}
          ${c.likelyQuestions.length ? `<tr><th>예상 질문</th><td>${c.likelyQuestions.map(q => `“${esc(q)}”`).join('<br>')}</td></tr>` : ''}
          <tr><th>판정 근거</th><td>${esc(c.coverageReason)}</td></tr>
        </table>
        ${c.rewrite ? `
          <div class="ba">
            <div class="before"><span>Before</span><p>${esc(c.rewrite.before)}</p></div>
            <div class="after"><span>After</span><p>${esc(c.rewrite.after)}</p></div>
          </div>
          ${c.rewrite.evidenceNeeded.length ? `<p class="ev"><strong>추가할 근거:</strong> ${c.rewrite.evidenceNeeded.map(esc).join(' · ')}</p>` : ''}
        ` : ''}
      </div>`).join('')}
    ${cep.qualitative.length ? `
      <h3>정성 평가</h3>
      <ul class="qual">${cep.qualitative.map(q => `<li><span class="sev ${q.severity}">${q.severity}</span> <strong>${esc(q.title)}</strong> — ${esc(q.detail)}${q.fix ? `<br><em>처방: ${esc(q.fix)}</em>` : ''}</li>`).join('')}</ul>` : ''}
    ${cep.improvedLead ? `<h3>상황 중심 도입부 (복사용)</h3><pre>${esc(cep.improvedLead)}</pre>` : ''}
  ` : '';

  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GEO 인용 준비도 진단 — ${esc(r.url)}</title>
<style>
  :root{--ink:#1f2937;--muted:#6b7280;--line:#e5e7eb}
  *{box-sizing:border-box}
  body{font-family:"Malgun Gothic","Apple SD Gothic Neo",system-ui,sans-serif;color:var(--ink);line-height:1.7;max-width:960px;margin:0 auto;padding:32px 20px;background:#f9fafb}
  h1{font-size:26px;margin:0 0 4px}h2{font-size:20px;margin:32px 0 12px;padding-bottom:6px;border-bottom:2px solid #4f46e5}
  h3{font-size:16px;margin:20px 0 8px}
  .hero{background:#fff;border:1px solid var(--line);border-top:4px solid #4f46e5;border-radius:14px;padding:24px;margin-bottom:20px}
  .score{font-size:52px;font-weight:800;line-height:1;color:#4f46e5}
  .verdict{display:inline-block;font-size:14px;font-weight:700;padding:4px 12px;border-radius:999px;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe}
  .subs{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}
  .sub{flex:1;min-width:150px;background:#f3f4f6;border-radius:10px;padding:12px}
  .sub b{display:block;font-size:22px}
  .meta{font-size:12px;color:var(--muted);margin-top:10px;word-break:break-all}
  .cols{display:flex;gap:16px;flex-wrap:wrap}
  .col{flex:1;min-width:280px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px}
  .col.good{border-top:3px solid #059669}.col.bad{border-top:3px solid #e11d48}
  .col ol{margin:0;padding-left:20px}.col li{margin-bottom:10px;font-size:14px}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:13px}
  th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
  thead th{background:#f3f4f6;font-size:12px}
  td.num{text-align:right;font-weight:700;white-space:nowrap;width:90px}
  .bar{height:5px;background:#e5e7eb;border-radius:3px;margin-top:5px;overflow:hidden}.bar span{display:block;height:100%}
  .tag{font-size:11px;padding:2px 7px;border-radius:999px;white-space:nowrap}
  .tag.content{background:#ecfdf5;color:#047857}.tag.technical{background:#eef2ff;color:#4338ca}
  ul.sig,ul.gap{margin:6px 0;padding-left:16px;font-size:12px;color:var(--muted)}
  p.fix{margin:6px 0 0;font-size:12px;color:#4338ca}
  .pill{font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;background:#eef2ff;color:#3730a3;vertical-align:middle}
  .pill.sufficient{background:#ecfdf5;color:#047857}.pill.partial{background:#fffbeb;color:#b45309}.pill.missing{background:#fef2f2;color:#be123c}
  .cep{background:#fff;border:1px solid var(--line);border-left:4px solid #9ca3af;border-radius:12px;padding:16px;margin-bottom:14px}
  .cep.sufficient{border-left-color:#059669}.cep.partial{border-left-color:#d97706}.cep.missing{border-left-color:#e11d48}
  table.kv th{width:100px;background:#f9fafb;font-size:12px;color:var(--muted)}
  .ba{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}
  .ba>div{flex:1;min-width:240px;border-radius:10px;padding:12px;font-size:13px}
  .ba .before{background:#fef2f2;border:1px solid #fecdd3}.ba .after{background:#ecfdf5;border:1px solid #a7f3d0}
  .ba span{display:block;font-size:11px;font-weight:700;margin-bottom:4px;color:var(--muted)}
  .ba p{margin:0}
  .ev{font-size:12px;color:#b45309;margin-top:8px}
  ul.qual{list-style:none;padding:0}ul.qual li{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:8px;font-size:13px}
  .sev{font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:4px;background:#f3f4f6}
  .sev.high{background:#fef2f2;color:#be123c}.sev.medium{background:#fffbeb;color:#b45309}.sev.low{background:#f0f9ff;color:#0369a1}
  pre{background:#111827;color:#e5e7eb;padding:14px;border-radius:10px;overflow-x:auto;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all}
  .lead{font-size:14px;color:#374151}
  footer{margin-top:36px;font-size:12px;color:var(--muted);text-align:center}
  @media print{body{background:#fff}.hero,.col,table,.cep{break-inside:avoid}}
</style></head><body>
  <div class="hero">
    <h1>GEO 인용 준비도 진단</h1>
    <div class="meta">${esc(r.url)} · ${r.fetchedAt.slice(0, 19).replace('T', ' ')}</div>
    <div style="display:flex;align-items:baseline;gap:14px;margin-top:14px">
      <span class="score">${r.score}</span><span style="color:var(--muted)">/ 100</span>
      <span class="verdict">${r.verdictLabel}</span>
    </div>
    <div class="subs">
      <div class="sub"><span style="font-size:12px;color:var(--muted)">콘텐츠 (10항목)</span><b>${r.contentScore}</b>${bar(r.contentScore)}</div>
      <div class="sub"><span style="font-size:12px;color:var(--muted)">기술 (5항목)</span><b>${r.technicalScore}</b>${bar(r.technicalScore)}</div>
      ${cep ? `<div class="sub"><span style="font-size:12px;color:var(--muted)">CEP 대응률</span><b>${cep.cepCoverageScore}%</b>${bar(cep.cepCoverageScore)}</div>` : ''}
    </div>
    ${r.notes.length ? `<ul class="gap">${r.notes.map(n => `<li>⚠️ ${esc(n)}</li>`).join('')}</ul>` : ''}
  </div>

  <div class="cols">
    <div class="col good"><h3>✅ 인용될 가능성이 높은 이유</h3><ol>${r.strengths.map(s => `<li><strong>${esc(s.title)}</strong><br>${esc(s.detail)}</li>`).join('')}</ol></div>
    <div class="col bad"><h3>❌ 인용되기 어려운 이유</h3><ol>${r.weaknesses.map(w => `<li><strong>${esc(w.title)}</strong><br>${esc(w.detail)}<br><em style="color:#4338ca">💡 ${esc(w.fix)}</em></li>`).join('')}</ol></div>
  </div>

  <h2>📊 항목별 스코어카드</h2>
  <table><thead><tr><th>구분</th><th>항목 · 근거 · 처방</th><th class="num">점수</th><th class="num">가중치</th></tr></thead><tbody>${checkRows}</tbody></table>

  ${cepSection}

  <h2>📋 즉시 적용 스니펫</h2>
  <h3>개선된 도입부</h3><pre>${esc(r.snippets.improvedLead)}</pre>
  <h3>robots.txt</h3><pre>${esc(r.snippets.robotsTxt)}</pre>
  <h3>JSON-LD</h3><pre>${esc(r.snippets.jsonLd)}</pre>
  <h3>llms.txt</h3><pre>${esc(r.snippets.llmsTxt)}</pre>

  <footer>GEO-AIO 인용 준비도 진단 · ${new Date().toISOString().slice(0, 10)} · www.geo-aio.com</footer>
</body></html>`;
}

export function downloadHtml(payload: ExportPayload) {
  const blob = new Blob([buildHtml(payload)], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${fileStem(payload.result.url)}.html`);
}

/* ────────────────────────────────────────── DOCX ────────── */

function p(text: string, opts: { bold?: boolean; size?: number; color?: string; after?: number; before?: number } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: opts.after ?? 100, before: opts.before ?? 0 },
    children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 22, color: opts.color ?? '374151' })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, color: '4b5563' })],
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '4f46e5' } },
    children: [new TextRun({ text, bold: true, size: 30, color: '1e40af' })],
  });
}

function h3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: '374151' })],
  });
}

function cell(text: string, opts: { bold?: boolean; shade?: string; width?: number; align?: typeof AlignmentType.RIGHT } = {}): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade, color: 'auto' } : undefined,
    children: [new Paragraph({
      alignment: opts.align,
      children: [new TextRun({ text, bold: opts.bold, size: 19, color: '374151' })],
    })],
  });
}

function codeBlock(text: string): Paragraph[] {
  return text.split('\n').map(line => new Paragraph({
    spacing: { after: 0 },
    shading: { type: ShadingType.CLEAR, fill: 'f3f4f6', color: 'auto' },
    children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 17, color: '111827' })],
  }));
}

export async function downloadDocx(payload: ExportPayload) {
  const { result: r, cep } = payload;
  const children: (Paragraph | Table)[] = [];

  children.push(new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'GEO 인용 준비도 진단 보고서', bold: true, size: 44, color: '1e3a5f' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
    children: [new TextRun({ text: `${r.url} · ${r.fetchedAt.slice(0, 10)}`, size: 20, color: '6b7280' })],
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: `${r.score} / 100`, bold: true, size: 56, color: '4f46e5' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: r.verdictLabel, bold: true, size: 26, color: '3730a3' })],
  }));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        cell('콘텐츠 점수', { bold: true, shade: 'f3f4f6', width: 34 }),
        cell('기술 점수', { bold: true, shade: 'f3f4f6', width: 33 }),
        cell('CEP 대응률', { bold: true, shade: 'f3f4f6', width: 33 }),
      ] }),
      new TableRow({ children: [
        cell(`${r.contentScore} / 100`),
        cell(`${r.technicalScore} / 100`),
        cell(cep ? `${cep.cepCoverageScore}%` : '미측정'),
      ] }),
    ],
  }));

  if (r.notes.length) {
    children.push(h2('⚠️ 측정 시 유의사항'));
    r.notes.forEach(n => children.push(bullet(n)));
  }

  children.push(h2('✅ 인용될 가능성이 높은 이유 Top 3'));
  r.strengths.forEach((s, i) => {
    children.push(p(`${i + 1}. ${s.title}`, { bold: true, after: 40 }));
    children.push(bullet(s.detail));
  });

  children.push(h2('❌ 인용되기 어려운 이유 Top 3'));
  r.weaknesses.forEach((w, i) => {
    children.push(p(`${i + 1}. ${w.title}`, { bold: true, after: 40 }));
    children.push(bullet(w.detail));
    children.push(bullet(`처방: ${w.fix}`));
  });

  children.push(h2('📊 항목별 스코어카드'));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        cell('구분', { bold: true, shade: 'e0e7ff', width: 12 }),
        cell('항목', { bold: true, shade: 'e0e7ff', width: 46 }),
        cell('점수', { bold: true, shade: 'e0e7ff', width: 12, align: AlignmentType.RIGHT }),
        cell('가중치', { bold: true, shade: 'e0e7ff', width: 12, align: AlignmentType.RIGHT }),
        cell('처방', { bold: true, shade: 'e0e7ff', width: 18 }),
      ] }),
      ...r.checks.map(c => new TableRow({ children: [
        cell(c.group === 'content' ? '콘텐츠' : '기술'),
        cell(c.label),
        cell(String(c.score), { bold: true, align: AlignmentType.RIGHT }),
        cell(String(c.weight), { align: AlignmentType.RIGHT }),
        cell(c.fix),
      ] })),
    ],
  }));

  children.push(h3('항목별 상세'));
  r.checks.forEach(c => {
    children.push(p(`${c.label} — ${c.score}점`, { bold: true, size: 22, color: '1e40af', before: 160, after: 60 }));
    c.signals.forEach(s => children.push(bullet(`✅ ${s}`)));
    c.gaps.forEach(g => children.push(bullet(`⚠️ ${g}`)));
    children.push(bullet(`💡 ${c.fix}`));
  });

  if (cep) {
    children.push(h2(`🎯 CEP 진단 (대응률 ${cep.cepCoverageScore}%)`));
    if (cep.summary) children.push(p(cep.summary, { after: 160 }));
    cep.ceps.forEach((c, i) => {
      children.push(p(`CEP ${i + 1}. ${c.situation} — ${COVERAGE_LABEL[c.coverage]}`, { bold: true, size: 22, color: '1e40af', before: 200, after: 80 }));
      children.push(bullet(`누가: ${c.who}`));
      children.push(bullet(`언제: ${c.when}`));
      children.push(bullet(`왜: ${c.why}`));
      if (c.constraint) children.push(bullet(`제약: ${c.constraint}`));
      if (c.decisionCriteria.length) children.push(bullet(`선택 기준: ${c.decisionCriteria.join(' / ')}`));
      c.likelyQuestions.forEach(q => children.push(bullet(`예상 질문: “${q}”`)));
      children.push(bullet(`판정 근거: ${c.coverageReason}`));
      if (c.rewrite) {
        children.push(p('Before → After', { bold: true, size: 20, color: '6b7280', before: 100, after: 40 }));
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [cell('Before', { bold: true, shade: 'fee2e2', width: 16 }), cell(c.rewrite.before, { width: 84 })] }),
            new TableRow({ children: [cell('After', { bold: true, shade: 'd1fae5', width: 16 }), cell(c.rewrite.after, { width: 84 })] }),
          ],
        }));
        c.rewrite.evidenceNeeded.forEach(e => children.push(bullet(`추가할 근거: ${e}`)));
      }
    });

    if (cep.qualitative.length) {
      children.push(h3('정성 평가'));
      cep.qualitative.forEach(q => {
        children.push(p(`[${q.severity.toUpperCase()}] ${q.title}`, { bold: true, after: 40 }));
        children.push(bullet(q.detail));
        if (q.fix) children.push(bullet(`처방: ${q.fix}`));
      });
    }
    if (cep.improvedLead) {
      children.push(h3('상황 중심 도입부 (복사용)'));
      children.push(...codeBlock(cep.improvedLead));
    }
  }

  children.push(h2('📋 즉시 적용 스니펫'));
  children.push(h3('개선된 도입부'));
  children.push(...codeBlock(r.snippets.improvedLead));
  children.push(h3('robots.txt'));
  children.push(...codeBlock(r.snippets.robotsTxt));
  children.push(h3('JSON-LD'));
  children.push(...codeBlock(r.snippets.jsonLd));
  children.push(h3('llms.txt'));
  children.push(...codeBlock(r.snippets.llmsTxt));

  const doc = new Document({
    styles: { default: { document: { run: { font: '맑은 고딕', size: 22 } } } },
    sections: [{ properties: {}, children }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileStem(r.url)}.docx`);
}
