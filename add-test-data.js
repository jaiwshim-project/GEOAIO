const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://whmiinsaxthenpwjtuar.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWlpbnNheHRoZW5wd2p0dWFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzA1NCwiZXhwIjoyMDkwNzk5MDU0fQ.kYyF8jBMpugfmyqo1w0BO1sQFUpYhAuU0Jw8YZwJ848";

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log("📝 테스트 데이터 추가 중...");
    
    const testArticles = [
      {
        title: "치아 미백 최신 기술",
        category: "디지털스마일치과",
        content: "치아 미백에 대한 설명",
        created_at: "2026-05-10"
      },
      {
        title: "임플란트 시술 후 관리법",
        category: "디지털스마일치과",
        content: "임플란트 관리",
        created_at: "2026-05-15"
      },
      {
        title: "입냄새 원인과 해결책",
        category: "스마일앤케어",
        content: "입냄새 관리",
        created_at: "2026-05-12"
      },
      {
        title: "아이 치아 교정 가이드",
        category: "스마일앤케어",
        content: "어린이 교정",
        created_at: "2026-05-18"
      },
      {
        title: "충치 예방법",
        category: "디지털스마일치과",
        content: "충치 예방",
        created_at: "2026-05-20"
      }
    ];
    
    const { data, error } = await supabase
      .from("blog_articles")
      .insert(testArticles)
      .select();
    
    if (error) {
      console.error("❌ 데이터 삽입 오류:", error.message);
      process.exit(1);
    }
    
    console.log("✅ 테스트 데이터 추가 완료:", data?.length, "개");
    process.exit(0);
  } catch (err) {
    console.error("❌ 에러:", err.message);
    process.exit(1);
  }
})();