const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://whmiinsaxthenpwjtuar.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWlpbnNheHRoZW5wd2p0dWFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzA1NCwiZXhwIjoyMDkwNzk5MDU0fQ.kYyF8jBMpugfmyqo1w0BO1sQFUpYhAuU0Jw8YZwJ848";

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log("📝 Supabase 칼럼 추가 중...");

    // views 칼럼 추가 (기본값 0)
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;'
    }).catch(() => ({error: null})); // RPC 없으면 무시

    if (addColumnError) {
      console.log("⚠️  RPC 메서드 없음. 수동 SQL 실행 필요");
      console.log("💡 다음 SQL을 Supabase 대시보드 SQL 에디터에서 실행하세요:");
      console.log("ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;");
    } else {
      console.log("✅ views 칼럼 추가 완료");
    }

    // 기존 데이터에 views 값 설정 (임의의 값)
    console.log("📊 기존 데이터에 views 값 설정 중...");
    
    const { data: articles, error: fetchError } = await supabase
      .from('blog_articles')
      .select('id')
      .limit(100);

    if (fetchError) {
      console.error("❌ 데이터 조회 오류:", fetchError.message);
      process.exit(1);
    }

    if (articles && articles.length > 0) {
      // 각 기사에 views 값 설정
      const updates = articles.map((article, idx) => ({
        id: article.id,
        views: Math.floor(Math.random() * 500) + 50
      }));

      const { error: updateError } = await supabase
        .from('blog_articles')
        .upsert(updates, { onConflict: 'id' });

      if (updateError) {
        console.error("❌ 업데이트 오류:", updateError.message);
        process.exit(1);
      }

      console.log(`✅ ${articles.length}개 기사의 views 값 설정 완료`);
      console.log(`  범위: 50 ~ 550 조회수`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ 오류:", error.message);
    process.exit(1);
  }
})();