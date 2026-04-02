"use client";

import { useState } from "react";
import Link from "next/link";

/* ───────── Types ───────── */
interface BasicInfo {
  company: string;
  name: string;
  position: string;
  email: string;
}

type AnswerValue = number | string | string[];

interface Question {
  id: string;
  text: string;
  type: "radio" | "likert" | "checkbox" | "select3";
  options?: string[];
}

interface Section {
  title: string;
  subtitle: string;
  icon: string;
  questions: Question[];
}

/* ───────── Data ───────── */
const sections: Section[] = [
  {
    title: "AX 인식 진단",
    subtitle: "Mindset Assessment",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    questions: [
      {
        id: "a1",
        text: "현재 조직의 가장 큰 병목은 무엇입니까?",
        type: "radio",
        options: [
          "커뮤니케이션 지연",
          "데이터 분산",
          "의사결정 속도",
          "반복 업무",
          "인력 부족",
        ],
      },
      {
        id: "a2",
        text: "데이터 기반 의사결정이 얼마나 이루어지고 있습니까?",
        type: "likert",
      },
      {
        id: "a3",
        text: "AX 도입의 최우선 목표는?",
        type: "radio",
        options: [
          "비용 절감",
          "매출 증대",
          "업무 효율",
          "고객 경험",
          "경쟁력 확보",
        ],
      },
      {
        id: "a4",
        text: "조직 내 변화에 대한 저항 수준은?",
        type: "likert",
      },
      {
        id: "a5",
        text: "향후 1년 내 AI/자동화 투자 계획은?",
        type: "radio",
        options: ["없음", "검토 중", "소규모 진행", "본격 추진", "이미 진행 중"],
      },
    ],
  },
  {
    title: "구조 진단",
    subtitle: "Structure Assessment",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    questions: [
      {
        id: "b1",
        text: "현재 가장 시급한 디지털 전환 영역은? (복수 선택 가능)",
        type: "checkbox",
        options: [
          "영업/마케팅",
          "생산/운영",
          "재무/회계",
          "HR/인사",
          "고객관리",
        ],
      },
      {
        id: "b2",
        text: "부서 간 데이터 공유가 원활합니까?",
        type: "likert",
      },
      {
        id: "b3",
        text: "현재 사용 중인 주요 시스템은? (복수 선택 가능)",
        type: "checkbox",
        options: ["ERP", "CRM", "그룹웨어", "엑셀 중심", "자체 시스템"],
      },
      {
        id: "b4",
        text: "의사결정에 필요한 데이터를 즉시 확보할 수 있습니까?",
        type: "likert",
      },
      {
        id: "b5",
        text: "조직의 핵심 프로세스가 문서화되어 있습니까?",
        type: "likert",
      },
    ],
  },
  {
    title: "실행 준비도",
    subtitle: "Execution Readiness",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    questions: [
      {
        id: "c1",
        text: "AX 전환을 주도할 리더/팀이 있습니까?",
        type: "select3",
        options: ["예", "검토 중", "없음"],
      },
      {
        id: "c2",
        text: "IT 인프라 수준은?",
        type: "likert",
      },
      {
        id: "c3",
        text: "직원들의 디지털 역량 수준은?",
        type: "likert",
      },
      {
        id: "c4",
        text: "AX 도입 예산 범위는?",
        type: "radio",
        options: [
          "미정",
          "1천만 원 미만",
          "1천~5천만 원",
          "5천만~1억 원",
          "1억 원 이상",
        ],
      },
      {
        id: "c5",
        text: "외부 전문가/컨설팅 활용 의향은?",
        type: "likert",
      },
    ],
  },
];

const likertLabels = [
  "매우 낮음",
  "낮음",
  "보통",
  "높음",
  "매우 높음",
];

/* ───────── Score helpers ───────── */
function calcScore(answers: Record<string, AnswerValue>, prefix: string): number {
  let sum = 0;
  let count = 0;
  for (let i = 1; i <= 5; i++) {
    const key = `${prefix}${i}`;
    const v = answers[key];
    if (typeof v === "number") {
      sum += v;
      count++;
    } else if (typeof v === "string" && v) {
      // radio / select3 → map to score
      const section = sections.find((s) =>
        s.questions.some((q) => q.id === key)
      );
      const q = section?.questions.find((q) => q.id === key);
      if (q?.options) {
        const idx = q.options.indexOf(v);
        sum += idx >= 0 ? idx + 1 : 3;
      } else {
        sum += 3;
      }
      count++;
    } else if (Array.isArray(v) && v.length > 0) {
      // checkbox → more selected = higher score
      sum += Math.min(v.length, 5);
      count++;
    }
  }
  return count > 0 ? Math.round((sum / (count * 5)) * 100) : 0;
}

function getLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "매우 높음", color: "text-emerald-400" };
  if (score >= 60) return { label: "높음", color: "text-blue-400" };
  if (score >= 40) return { label: "보통", color: "text-amber-400" };
  if (score >= 20) return { label: "낮음", color: "text-orange-400" };
  return { label: "매우 낮음", color: "text-red-400" };
}

function getStrategies(
  awareness: number,
  structure: number,
  execution: number
): string[] {
  const strategies: string[] = [];

  if (awareness < 50) {
    strategies.push(
      "AX 필요성에 대한 경영진 워크숍 및 인식 전환 프로그램을 우선 실시하십시오."
    );
  } else {
    strategies.push(
      "AX 비전을 전사적으로 공유하고, 부서별 AI 활용 로드맵을 수립하십시오."
    );
  }

  if (structure < 50) {
    strategies.push(
      "데이터 인프라 통합과 부서 간 공유 체계 구축이 시급합니다. 데이터 거버넌스 체계를 수립하십시오."
    );
  } else {
    strategies.push(
      "기존 시스템 간 연동을 강화하고, AI 기반 의사결정 파이프라인을 구축하십시오."
    );
  }

  if (execution < 50) {
    strategies.push(
      "AX 전담 조직 구성과 디지털 역량 강화 교육을 즉시 시작하십시오."
    );
  } else {
    strategies.push(
      "파일럿 프로젝트를 선정하여 빠른 성과를 도출하고, 전사 확산 전략을 실행하십시오."
    );
  }

  return strategies;
}

