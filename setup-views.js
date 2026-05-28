const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://whmiinsaxthenpwjtuar.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWlpbnNheHRoZW5wd2p0dWFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzA1NCwiZXhwIjoyMDkwNzk5MDU0fQ.kYyF8jBMpugfmyqo1w0BO1sQFUpYhAuU0Jw8YZwJ848";

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log("📊 Supabase 칼럼 추가 및 데이터 설정 중...");

    // 1. views 칼럼이 있는지 확인
    const { data: columns, error: schemaError } = await supabase
      .from('blog_articles')
      .select('*')
      .limit(1);

    if (columns && columns[0]) {
      if ('views' in columns[0]) {
        console.log("✅ views 칼럼이 이미 존재합니다");
      } else {
        console.log("⚠️  views 칼럼이 없습니다");
        console.log("💡 Supabase 대시보드에서 다음 SQL을 실행하세요:");
        console.log("");
        console.log("ALTER TABLE blog_articles ADD COLUMN views INTEGER DEFAULT 0;");
        console.log("");
        console.log("그 후 이 스크립트를 다시 실행하세요.");
        process.exit(0);
      }
    }

    // 2. 기존 데이터에 views 값 할당
    console.log("📝 기존 기사에 조회수 할당 중...");
    
    const { data: articles, error: fetchError } = await supabase
      .from('blog_articles')
      .select('id, title, category')
      .limit(200);

    if (fetchError) {
      console.error("❌ 데이터 조회 오류:", fetchError.message);
      process.exit(1);
    }

    if (articles && articles.length > 0) {
      console.log(`조회된 기사: ${articles.length}개`);

      // 각 기사에 views 값 할당 (제목과 카테고리 기반 가상 조회수)
      const updates = articles.map((article) => {
        const titleLength = article.title?.length || 0;
        const categoryHash = (article.category || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const views = Math.abs((titleLength * categoryHash * 7 + 157) % 500) + 50;
        
        return {
          id: article.id,
          views: views
        };
      });

      const { error: updateError } = await supabase
        .from('blog_articles')
        .upsert(updates, { onConflict: 'id' });

      if (updateError) {
        console.error("❌ 업데이트 오류:", updateError.message);
        process.exit(1);
      }

      console.log(`✅ ${articles.length}개 기사의 views 값 할당 완료`);
      
      // 샘플 확인
      const samples = updates.slice(0, 3);
      console.log("\n📊 샘플 데이터:");
      samples.forEach(s => {
        const article = articles.find(a => a.id === s.id);
        console.log(`  - ${article.title.substring(0, 40)}... : ${s.views} 회`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ 오류:", error.message);
    process.exit(1);
  }
})();