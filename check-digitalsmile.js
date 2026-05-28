const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://whmiinsaxthenpwjtuar.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWlpbnNheHRoZW5wd2p0dWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjMwNTQsImV4cCI6MjA5MDc5OTA1NH0.s15kkaYvSPWyteT86N0KfLcOh2PeIrK43k2M8Ns-Dnw";

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log("🔍 디지털스마일치과 데이터 조회 중...");

    // 디지털스마일치과 데이터 조회
    const { data: articles, error } = await supabase
      .from('blog_articles')
      .select('id, title, category, created_at')
      .eq('category', '디지털스마일치과');

    if (error) {
      console.error("❌ 조회 오류:", error.message);
      process.exit(1);
    }

    if (!articles || articles.length === 0) {
      console.log("❌ 디지털스마일치과 데이터가 없습니다");
      
      // 전체 카테고리 목록 표시
      const { data: allArticles } = await supabase
        .from('blog_articles')
        .select('category');
      
      const categories = [...new Set(allArticles?.map(a => a.category) || [])].filter(Boolean).sort();
      console.log("\n📋 현재 있는 카테고리들:");
      categories.forEach(cat => console.log(`  - ${cat}`));
    } else {
      console.log(`✅ 디지털스마일치과 데이터 있음: ${articles.length}개\n`);
      
      console.log("📊 샘플 데이터:");
      articles.slice(0, 5).forEach((article, idx) => {
        const date = new Date(article.created_at).toLocaleDateString('ko-KR');
        console.log(`  ${idx + 1}. [${date}] ${article.title.substring(0, 50)}${article.title.length > 50 ? '...' : ''}`);
      });
      
      if (articles.length > 5) {
        console.log(`  ... 외 ${articles.length - 5}개`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ 오류:", error.message);
    process.exit(1);
  }
})();