// 해당 블로그의 프로젝트 금기어 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/);
const supabaseKey = keyMatch ? keyMatch[1] : null;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY를 .env.local에서 찾을 수 없습니다.');
  process.exit(1);
}

const supabase = createClient(
  'https://whmiinsaxthenpwjtuar.supabase.co',
  supabaseKey
);

(async () => {
  try {
    // 1. 해당 블로그 포스트 정보 조회
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, user_id, project_id, tone, created_at, content')
      .eq('id', 'b6257c6a-95b1-4bb8-a169-30be6c78a52b')
      .single();

    if (postError) {
      console.error('❌ 블로그 포스트 조회 실패:', postError);
      process.exit(1);
    }

    console.log('📝 블로그 정보:');
    console.log('  - ID:', post.id);
    console.log('  - 제목:', post.title);
    console.log('  - 톤:', post.tone);
    console.log('  - 생성일:', post.created_at);
    console.log('  - User ID:', post.user_id);
    console.log('  - Project ID:', post.project_id);

    // 2. 프로젝트 정보 조회 (금기어 포함)
    if (post.project_id) {
      const { data: project, error: projectError } = await supabase
        .from('user_projects')
        .select('id, project_name, forbidden_words, created_at')
        .eq('id', post.project_id)
        .single();

      if (projectError) {
        console.error('\n❌ 프로젝트 조회 실패:', projectError);
      } else {
        console.log('\n📂 프로젝트 정보:');
        console.log('  - ID:', project.id);
        console.log('  - 이름:', project.project_name);
        console.log('  - 금기어:', project.forbidden_words || '(없음)');
        console.log('  - 프로젝트 생성일:', project.created_at);
      }
    } else {
      console.log('\n⚠️ 프로젝트 미연결 (개인 콘텐츠)');
    }

    // 3. 본문에서 "비용" 또는 "가격" 포함 여부 확인
    const contentLower = post.content.toLowerCase();
    const hasCost = contentLower.includes('비용');
    const hasPrice = contentLower.includes('가격');

    console.log('\n🔍 본문 키워드 검색:');
    console.log('  - "비용" 포함:', hasCost ? '✅ 있음' : '❌ 없음');
    console.log('  - "가격" 포함:', hasPrice ? '✅ 있음' : '❌ 없음');

    if (hasCost || hasPrice) {
      // 실제 사용된 문맥 5개 추출
      const lines = post.content.split('\n');
      const matches = lines.filter(line =>
        line.includes('비용') || line.includes('가격')
      ).slice(0, 5);

      console.log('\n📄 실제 사용 문맥 (최대 5개):');
      matches.forEach((line, i) => {
        console.log(`  ${i + 1}. ${line.trim().slice(0, 100)}...`);
      });
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  }
})();
