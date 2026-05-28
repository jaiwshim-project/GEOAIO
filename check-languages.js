const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://whmiinsaxthenpwjtuar.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWlpbnNheHRoZW5wd2p0dWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjMwNTQsImV4cCI6MjA5MDc5OTA1NH0.s15kkaYvSPWyteT86N0KfLcOh2PeIrK43k2M8Ns-Dnw";

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log("🔍 언어 정보 확인 중...\n");

    // 샘플 데이터 확인
    const { data: sample } = await supabase
      .from('blog_articles')
      .select('*')
      .limit(3);

    if (sample && sample[0]) {
      console.log("📊 샘플 데이터:");
      sample.forEach((article, idx) => {
        console.log(`\n${idx + 1}. ${article.title?.substring(0, 40)}...`);
        console.log(`   metadata:`, JSON.stringify(article.metadata || {}, null, 2).split('\n').join('\n   '));
      });
    }

    // 모든 고유 언어 확인
    const { data: allArticles } = await supabase
      .from('blog_articles')
      .select('metadata')
      .limit(500);

    if (allArticles) {
      const languages = new Set();
      allArticles.forEach(article => {
        const lang = article.metadata?.lang;
        if (lang) languages.add(lang);
      });

      console.log("\n✅ 발견된 언어들:");
      Array.from(languages).forEach(lang => console.log(`  - ${lang}`));
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ 오류:", error.message);
    process.exit(1);
  }
})();