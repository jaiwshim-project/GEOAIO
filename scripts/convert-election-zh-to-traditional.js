// election-2026 page.tsx의 중국어 영역(zh: { ... })을 OpenCC로 간체→번체 변환
// 마커: '// ============ 중국어 (간체) ============'  ~  '// ============ 일본어 ============'
const fs = require('fs');
const path = require('path');
const OpenCC = require('opencc-js');

const FILE = path.resolve(__dirname, '..', 'app', 'proposal', 'election-2026', 'page.tsx');
const START_MARKER = '// ============ 중국어 (간체) ============';
const END_MARKER = '// ============ 일본어 ============';

const converter = OpenCC.Converter({ from: 'cn', to: 'twp' });

const src = fs.readFileSync(FILE, 'utf8');
const startIdx = src.indexOf(START_MARKER);
const endIdx = src.indexOf(END_MARKER);
if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
  console.error('마커를 찾지 못함. start=', startIdx, 'end=', endIdx);
  process.exit(1);
}

const before = src.slice(0, startIdx);
const middle = src.slice(startIdx, endIdx);
const after = src.slice(endIdx);

// 중간 영역 안의 한자(CJK)만 변환 — 영문·키 이름·따옴표·점 등은 보존
// JS 문자열 리터럴 안의 한자만 변환되도록 OpenCC를 전체 적용
// (코드 키 이름은 영문이므로 영향 없음, 한국어 키(예: '부산-북구갑')만 주의 필요)
//
// 다만 한국어가 들어간 키(`'부산-북구갑': '...'`)의 좌측 키 부분도 한국어라
// OpenCC 변환에 영향 없음 (한국어 한자는 OpenCC가 건드리지 않음 — 한글이라).
// 따라서 단순히 middle 전체를 converter에 통과시켜도 안전.
const converted = converter(middle);

// 마커 자체의 표시도 살짝 갱신 — 'zh: { (간체)' → 'zh: { (번체, 대만식 자형 + 어휘 s2twp)'
// 다만 코드 동작에는 영향 없음 — 그냥 주석.
const finalMiddle = converted.replace(
  '// ============ 중국어 (간체) ============',
  '// ============ 중국어 (번체, 대만식 s2twp) ============'
);

const out = before + finalMiddle + after;
fs.writeFileSync(FILE, out, 'utf8');

console.log('✓ 변환 완료');
console.log('  변경 영역 길이:', middle.length, '→', finalMiddle.length, '문자');

// 샘플 변환 결과 보여주기 (디버그용 처음 500자)
console.log('\n[샘플 — 처음 500자]');
console.log(finalMiddle.slice(0, 500));
