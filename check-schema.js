const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://whmiinsaxthenpwjtuar.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWlpbnNheHRoZW5wd2p0dWFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzA1NCwiZXhwIjoyMDkwNzk5MDU0fQ.kYyF8jBMpugfmyqo1w0BO1sQFUpYhAuU0Jw8YZwJ848";

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    const { data, error } = await supabase
      .from("blog_articles")
      .select("*")
      .limit(1);
    
    if (error) {
      console.error("❌ 오류:", error.message);
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      console.log("✅ 테이블 스키마 (기존 데이터):");
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log("⚠️ 테이블에 데이터가 없음. 빈 테이블임.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ 에러:", err.message);
    process.exit(1);
  }
})();