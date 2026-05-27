"use client";

import { ArrowRight, BookOpen, Languages, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

type subjectType = {
  id: number;
  icon: LucideIcon;
  name: string;
  description: string;
  pageUrl: string;
};

const subjectsArr: subjectType[] = [
  {
    id: 1,
    name: "Tiếng Trung",
    icon: Languages,
    description: "Luyện từ vựng, ngữ pháp và đề cương quizz Tiếng Trung.",
    pageUrl: "/chinese",
  },
  {
    id: 2,
    name: "Tư Tưởng Hồ Chí Minh",
    icon: BookOpen,
    description: "Hệ thống câu hỏi ôn tập theo chương.",
    pageUrl: "/hcm",
  },
];

function HomePageClient() {
  const router = useRouter();

  return (
    <div className="bg-pink-100 w-full min-h-screen py-10">
      {/* CONTAINER */}
      <div className="mx-auto max-w-200">
        {/* HEADER */}
        <div className="flex flex-col items-center gap-6">
          <div className="bg-white rounded-full flex w-fit text-sm px-5 py-2 items-center gap-3">
            <Sparkles className="text-pink-500" size={20} />
            <span className="text-black/60">
              Ôn tập thông minh — Học hiệu quả
            </span>
          </div>
          <div className="text-5xl w-[90%] text-center font-bold leading-snug">
            <span>Tổng hợp</span>
            <span className="text-[#DD4677]"> Quizz Đề Cương </span>
            <span>theo từng môn học</span>
          </div>
          <span className="text-xs w-[60%] text-black/60 text-center">
            Chọn môn bạn muốn ôn tập bên dưới. Câu hỏi được biên soạn bám sát đề
            cương, giúp bạn ghi nhớ nhanh và tự tin trước kỳ thi.
          </span>
        </div>
        {/* CONTENT */}
        <div className="flex flex-col md:flex-row gap-5 items-center flex-wrap mt-15 w-full">
          {subjectsArr.map((item) => {
            const Icon = item.icon;

            return (
              <div
                onClick={() => {
                  router.push(item.pageUrl);
                }}
                key={item.id}
                className="bg-white group hover:-translate-y-1 transition duration-300 hover:shadow-xl rounded-xl cursor-pointer max-w-95 p-5 flex flex-col gap-3 w-full md:flex-1"
              >
                <div className="w-10 bg-[#DD4677] h-10 rounded-2xl cursor-pointer flex justify-center items-center">
                  <Icon className="text-white" size={20} />
                </div>
                <h2 className="font-bold text-xl">{item.name}</h2>
                <span className="text-xs text-black/60">
                  {item.description}
                </span>
                <div className="flex items-center gap-1 mt-3 font-semibold">
                  <span className="text-xs text-[#DD4677]">Bắt đầu quizz</span>
                  <ArrowRight
                    className="text-[#DD4677] group-hover:translate-x-1 transition duration-300"
                    size={10}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HomePageClient;
