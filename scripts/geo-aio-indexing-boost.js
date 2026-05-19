const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 환경변수 로드
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    env[key] = value.trim().replace(/^"/, '').replace(/"$/, '').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

console.log('🚀 GEO-AIO 색인 부스팅 시작\n');
console.log('============================================================\n');

// 1️⃣ robots.txt 확인
console.log('[1/4] robots.txt 점검\n');
try {
  const robotsPath = './public/robots.txt';
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, 'utf8');
    if (robots.includes('Disallow: /') && !robots.includes('Allow:')) {
      console.log('⚠️  주의: robots.txt가 모든 크롤링을 차단하고 있습니다!');
      console.log('조치: Allow: / 또는 Allow: /dashboard 등으로 수정 필요\n');
    } else if (robots.includes('noindex')) {
      console.log('⚠️  주의: noindex 메타 태그가 있습니다!');
      console.log('조치: /pages 등에서 제거 필요\n');
    } else {
      console.log('✅ robots.txt 정상 (크롤링 허용)\n');
    }
  } else {
    console.log('⚠️  robots.txt 파일 없음 (기본값: 모두 허용)\n');
  }
} catch (e) {
  console.log('⚠️  robots.txt 점검 실패:', e.message, '\n');
}

// 2️⃣ 측정 실행 (snapshot)
console.log('[2/4] 색인 상태 측정 (GSC URL Inspection)\n');
(async () => {
  try {
    // geo-aio-dental 사이트 설정 조회
    const { data: sites, error: sitesErr } = await supabase
      .from('indexing_custom_sites')
      .select('*')
      .eq('id', 'geo-aio-dental')
      .single();
    
    if (sitesErr || !sites) {
      console.log('⚠️  geo-aio-dental 설정을 찾을 수 없습니다.');
      console.log('조치: 대시보드에서 사이트 등록 필요\n');
    } else {
      console.log('🔍 측정 대상: ' + sites.label);
      console.log('   도메인: ' + sites.domain);
      console.log('   사이트맵: ' + sites.sitemap_url + '\n');
      
      console.log('⏳ 측정 실행:');
      console.log('   → 프론트엔드에서 "🔄 지금 측정" 버튼 클릭');
      console.log('   → 측정 완료 후 색인됨 숫자 업데이트됨\n');
    }
  } catch (e) {
    console.log('❌ 측정 설정 실패:', e.message, '\n');
  }

  // 3️⃣ 콘텐츠 개선 가이드
  console.log('[3/4] 콘텐츠 개선 가이드\n');
  console.log('🎯 미색인 페이지 색인화 전략:\n');
  
  const improvements = [
    {
      priority: '🔴 최우선 (1주)',
      title: 'E-E-A-T 신호 강화',
      actions: [
        '✓ 저자 정보 추가 (이름, 직급, 경력)',
        '✓ 발행일/수정일 명시 (마크업 포함)',
        '✓ 공신력 있는 출처 링크 3~5개 추가',
        '✓ 실제 사례/경험 기반 내용 추가'
      ]
    },
    {
      priority: '🟡 우선 (2주)',
      title: '구조 개선 & 내부 링크',
      actions: [
        '✓ 제목을 질문 형식으로 변경',
        '✓ 첫 문단에 직접 답변 배치',
        '✓ 관련 글 3~5개 내부 링크 추가',
        '✓ FAQ 섹션 추가 (스키마 마크업)'
      ]
    },
    {
      priority: '🟢 권장 (3주+)',
      title: '기술적 최적화',
      actions: [
        '✓ 페이지 로딩 속도 최적화',
        '✓ 모바일 반응형 확인',
        '✓ 구조화된 데이터 추가 (Article/HowTo)',
        '✓ 이미지 alt 텍스트 추가'
      ]
    }
  ];

  improvements.forEach(imp => {
    console.log(imp.priority + '\n' + imp.title);
    imp.actions.forEach(action => console.log('  ' + action));
    console.log();
  });

  // 4️⃣ Google Search Console 색인 요청
  console.log('[4/4] Google Search Console 색인 요청\n');
  console.log('🔗 다음 단계 (수동):\n');
  console.log('1️⃣  Google Search Console 접속');
  console.log('   → https://search.google.com/search-console\n');
  
  console.log('2️⃣  "geo-aio.com" 속성 선택\n');
  
  console.log('3️⃣  미색인 페이지 확인');
  console.log('   → 좌측 "색인 생성 상태" → "상세 정보"\n');
  
  console.log('4️⃣  상위 미색인 페이지 URL 복사\n');
  
  console.log('5️⃣  "URL 검사" 도구로 각 페이지 색인 요청');
  console.log('   → 검사 → "색인 생성 요청" 클릭\n');
  
  console.log('6️⃣  사이트맵 새로고침');
  console.log('   → 좌측 "사이트맵" → 새로고침\n');

  console.log('============================================================');
  console.log('\n✅ 모든 단계 안내 완료!\n');
  console.log('📊 효과 측정: 1주일 후 다시 "🔄 지금 측정" 실행\n');
})();
