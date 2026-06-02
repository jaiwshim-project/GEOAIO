const http = require('http');

// 10가지 톤
const tones = [
  { value: 'professional', label: '전문적' },
  { value: 'casual', label: '캐주얼' },
  { value: 'friendly', label: '친근한' },
  { value: 'formal', label: '공식적' },
  { value: 'creative', label: '창의적' },
  { value: 'persuasive', label: '설득적' },
  { value: 'educational', label: '교육적' },
  { value: 'humorous', label: '유머러스' },
  { value: 'inspirational', label: '영감적' },
  { value: 'conversational', label: '대화체' }
];

// 테스트 데이터
const testData = {
  category: 'dental_care',
  topic: '치아 미백 치료',
  targetKeyword: '전문적인 치아 미백',
  subKeyword: '자연스러운 하얀 치아',
  company_name: '테스트 치과',
  representative_name: '이현태 의사',
  region: '서울',
  additionalNotes: '환자를 중심으로 한 전문적인 콘텐츠'
};

// API 호출 함수
async function callGenerateAPI(tone) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      ...testData,
      tone: tone.value
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            tone: tone.label,
            status: res.statusCode,
            success: res.statusCode === 200 && json.content,
            contentLength: json.content ? json.content.length : 0,
            error: json.error || null
          });
        } catch (e) {
          resolve({ tone: tone.label, status: res.statusCode, success: false, error: e.message });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// 메인 테스트 함수
async function runTest() {
  console.log('🚀 콘텐츠 생성 테스트 시작\n');
  console.log('테스트 정보:');
  console.log(`- 주제: ${testData.topic}`);
  console.log(`- 카테고리: ${testData.category}`);
  console.log(`- 톤: 10가지`);
  console.log(`- 반복: 3회\n`);

  const results = [];

  for (let run = 1; run <= 3; run++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 시도 #${run}/3`);
    console.log(`${'='.repeat(60)}\n`);

    const runResults = [];

    for (const tone of tones) {
      try {
        const result = await callGenerateAPI(tone);
        runResults.push(result);

        const status = result.success ? '✅' : '❌';
        const content = result.success ? `(${result.contentLength}자)` : `오류: ${result.error}`;
        console.log(`${status} ${result.tone.padEnd(12)} - Status: ${result.status} ${content}`);

        // 요청 간 딜레이 (API 레이트 제한 회피)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`❌ ${tone.label.padEnd(12)} - 예외: ${error.message}`);
      }
    }

    // 결과 요약
    const successCount = runResults.filter(r => r.success).length;
    const totalCount = runResults.length;
    console.log(`\n📊 시도 #${run} 결과: ${successCount}/${totalCount} 성공`);

    results.push({
      run,
      successCount,
      totalCount,
      successRate: ((successCount / totalCount) * 100).toFixed(1)
    });

    // 다음 시도 전 딜레이
    if (run < 3) {
      console.log('\n⏳ 다음 시도 준비 중 (5초)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 최종 결과
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📈 최종 결과');
  console.log(`${'='.repeat(60)}\n`);

  results.forEach(r => {
    console.log(`시도 #${r.run}: ${r.successCount}/${r.totalCount} (${r.successRate}%)`);
  });

  const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0);
  const totalTests = results.reduce((sum, r) => sum + r.totalCount, 0);
  const overallRate = ((totalSuccess / totalTests) * 100).toFixed(1);

  console.log(`\n✨ 전체: ${totalSuccess}/${totalTests} (${overallRate}%)\n`);

  process.exit(totalSuccess === totalTests ? 0 : 1);
}

runTest().catch(err => {
  console.error('테스트 오류:', err);
  process.exit(1);
});
