"use client";

import { useState } from "react";
import Link from "next/link";

/* ───────── 타입 정의 ───────── */
interface BasicInfo {
  name: string;
  department: string;
  position: string;
  email: string;
}

interface Answers {
  basic: BasicInfo;
  awareness: number[];        // step 1 – 10문항 (1‑5)
  ontology: {
    text: string[];           // 서술형 답변 (idx 0,1,2,3,6)
    multiDept: string[];      // 복수선택 – 부서
    multiSystem: string[];    // 복수선택 – 시스템
    multiStorage: string[];   // 복수선택 – 저장소
  };
  bottleneck: {
    text: string[];           // 서술형 답변 (idx 0,1,3,4)
    multiDelay: string[];     // 복수선택 – 지연사유
  };
  readiness: {
    likert: number[];         // 4문항 (1‑5)
    leader: string;           // 객관식
  };
}

/* ───────── 상수 ───────── */
const STEP_LABELS = [
  "기본 정보",
  "AX 인식 진단",
  "업무 온톨로지 진단",
  "병목 진단",
  "실행 준비도",
  "결과",
];

const AWARENESS_QUESTIONS = [
  "현재 업무 방식이 비효율적이라고 느끼십니까?",
  "반복 작업이 많다고 느끼십니까?",
  "데이터 기반 의사결정이 이루어지고 있습니까?",
  "업무 자동화가 필요하다고 느끼십니까?",
  "AI 도입에 대한 이해 수준은 어느 정도입니까?",
  "조직 내 변화에 대한 저항이 있다고 느끼십니까?",
  "현재 시스템이 업무를 충분히 지원하고 있습니까?",
  "업무 속도가 경쟁사 대비 느리다고 생각하십니까?",
  "고객 요구 대응 속도가 빠른 편입니까?",
  "AX 도입 시 적극 참여할 의향이 있습니까?",
];

const LIKERT_LABELS = [
  "매우 그렇지 않다",
  "그렇지 않다",
  "보통",
  "그렇다",
  "매우 그렇다",
];

const ONTOLOGY_TEXT_ITEMS: { q: string; placeholder: string }[] = [
  { q: "내가 다루는 주요 업무 객체는 무엇인가?", placeholder: "예: 고객 데이터, 계약서, 보고서 등" },
  { q: "업무 결과물은 무엇인가?", placeholder: "예: 분석 보고서, 제안서, 데이터셋 등" },
  { q: "업무는 어떤 단계로 진행되는가?", placeholder: "예: 접수 → 검토 → 처리 → 보고" },
  { q: "이전/다음 단계 담당자는 누구인가?", placeholder: "예: 팀장 검토 후 부서장 승인" },
];

const DEPT_OPTIONS = ["경영지원", "영업", "마케팅", "개발", "생산", "재무", "HR", "고객지원"];
const SYSTEM_OPTIONS = ["ERP", "CRM", "그룹웨어", "이메일", "엑셀", "메신저", "자체시스템", "기타"];
const STORAGE_OPTIONS = ["로컬PC", "공유드라이브", "클라우드", "ERP/시스템", "이메일"];

const ONTOLOGY_TEXT2: { q: string; placeholder: string }[] = [
  { q: "어떤 데이터를 입력/생성하는가?", placeholder: "예: 매출 데이터, 고객 정보, 주문 내역 등" },
];

const BOTTLENECK_TEXT_ITEMS: { q: string; placeholder: string }[] = [
  { q: "업무에서 가장 시간이 많이 소요되는 단계는?", placeholder: "예: 데이터 수집 및 정리 단계" },
  { q: "반복 작업이 가장 많은 부분은?", placeholder: "예: 엑셀 데이터 입력, 보고서 작성 등" },
];

const DELAY_OPTIONS = ["결재라인 복잡", "정보부족", "담당자부재", "기준불명확", "시스템미비"];

