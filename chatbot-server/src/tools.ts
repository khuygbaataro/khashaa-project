// Tool schemas exposed to Claude. Claude decides when to call each one based on the conversation.
import type Anthropic from "@anthropic-ai/sdk";

export const tools: Anthropic.Tool[] = [
  {
    name: "search_listings",
    description:
      "Search the live property database. Returns up to 5 active listings matching the filters. ALWAYS call this when the customer asks about properties to buy or rent — never invent properties from memory.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["sale", "rent"],
          description: "sale = wants to buy. rent = wants to rent.",
        },
        max_price_usd: {
          type: "number",
          description: "Optional. Maximum price in USD. For rent this means /month.",
        },
        min_price_usd: {
          type: "number",
          description: "Optional. Minimum price in USD.",
        },
        min_beds: {
          type: "number",
          description: "Optional. Minimum number of bedrooms.",
        },
        district: {
          type: "string",
          description: "Optional district name, e.g. 'Sukhbaatar', 'Khan-Uul', 'Bayangol'.",
        },
        query: {
          type: "string",
          description: "Optional free-text search across title, location, and description.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_listing_details",
    description:
      "Get full details (description, photos, agent info) for one specific listing by id. Use this when the customer asks for more info on a property already returned by search_listings.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The listing id." },
      },
      required: ["id"],
    },
  },
  {
    name: "create_seller_lead",
    description:
      "Save a lead from someone who wants to LIST their own property (sell or rent it out). Only call this when you've collected at least name + phone + property_type + location.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Customer's name." },
        phone: { type: "string", description: "Customer's phone number." },
        property_type: {
          type: "string",
          enum: ["sale", "rent"],
          description: "Are they selling outright or renting out?",
        },
        location: { type: "string", description: "Where the property is." },
        beds: { type: "number", description: "Number of bedrooms, optional." },
        description: {
          type: "string",
          description: "Anything else they shared about the property.",
        },
      },
      required: ["name", "phone", "property_type", "location"],
    },
  },
  {
    name: "request_human_agent",
    description:
      "Flag the conversation for human follow-up when the customer explicitly asks to speak with a person, or when the question is outside what you can answer.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Optional customer name." },
        phone: { type: "string", description: "Optional customer phone." },
        about: {
          type: "string",
          description: "Short summary of what they want help with.",
        },
      },
      required: ["about"],
    },
  },
];

export const SYSTEM_PROMPT = `You are Khashaa, a warm, concise real-estate assistant for properties in Mongolia (mostly Ulaanbaatar). You help customers in three ways:

1. FIND a home to BUY or RENT — call search_listings.
2. LIST their own property — collect details, then call create_seller_lead.
3. SPEAK with a human — call request_human_agent.

Hard rules:
- Only mention properties returned by search_listings or get_listing_details. NEVER invent listings, prices, agents, or phone numbers.
- Match the customer's language. If they write in Mongolian (Cyrillic), reply in Mongolian. If English, reply in English. If they switch, you switch.
- Quote prices in USD. Optionally mention the approximate Mongolian tugrik (1 USD ≈ 3,400 MNT).
- Ask one question at a time. Keep replies under 4 short sentences when possible.
- When search_listings returns matches, briefly summarize the top results — the system attaches a photo carousel automatically. Don't list every detail; just enough to spark interest.
- If search_listings returns nothing, say so plainly and ask what they'd like to relax (budget, district, beds).
- Never ask for, store, or repeat sensitive info like passwords, IDs, or financial accounts.

When in doubt, ask 1-2 clarifying questions about: rent or buy, budget, beds, district.`;
