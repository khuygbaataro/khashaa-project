// Tool schemas exposed to Claude. Claude decides when to call each one based on the conversation.
// Prices are in Mongolian tugrik (₮) at the tool boundary; conversion to USD happens
// inside the tool implementation so the model never sees or thinks in dollars.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type Anthropic from "@anthropic-ai/sdk";

export const tools: Anthropic.Tool[] = [
  {
    name: "search_listings",
    description:
      "Манай Firestore мэдээллийн сангаас идэвхтэй байрнуудыг хайна. Хамгийн их 5 үр дүн буцаана. Худалдан авах эсвэл түрээслэх асуултад ВСЕГДА энэ функцыг ашигла — өөрөө байр зохиож хариулж болохгүй.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["sale", "rent"],
          description: "sale = худалдаж авах. rent = түрээслэх.",
        },
        max_price_mnt: {
          type: "number",
          description:
            "Заавал биш. Үнийн дээд хязгаар, ТӨГРӨГӨӨР (бүтэн тоо). Жишээ: 200000000 (=200 сая ₮). Түрээсийн үед сард.",
        },
        min_price_mnt: {
          type: "number",
          description:
            "Заавал биш. Үнийн доод хязгаар, ТӨГРӨГӨӨР (бүтэн тоо).",
        },
        min_beds: {
          type: "number",
          description: "Заавал биш. Хамгийн багадаа хэдэн өрөө.",
        },
        district: {
          type: "string",
          description:
            "Заавал биш. Дүүргийн нэр монголоор. Жишээ: 'Сүхбаатар', 'Хан-Уул', 'Баянзүрх', 'Баянгол', 'Сонгинохайрхан', 'Чингэлтэй', 'Налайх'.",
        },
        query: {
          type: "string",
          description:
            "Заавал биш. Чөлөөт хайлт — гарчиг, байршил, тайлбараар хайна. Хотхоны нэр, хорооллын онцлог нэр энд оруулж болно (жнь 'Зайсан', '100 айл', '13-р хороолол').",
        },
      },
      required: [],
    },
  },
  {
    name: "get_listing_details",
    description:
      "Тодорхой нэг байрны бүрэн мэдээлэл (тайлбар, зураг, агентын мэдээлэл) авах. Харилцагч аль нэг байрны нарийн мэдээллийг асуухад ашигла.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Байрны ID." },
      },
      required: ["id"],
    },
  },
  {
    name: "create_seller_lead",
    description:
      "Байраа зарах эсвэл түрээслүүлэх хүсэлтэй харилцагчийн lead-г бүртгэнэ. Нэр, утас, төрөл, байршил гээд хамгийн багадаа эдгээрийг цуглуулсны дараа л дуудна.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Харилцагчийн нэр." },
        phone: { type: "string", description: "Харилцагчийн утасны дугаар." },
        property_type: {
          type: "string",
          enum: ["sale", "rent"],
          description: "Зарах уу, түрээслүүлэх үү?",
        },
        location: { type: "string", description: "Байрны байршил, хороолол." },
        beds: { type: "number", description: "Өрөөний тоо, заавал биш." },
        description: {
          type: "string",
          description: "Нэмэлт мэдээлэл (талбай, давхар, ашиглалтад орсон жил, бодож буй үнэ зэрэг).",
        },
      },
      required: ["name", "phone", "property_type", "location"],
    },
  },
  {
    name: "request_human_agent",
    description:
      "Харилцагч агенттай шууд ярихыг хүсэх, эсвэл AI-ийн чадахаас давсан асуулт асуувал — энэ функцийг дуудаж бүртгэнэ.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Заавал биш. Харилцагчийн нэр." },
        phone: { type: "string", description: "Заавал биш. Утасны дугаар." },
        about: {
          type: "string",
          description: "Юу тодруулмаар байгаа товч тайлбар.",
        },
      },
      required: ["about"],
    },
  },
];

// Load the system prompt from the .md file next to this module.
// The build step copies system-prompt.md → dist/system-prompt.md.
const here = dirname(fileURLToPath(import.meta.url));
export const SYSTEM_PROMPT: string = readFileSync(
  join(here, "system-prompt.md"),
  "utf-8"
);