const BOTTLENECK_TEXT2: { q: string; placeholder: string }[] = [
  { q: "데이터 부족으로 어려운 상황은?", placeholder: "예: 실시간 현황 파악이 어려움" },
  { q: "오류/재작업이 많은 부분은?", placeholder: "예: 수기 입력 오류로 인한 재작업" },
];

const READINESS_QUESTIONS = [
  "새로운 시스템 도입에 대한 수용성은?",
  "데이터 공유에 대한 조직 문화는?",
  "자동화 도입 시 협조 가능 여부",
  "현재 IT 인프라 수준",
];

const LEADER_OPTIONS = ["있다", "검토중", "없다", "모르겠다"];

/* ───────── 초기값 ───────── */
function initialAnswers(): Answers {
  return {
    basic: { name: "", department: "", position: "", email: "" },
    awareness: Array(10).fill(0),
    ontology: {
      text: Array(5).fill(""),
      multiDept: [],
      multiSystem: [],
      multiStorage: [],
    },
    bottleneck: {
      text: Array(4).fill(""),
      multiDelay: [],
    },
    readiness: {
      likert: Array(4).fill(0),
      leader: "",
    },
  };
}

/* ───────── 컴포넌트 ───────── */
export default function EmployeeDiagnosisPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);

  /* ── 헬퍼: 상태 업데이트 ── */
  const setBasic = (field: keyof BasicInfo, value: string) =>
    setAnswers((prev) => ({ ...prev, basic: { ...prev.basic, [field]: value } }));

  const setAwareness = (idx: number, val: number) =>
    setAnswers((prev) => {
      const arr = [...prev.awareness];
      arr[idx] = val;
      return { ...prev, awareness: arr };
    });

  const setOntologyText = (idx: number, val: string) =>
    setAnswers((prev) => {
      const t = [...prev.ontology.text];
      t[idx] = val;
      return { ...prev, ontology: { ...prev.ontology, text: t } };
    });

  const toggleMulti = (
    category: "multiDept" | "multiSystem" | "multiStorage",
    val: string
  ) =>
    setAnswers((prev) => {
      const arr = prev.ontology[category].includes(val)
        ? prev.ontology[category].filter((v) => v !== val)
        : [...prev.ontology[category], val];
      return { ...prev, ontology: { ...prev.ontology, [category]: arr } };
    });

  const setBottleneckText = (idx: number, val: string) =>
    setAnswers((prev) => {
      const t = [...prev.bottleneck.text];
      t[idx] = val;
      return { ...prev, bottleneck: { ...prev.bottleneck, text: t } };
    });

  const toggleDelay = (val: string) =>
    setAnswers((prev) => {
      const arr = prev.bottleneck.multiDelay.includes(val)
        ? prev.bottleneck.multiDelay.filter((v) => v !== val)
        : [...prev.bottleneck.multiDelay, val];
      return { ...prev, bottleneck: { ...prev.bottleneck, multiDelay: arr } };
    });

  const setReadinessLikert = (idx: number, val: number) =>
    setAnswers((prev) => {
      const arr = [...prev.readiness.likert];
      arr[idx] = val;
      return { ...prev, readiness: { ...prev.readiness, likert: arr } };
    });

  const setLeader = (val: string) =>
    setAnswers((prev) => ({ ...prev, readiness: { ...prev.readiness, leader: val } }));

  /* ── 결과 계산 ── */
  const calcResults = () => {
    // AX 인식 점수 (50점 만점 → 100점 환산)
    const awarenessSum = answers.awareness.reduce((a, b) => a + b, 0);
    const awarenessScore = Math.round((awarenessSum / 50) * 100);

    // 업무 구조 복잡도 (연결 부서수 + 시스템수 + 저장소수 기반)
    const connections =
      answers.ontology.multiDept.length +
      answers.ontology.multiSystem.length +
      answers.ontology.multiStorage.length;
    const maxConnections = DEPT_OPTIONS.length + SYSTEM_OPTIONS.length + STORAGE_OPTIONS.length;
    const complexityScore = Math.round((connections / maxConnections) * 100);

    // 병목 키워드
    const bottleneckKeywords = answers.bottleneck.multiDelay.length > 0
      ? answers.bottleneck.multiDelay
      : ["데이터 없음"];
    const filledBottleneckTexts = answers.bottleneck.text.filter((t) => t.trim().length > 0);

    // 실행 준비도 (20점 만점 → 100점 환산) + leader 보너스
    const readinessSum = answers.readiness.likert.reduce((a, b) => a + b, 0);
    const leaderBonus = answers.readiness.leader === "있다" ? 10 : answers.readiness.leader === "검토중" ? 5 : 0;
    const readinessScore = Math.min(100, Math.round(((readinessSum / 20) * 100 * 0.8) + leaderBonus));

    // 종합 점수
    const totalScore = Math.round(
      awarenessScore * 0.3 + complexityScore * 0.15 + readinessScore * 0.35 + (100 - complexityScore) * 0.2
    );

    const grade =
      totalScore >= 80 ? "A" : totalScore >= 60 ? "B" : totalScore >= 40 ? "C" : "D";

    const gradeLabel =
      grade === "A"
        ? "AX 전환 준비 우수"
        : grade === "B"
        ? "AX 전환 준비 양호"
        : grade === "C"
        ? "AX 전환 준비 필요"
        : "AX 전환 기초 단계";

    return {
      awarenessScore,
      complexityScore,
      bottleneckKeywords,
      filledBottleneckTexts,
      readinessScore,
      totalScore,
      grade,
      gradeLabel,
    };
  };

  /* ── 유효성 검사 ── */
  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return (
          answers.basic.name.trim() !== "" &&
          answers.basic.department.trim() !== "" &&
          answers.basic.position.trim() !== "" &&
          answers.basic.email.trim() !== ""
        );
      case 1:
        return answers.awareness.every((v) => v >= 1);
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return answers.readiness.likert.every((v) => v >= 1) && answers.readiness.leader !== "";
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };
  const handleReset = () => {
    setStep(0);
    setAnswers(initialAnswers());
  };

  /* ── 공통 UI 컴포넌트 ── */
  const LikertRow = ({
    question,
    value,
    onChange,
    index,
  }: {
    question: string;
    value: number;
    onChange: (v: number) => void;
    index: number;
  }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
      <p className="text-white font-medium text-sm leading-relaxed">
        <span className="text-indigo-400 font-bold mr-2">Q{index + 1}.</span>
        {question}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-20 text-right shrink-0 hidden sm:block">
          {LIKERT_LABELS[0]}
        </span>
        <div className="flex gap-2 flex-1 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 ${
                value === n
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-110"
                  : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 w-20 shrink-0 hidden sm:block">
          {LIKERT_LABELS[4]}
        </span>
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 sm:hidden px-1">
        <span>{LIKERT_LABELS[0]}</span>
        <span>{LIKERT_LABELS[4]}</span>
      </div>
    </div>
  );

  const TextQuestion = ({
    question,
    placeholder,
    value,
    onChange,
    index,
  }: {
    question: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    index: number;
  }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
      <p className="text-white font-medium text-sm leading-relaxed">
        <span className="text-indigo-400 font-bold mr-2">Q{index + 1}.</span>
        {question}
      </p>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none transition-all"
      />
    </div>
  );

  const MultiCheckGroup = ({
    question,
    options,
    selected,
    onToggle,
    index,
  }: {
    question: string;
    options: string[];
    selected: string[];
    onToggle: (v: string) => void;
    index: number;
  }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
      <p className="text-white font-medium text-sm leading-relaxed">
        <span className="text-indigo-400 font-bold mr-2">Q{index + 1}.</span>
        {question}
        <span className="text-gray-500 text-xs ml-2">(복수선택 가능)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/50 shadow-sm shadow-indigo-500/20"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="mr-1.5">{active ? "✓" : "○"}</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  const RadioGroup = ({
    question,
    options,
    value,
    onChange,
    index,
  }: {
    question: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
    index: number;
  }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
      <p className="text-white font-medium text-sm leading-relaxed">
        <span className="text-indigo-400 font-bold mr-2">Q{index + 1}.</span>
        {question}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-violet-500/30 text-violet-200 border border-violet-400/50 shadow-sm shadow-violet-500/20"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ── 결과 바 차트 ── */
  const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-white font-bold">{score}점</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  /* ── 프로그레스 바 ── */
  const progress = step <= 5 ? (step / 5) * 100 : 100;

  /* ━━━━━━━━━━━━━━ 렌더링 ━━━━━━━━━━━━━━ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-indigo-200 font-medium mb-4">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            직원용 AX 진단
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            AX 사전 진단 &mdash; 직원용
          </h1>
        </div>

        {/* 프로그레스 */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5 px-1">
            {STEP_LABELS.map((label, i) => (
              <span
                key={i}
                className={`hidden sm:inline ${
                  i === step ? "text-indigo-300 font-bold" : ""
                } ${i < step ? "text-indigo-400" : ""}`}
              >
                {label}
              </span>
            ))}
            <span className="sm:hidden text-indigo-300 font-bold">
              {STEP_LABELS[step]} ({step + 1}/{STEP_LABELS.length})
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ─── STEP 0: 기본 정보 ─── */}
        {step === 0 && (
          <div className="mt-8 space-y-5">
            <h2 className="text-xl font-bold text-white mb-2">기본 정보</h2>
            <p className="text-gray-400 text-sm mb-4">진단 결과 식별을 위한 기본 정보를 입력해주세요.</p>
            {(
              [
                { key: "name", label: "이름", placeholder: "홍길동", type: "text" },
                { key: "department", label: "부서", placeholder: "마케팅팀", type: "text" },
                { key: "position", label: "직급", placeholder: "대리", type: "text" },
                { key: "email", label: "이메일", placeholder: "hong@company.com", type: "email" },
              ] as const
            ).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm text-gray-300 font-medium">{field.label}</label>
                <input
                  type={field.type}
                  value={answers.basic[field.key]}
                  onChange={(e) => setBasic(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            ))}
          </div>
        )}

        {/* ─── STEP 1: AX 인식 진단 ─── */}
        {step === 1 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-white mb-1">AX 인식 진단</h2>
            <p className="text-gray-400 text-sm mb-4">
              1(매우 그렇지 않다) ~ 5(매우 그렇다) 중 선택해주세요.
            </p>
            {AWARENESS_QUESTIONS.map((q, i) => (
              <LikertRow
                key={i}
                question={q}
                value={answers.awareness[i]}
                onChange={(v) => setAwareness(i, v)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ─── STEP 2: 업무 온톨로지 진단 ─── */}
        {step === 2 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-white mb-1">업무 온톨로지 진단</h2>
            <p className="text-gray-400 text-sm mb-4">업무 구조와 연결 관계를 파악합니다.</p>

            {/* 서술형 Q1‑Q4 */}
            {ONTOLOGY_TEXT_ITEMS.map((item, i) => (
              <TextQuestion
                key={i}
                question={item.q}
                placeholder={item.placeholder}
                value={answers.ontology.text[i]}
                onChange={(v) => setOntologyText(i, v)}
                index={i}
              />
            ))}

            {/* 복수선택: 부서 */}
            <MultiCheckGroup
              question="어떤 부서와 연결되는가?"
              options={DEPT_OPTIONS}
              selected={answers.ontology.multiDept}
              onToggle={(v) => toggleMulti("multiDept", v)}
              index={4}
            />

            {/* 복수선택: 시스템 */}
            <MultiCheckGroup
              question="어떤 시스템을 사용하는가?"
              options={SYSTEM_OPTIONS}
              selected={answers.ontology.multiSystem}
              onToggle={(v) => toggleMulti("multiSystem", v)}
              index={5}
            />

            {/* 서술형: 데이터 입력/생성 */}
            {ONTOLOGY_TEXT2.map((item, i) => (
              <TextQuestion
                key={`o2-${i}`}
                question={item.q}
                placeholder={item.placeholder}
                value={answers.ontology.text[4 + i]}
                onChange={(v) => setOntologyText(4 + i, v)}
                index={6}
              />
            ))}

            {/* 복수선택: 저장소 */}
            <MultiCheckGroup
              question="데이터는 어디에 저장되는가?"
              options={STORAGE_OPTIONS}
              selected={answers.ontology.multiStorage}
              onToggle={(v) => toggleMulti("multiStorage", v)}
              index={7}
            />
          </div>
        )}

        {/* ─── STEP 3: 병목 진단 ─── */}
        {step === 3 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-white mb-1">병목 진단</h2>
            <p className="text-gray-400 text-sm mb-4">업무 흐름에서 지연과 비효율이 발생하는 지점을 파악합니다.</p>

            {/* 서술형 Q1‑Q2 */}
            {BOTTLENECK_TEXT_ITEMS.map((item, i) => (
              <TextQuestion
                key={i}
                question={item.q}
                placeholder={item.placeholder}
                value={answers.bottleneck.text[i]}
                onChange={(v) => setBottleneckText(i, v)}
                index={i}
              />
            ))}

            {/* 복수선택: 승인 지연 사유 */}
            <MultiCheckGroup
              question="승인/결정이 지연되는 이유는?"
              options={DELAY_OPTIONS}
              selected={answers.bottleneck.multiDelay}
              onToggle={toggleDelay}
              index={2}
            />

            {/* 서술형 Q4‑Q5 */}
            {BOTTLENECK_TEXT2.map((item, i) => (
              <TextQuestion
                key={`b2-${i}`}
                question={item.q}
                placeholder={item.placeholder}
                value={answers.bottleneck.text[2 + i]}
                onChange={(v) => setBottleneckText(2 + i, v)}
                index={3 + i}
              />
            ))}
          </div>
        )}

        {/* ─── STEP 4: 실행 준비도 ─── */}
        {step === 4 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-white mb-1">실행 준비도</h2>
            <p className="text-gray-400 text-sm mb-4">AX 전환을 실행할 수 있는 조직의 준비 수준을 진단합니다.</p>

            {READINESS_QUESTIONS.map((q, i) => (
              <LikertRow
                key={i}
                question={q}
                value={answers.readiness.likert[i]}
                onChange={(v) => setReadinessLikert(i, v)}
                index={i}
              />
            ))}

            <RadioGroup
              question="변화 리더 존재 여부"
              options={LEADER_OPTIONS}
              value={answers.readiness.leader}
              onChange={setLeader}
              index={4}
            />
          </div>
        )}

        {/* ─── STEP 5: 결과 ─── */}
        {step === 5 && (() => {
          const r = calcResults();
          const gradeColorMap: Record<string, string> = {
            A: "from-emerald-400 to-green-500",
            B: "from-blue-400 to-indigo-500",
            C: "from-amber-400 to-orange-500",
            D: "from-red-400 to-rose-500",
          };
          return (
            <div className="mt-8 space-y-6">
              {/* 종합 등급 */}
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-3">
                  {answers.basic.name}님의 AX 진단 결과
                </p>
                <div
                  className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${
                    gradeColorMap[r.grade]
                  } shadow-2xl mb-4`}
                >
                  <span className="text-5xl font-black text-white">{r.grade}</span>
                </div>
                <p className="text-white text-xl font-bold mt-2">{r.gradeLabel}</p>
                <p className="text-gray-400 text-sm mt-1">종합 점수: {r.totalScore}점 / 100점</p>
              </div>

              {/* 영역별 점수 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-white font-bold text-lg">영역별 분석</h3>
                <ScoreBar label="AX 인식 점수" score={r.awarenessScore} color="bg-gradient-to-r from-blue-500 to-indigo-500" />
                <ScoreBar label="업무 구조 복잡도" score={r.complexityScore} color="bg-gradient-to-r from-purple-500 to-violet-500" />
                <ScoreBar label="실행 준비도" score={r.readinessScore} color="bg-gradient-to-r from-emerald-500 to-teal-500" />
              </div>

              {/* 병목 Top 3 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-4">병목 키워드 Top 3</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {r.bottleneckKeywords.slice(0, 3).map((kw, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-rose-500/20 text-rose-300 rounded-full text-sm font-medium border border-rose-500/30"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
                {r.filledBottleneckTexts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-xs font-medium">주요 병목 상세</p>
                    {r.filledBottleneckTexts.slice(0, 3).map((txt, i) => (
                      <p key={i} className="text-gray-300 text-sm bg-white/5 rounded-lg px-3 py-2">
                        {txt}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* 추천 전략 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-4">추천 전략</h3>
                <div className="space-y-3">
                  {r.awarenessScore < 60 && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="text-blue-400 mt-0.5">&#9679;</span>
                      <p className="text-gray-300">
                        <strong className="text-white">AX 인식 강화:</strong> AI/자동화 교육 프로그램 도입 및 성공 사례 공유를 통해 조직원의 AX 이해도를 높이세요.
                      </p>
                    </div>
                  )}
                  {r.complexityScore >= 50 && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="text-purple-400 mt-0.5">&#9679;</span>
                      <p className="text-gray-300">
                        <strong className="text-white">업무 구조 최적화:</strong> 연결된 부서/시스템이 많아 복잡도가 높습니다. 업무 프로세스 표준화와 시스템 통합을 우선 검토하세요.
                      </p>
                    </div>
                  )}
                  {r.bottleneckKeywords.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="text-rose-400 mt-0.5">&#9679;</span>
                      <p className="text-gray-300">
                        <strong className="text-white">병목 해소:</strong> &lsquo;{r.bottleneckKeywords[0]}&rsquo; 관련 프로세스를 우선적으로 자동화하여 업무 흐름을 개선하세요.
                      </p>
                    </div>
                  )}
                  {r.readinessScore < 60 && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="text-emerald-400 mt-0.5">&#9679;</span>
                      <p className="text-gray-300">
                        <strong className="text-white">실행력 강화:</strong> 변화 관리 리더를 선정하고, 소규모 파일럿 프로젝트부터 시작하여 성공 경험을 축적하세요.
                      </p>
                    </div>
                  )}
                  {r.totalScore >= 70 && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="text-amber-400 mt-0.5">&#9679;</span>
                      <p className="text-gray-300">
                        <strong className="text-white">본격 전환 추진:</strong> AX 준비도가 높습니다. 핵심 업무 영역부터 AI 에이전트 도입을 검토하세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 하단 버튼 (결과) */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/10"
                >
                  다시 진단하기
                </button>
                <Link
                  href="/ax-diagnosis"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-center hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25"
                >
                  홈으로
                </Link>
              </div>
            </div>
          );
        })()}

        {/* ─── 네비게이션 (결과 페이지 제외) ─── */}
        {step < 5 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/10"
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                canProceed()
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:opacity-90"
                  : "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
              }`}
            >
              {step === 4 ? "결과 보기" : "다음"}
            </button>
          </div>
        )}

        {/* 푸터 */}
        <div className="text-center mt-8 pb-4">
          <p className="text-gray-600 text-xs">
            AX Ontology OS &mdash; 직원용 AX 사전 진단
          </p>
        </div>
      </div>
    </div>
  );
}