/* ───────── Radar Chart (CSS) ───────── */
function RadarChart({
  awareness,
  structure,
  execution,
}: {
  awareness: number;
  structure: number;
  execution: number;
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const axes = [
    { label: "인식", value: awareness, angle: -90 },
    { label: "구조", value: structure, angle: 30 },
    { label: "실행", value: execution, angle: 150 },
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const dataPoints = axes.map((a) => {
    const r = (a.value / 100) * maxR;
    return {
      x: cx + r * Math.cos(toRad(a.angle)),
      y: cy + r * Math.sin(toRad(a.angle)),
      label: a.label,
      value: a.value,
      lx: cx + (maxR + 28) * Math.cos(toRad(a.angle)),
      ly: cy + (maxR + 28) * Math.sin(toRad(a.angle)),
    };
  });

  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
      >
        {/* Grid */}
        {gridLevels.map((level) => {
          const pts = axes
            .map((a) => {
              const r = level * maxR;
              return `${cx + r * Math.cos(toRad(a.angle))},${cy + r * Math.sin(toRad(a.angle))}`;
            })
            .join(" ");
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={1}
            />
          );
        })}
        {/* Axes */}
        {axes.map((a) => (
          <line
            key={a.label}
            x1={cx}
            y1={cy}
            x2={cx + maxR * Math.cos(toRad(a.angle))}
            y2={cy + maxR * Math.sin(toRad(a.angle))}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />
        ))}
        {/* Data polygon */}
        <polygon
          points={polygon}
          fill="rgba(251,191,36,0.2)"
          stroke="rgb(251,191,36)"
          strokeWidth={2}
        />
        {/* Data points */}
        {dataPoints.map((p) => (
          <circle
            key={p.label}
            cx={p.x}
            cy={p.y}
            r={5}
            fill="rgb(251,191,36)"
            stroke="white"
            strokeWidth={2}
          />
        ))}
        {/* Labels */}
        {dataPoints.map((p) => (
          <text
            key={p.label}
            x={p.lx}
            y={p.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-200 text-xs font-bold"
          >
            {p.label} {p.value}%
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ───────── Main Component ───────── */
export default function ExecutiveDiagnosisPage() {
  const [step, setStep] = useState(0);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    company: "",
    name: "",
    position: "",
    email: "",
  });
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const totalSteps = 5; // 0=기본정보, 1~3=진단, 4=결과

  /* ── handlers ── */
  const updateBasicInfo = (field: keyof BasicInfo, value: string) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }));
  };

  const setAnswer = (id: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleCheckbox = (id: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[id] as string[]) || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [id]: next };
    });
  };

  const canProceed = (): boolean => {
    if (step === 0) {
      return !!(
        basicInfo.company.trim() &&
        basicInfo.name.trim() &&
        basicInfo.position.trim() &&
        basicInfo.email.trim()
      );
    }
    if (step >= 1 && step <= 3) {
      const section = sections[step - 1];
      return section.questions.every((q) => {
        const v = answers[q.id];
        if (v === undefined || v === null) return false;
        if (typeof v === "number") return v > 0;
        if (typeof v === "string") return v.length > 0;
        if (Array.isArray(v)) return v.length > 0;
        return false;
      });
    }
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(0);
    setBasicInfo({ company: "", name: "", position: "", email: "" });
    setAnswers({});
  };

  /* ── scores ── */
  const awarenessScore = calcScore(answers, "a");
  const structureScore = calcScore(answers, "b");
  const executionScore = calcScore(answers, "c");
  const totalScore = Math.round(
    (awarenessScore + structureScore + executionScore) / 3
  );

  /* ── render helpers ── */
  const renderLikert = (q: Question) => (
    <div className="flex items-center gap-2 mt-3">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          onClick={() => setAnswer(q.id, v)}
          className={`relative flex flex-col items-center gap-1 flex-1 py-3 rounded-xl border-2 transition-all duration-200 ${
            answers[q.id] === v
              ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20"
              : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10"
          }`}
        >
          <span className="text-lg font-bold">{v}</span>
          <span className="text-[10px] leading-tight">{likertLabels[v - 1]}</span>
        </button>
      ))}
    </div>
  );

  const renderRadio = (q: Question) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
      {q.options!.map((opt) => (
        <button
          key={opt}
          onClick={() => setAnswer(q.id, opt)}
          className={`text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm ${
            answers[q.id] === opt
              ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20"
              : "bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/10"
          }`}
        >
          <span
            className={`inline-block w-4 h-4 rounded-full border-2 mr-3 align-middle ${
              answers[q.id] === opt
                ? "bg-amber-400 border-amber-400"
                : "border-gray-500"
            }`}
          />
          {opt}
        </button>
      ))}
    </div>
  );

  const renderCheckbox = (q: Question) => {
    const selected = (answers[q.id] as string[]) || [];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {q.options!.map((opt) => (
          <button
            key={opt}
            onClick={() => toggleCheckbox(q.id, opt)}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm ${
              selected.includes(opt)
                ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20"
                : "bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/10"
            }`}
          >
            <span
              className={`inline-block w-4 h-4 rounded mr-3 align-middle border-2 ${
                selected.includes(opt)
                  ? "bg-amber-400 border-amber-400"
                  : "border-gray-500"
              }`}
            >
              {selected.includes(opt) && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
            {opt}
          </button>
        ))}
      </div>
    );
  };

  const renderSelect3 = (q: Question) => (
    <div className="flex gap-3 mt-3">
      {q.options!.map((opt) => (
        <button
          key={opt}
          onClick={() => setAnswer(q.id, opt)}
          className={`flex-1 py-3 rounded-xl border-2 text-center transition-all duration-200 text-sm font-medium ${
            answers[q.id] === opt
              ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20"
              : "bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/10"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const renderQuestion = (q: Question, idx: number) => (
    <div
      key={q.id}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all"
    >
      <div className="flex items-start gap-3 mb-1">
        <span className="flex-shrink-0 w-7 h-7 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center text-sm font-bold">
          {idx + 1}
        </span>
        <p className="text-white font-medium leading-relaxed pt-0.5">{q.text}</p>
      </div>
      {q.type === "likert" && renderLikert(q)}
      {q.type === "radio" && renderRadio(q)}
      {q.type === "checkbox" && renderCheckbox(q)}
      {q.type === "select3" && renderSelect3(q)}
    </div>
  );

  /* ──────────── RENDER ──────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/ax-diagnosis"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            진단 선택으로 돌아가기
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 backdrop-blur-sm rounded-full border border-amber-500/30 text-sm text-amber-300 font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            경영진용 AX 진단
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            AX 전환 준비도 진단
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            {["기본 정보", "인식 진단", "구조 진단", "실행 준비도", "결과"].map(
              (label, i) => (
                <span
                  key={label}
                  className={`${
                    i === step
                      ? "text-amber-400 font-bold"
                      : i < step
                        ? "text-amber-500/60"
                        : ""
                  }`}
                >
                  {label}
                </span>
              )
            )}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* ──── Step 0: 기본 정보 ──── */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </span>
                기본 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(
                  [
                    { key: "company" as const, label: "회사명", placeholder: "주식회사 OOO" },
                    { key: "name" as const, label: "이름", placeholder: "홍길동" },
                    { key: "position" as const, label: "직책", placeholder: "대표이사 / CTO / 팀장" },
                    { key: "email" as const, label: "이메일", placeholder: "example@company.com" },
                  ] as const
                ).map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm text-gray-300 mb-2 font-medium">
                      {field.label}
                      <span className="text-amber-400 ml-1">*</span>
                    </label>
                    <input
                      type={field.key === "email" ? "email" : "text"}
                      value={basicInfo[field.key]}
                      onChange={(e) => updateBasicInfo(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ──── Steps 1~3: 진단 문항 ──── */}
        {step >= 1 && step <= 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={sections[step - 1].icon}
                  />
                </svg>
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {sections[step - 1].title}
                </h2>
                <p className="text-sm text-gray-400">
                  {sections[step - 1].subtitle}
                </p>
              </div>
            </div>
            {sections[step - 1].questions.map((q, idx) =>
              renderQuestion(q, idx)
            )}
          </div>
        )}

        {/* ──── Step 4: 결과 ──── */}
        {step === 4 && (
          <div className="space-y-6">
            {/* 종합 점수 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-2">종합 진단 결과</h2>
              <p className="text-gray-400 text-sm mb-6">
                {basicInfo.company} &middot; {basicInfo.name} {basicInfo.position}
              </p>
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2">
                {totalScore}
                <span className="text-3xl">점</span>
              </div>
              <div className={`text-lg font-bold ${getLevel(totalScore).color}`}>
                AX 준비도: {getLevel(totalScore).label}
              </div>
            </div>

            {/* 레이더 차트 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-white text-center mb-6">
                3축 진단 분석
              </h3>
              <RadarChart
                awareness={awarenessScore}
                structure={structureScore}
                execution={executionScore}
              />
              {/* 개별 점수 */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                  { label: "인식 수준", score: awarenessScore, color: "from-blue-500 to-blue-600" },
                  { label: "구조 성숙도", score: structureScore, color: "from-purple-500 to-purple-600" },
                  { label: "실행 준비도", score: executionScore, color: "from-emerald-500 to-emerald-600" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div
                      className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${item.color}`}
                    >
                      {item.score}%
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{item.label}</div>
                    <div
                      className={`text-xs font-bold mt-1 ${getLevel(item.score).color}`}
                    >
                      {getLevel(item.score).label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 추천 전략 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                추천 전략
              </h3>
              <div className="space-y-4">
                {getStrategies(awarenessScore, structureScore, executionScore).map(
                  (strategy, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 bg-white/5 rounded-xl p-5 border border-white/5"
                    >
                      <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-amber-500/30">
                        {i + 1}
                      </span>
                      <p className="text-gray-200 text-sm leading-relaxed pt-1">
                        {strategy}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* 상세 해석 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                영역별 해석
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "AX 인식 수준",
                    score: awarenessScore,
                    low: "조직 내 AX에 대한 인식이 부족합니다. 경영진과 구성원 대상으로 AI 트랜스포메이션의 필요성과 효과에 대한 교육이 필요합니다.",
                    high: "조직의 AX 인식 수준이 높습니다. 이를 바탕으로 구체적인 실행 계획을 수립하고 빠르게 실행에 옮기십시오.",
                  },
                  {
                    label: "구조 성숙도",
                    score: structureScore,
                    low: "데이터 인프라와 시스템 연동이 부족합니다. AX 전환의 기반이 되는 데이터 거버넌스와 시스템 통합을 우선 추진하십시오.",
                    high: "조직의 디지털 구조가 잘 갖추어져 있습니다. AI 솔루션 도입 시 빠른 통합과 효과 도출이 기대됩니다.",
                  },
                  {
                    label: "실행 준비도",
                    score: executionScore,
                    low: "실행 역량과 자원이 부족한 상태입니다. 전담 조직 구성, 예산 확보, 인력 역량 강화가 선행되어야 합니다.",
                    high: "실행 준비 수준이 높습니다. 파일럿 프로젝트를 통해 빠른 성과를 도출하고 전사 확산에 집중하십시오.",
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold text-sm">{item.label}</span>
                      <span className={`text-sm font-bold ${getLevel(item.score).color}`}>
                        {item.score}% &middot; {getLevel(item.score).label}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full mb-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.score >= 50 ? item.high : item.low}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center pt-2 pb-8">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold transition-all"
              >
                다시 진단하기
              </button>
              <Link
                href="/ax-diagnosis"
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 transition-all"
              >
                홈으로
              </Link>
            </div>
          </div>
        )}

        {/* ──── Navigation ──── */}
        {step < 4 && (
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                이전
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                canProceed()
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30"
                  : "bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed"
              }`}
            >
              {step === 3 ? "결과 보기" : "다음"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}