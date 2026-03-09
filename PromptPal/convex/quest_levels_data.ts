/**
 * Daily quest levels - Combined coding + copywriting challenges.
 * Used for the daily quest pool. Each quest is a standalone level.
 */

const mapDifficulty = (d: string): "beginner" | "intermediate" | "advanced" =>
  d === "easy" ? "beginner" : d === "medium" ? "intermediate" : "advanced";

const questLevels = [
  {
    id: "quest_1",
    title: "The Brutally Honest Update",
    instruction: "Your app just crashed for 2 hours. Write a status page notification that explains the technical cause (a database migration lock) to developers, but sounds incredibly human and apologetic to regular users. No AI fluff like 'we value your patience'.",
    successCriteria: "Technical accuracy for devs + zero corporate-speak for users.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_2",
    title: "The Self-Documenting Feature",
    instruction: "Add a 'Copy to Clipboard' button to a code block, then prompt AI to write a tooltip that explains why the feature exists using a dry, slightly sarcastic brand voice.",
    successCriteria: "Button works + tooltip avoids 'seamlessly copy' or 'empower your workflow'.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_3",
    title: "The Anti-Marketing Landing Page",
    instruction: "Build a React hero section for a privacy-first browser. The copy must explicitly trash-talk 'big tech' without using the words 'innovative', 'secure', or 'fast'.",
    successCriteria: "Code uses Tailwind + copy takes an aggressive, specific stance.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_4",
    title: "The 'Explain Like I'm 5' Debugger",
    instruction: "Paste a complex RegEx. Prompt AI to write a function that tests it, plus a UI comment explaining what it does using an analogy about sorting physical mail.",
    successCriteria: "RegEx logic is correct + analogy contains no AI-typical 'imagine a world' phrasing.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_5",
    title: "The High-Conversion Micro-Interaction",
    instruction: "Design a 'Pricing Toggle' (Monthly vs Yearly). Prompt for the code and a tiny 'nudge' text next to Yearly that sounds like a friend giving you a secret tip on saving money.",
    successCriteria: "Toggle state works + nudge text avoids 'best value' or 'save 20%'.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_6",
    title: "The Error State Personality",
    instruction: "Build a 404 page for a high-end streetwear brand. The code should be minimalist (B&W), and the copy should make the user feel like being lost is actually cooler than being on the right page.",
    successCriteria: "Valid HTML/CSS + copy is elitist and brief, zero 'oops' or 'we can't find that'.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_7",
    title: "The JSON-to-Human Newsletter",
    instruction: "Input a JSON blob of 5 new product releases. Prompt AI to generate a liquid-template email where the copy for each product is written as a 'Hot Take' from a specific disgruntled employee.",
    successCriteria: "JSON mapping is correct + voice is consistently grumpy and specific.",
    difficulty: "hard",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_8",
    title: "The UX Writing Audit",
    instruction: "Build a multi-step signup form. Then, prompt AI to review the 'Success' message for 'AI optimism' and rewrite it to be shorter, flatter, and more realistic.",
    successCriteria: "Form transitions work + success message is under 5 words.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_9",
    title: "The Feature Flag Spec",
    instruction: "Write a prompt to generate a feature flag configuration file, plus a Slack announcement to the engineering team that explains the 'why' using zero passive voice.",
    successCriteria: "Valid Config format + announcement uses only active verbs.",
    difficulty: "hard",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_10",
    title: "The Non-Robot ReadMe",
    instruction: "Prompt AI to write a README.md for an open-source library. Explicitly ban the 'Key Features' and 'Installation' headers. Use conversational headings that ask questions instead.",
    successCriteria: "Markdown is valid + no 'robust' or 'testament' in the text.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_11",
    title: "The Performance Budget Warning",
    instruction: "Write a script that checks bundle size. If it exceeds 500kb, prompt AI to write a terminal warning that sounds like a disappointed minimalist architect.",
    successCriteria: "Script logic works + warning is pretentious and short.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_12",
    title: "The API Error Translator",
    instruction: "Take a raw 'Internal Server Error 500' JSON response. Prompt AI to write a frontend handler that displays a message telling the user exactly what they can do while they wait, without using 'technical difficulties'.",
    successCriteria: "Handler catches error + copy provides a real, non-generic task.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_13",
    title: "The 'No-Bullshit' Cookie Banner",
    instruction: "Code a cookie consent banner. Write the copy to be painfully honest about the fact that you are tracking them to pay for server costs. No 'better experience' lies.",
    successCriteria: "Working 'Accept' logic + zero marketing fluff.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_14",
    title: "The Interactive CLI Tool",
    instruction: "Build a Node.js CLI tool that asks the user for their name. Prompt AI to make the tool's personality 'An Overly Enthusiastic Intern' who uses way too many metaphors about 'climbing the ladder'.",
    successCriteria: "CLI accepts input + personality is consistently annoying and specific.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_15",
    title: "The Comment-Only Refactor",
    instruction: "Paste a messy function. Do not change the code. Prompt AI to add 'Junior Developer' comments that admit they don't know why it works but they're scared to touch it.",
    successCriteria: "Code is untouched + comments feel honest and slightly panicked.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_16",
    title: "The Empty State Storyteller",
    instruction: "Build an 'Empty Inbox' state for an email app. The copy should be a 2-sentence micro-story about what the user could be doing outside instead of looking for emails.",
    successCriteria: "Centred UI state + copy contains no 'All caught up!' clichés.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_17",
    title: "The One-Line Sales Pitch",
    instruction: "Write a Python script that scrapes a website for prices. Then, prompt AI to write a one-sentence sales pitch for the script that would convince a CEO who hates technology.",
    successCriteria: "Script runs + pitch focuses on 'money kept' not 'features added'.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_18",
    title: "The 'Boring' Release Notes",
    instruction: "Given a git diff of 3 small fixes, generate release notes that explicitly apologize for how boring the update is. Ban the word 'excited'.",
    successCriteria: "Diff is accurately summarized + tone is dull and honest.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_19",
    title: "The Passive-Aggressive Linter",
    instruction: "Configure a custom ESLint rule message for 'no-console'. The message should sound like a senior dev who is tired of cleaning up your debug logs.",
    successCriteria: "Linter rule is valid + message is specific and weary.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_20",
    title: "The Accessibility-First Card",
    instruction: "Build a product card with full ARIA labels. Prompt AI to write the 'alt text' for the product image as if it were describing the 'vibe' to a blind fashion critic.",
    successCriteria: "Accessible HTML + alt text is descriptive and opinionated.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_21",
    title: "The Onboarding 'Hard Truth'",
    instruction: "Code a welcome modal for a fitness app. The copy must tell the user that the app won't work unless they actually move. No 'transform your life' fluff.",
    successCriteria: "Modal triggers on load + copy is blunt and realistic.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_22",
    title: "The Commit Message Poet",
    instruction: "Prompt AI to write a git commit message for a major refactor. The first line must be standard (feat: ...), but the body must be a haiku about the code that was deleted.",
    successCriteria: "Conventional commit format + valid 5-7-5 haiku.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_23",
    title: "The Paywall With Personality",
    instruction: "Design a paywall for a technical blog. The copy should explain exactly what the $5 goes toward (e.g., 'buying the author a decent sandwich').",
    successCriteria: "Clean CSS layout + copy is hyper-specific and non-corporate.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_24",
    title: "The API Documentation for Humans",
    instruction: "Take a Swagger/OpenAPI spec. Prompt AI to rewrite the 'Description' fields to explain the endpoints using zero technical jargon. Use kitchen analogies.",
    successCriteria: "Schema is valid + descriptions are plain English.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_25",
    title: "The Dark Mode Defense",
    instruction: "Add a Dark Mode toggle. Prompt AI to write a 1-sentence explanation for why Dark Mode is the only correct way to use the site. Use 'religious zealot' as the tone.",
    successCriteria: "Toggle works + copy is dramatic and opinionated.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_26",
    title: "The Unsubscribe Guilt-Trip",
    instruction: "Code an unsubscribe button. When clicked, a message appears that doesn't say 'we're sorry to see you go,' but instead asks for a book recommendation.",
    successCriteria: "Event listener works + copy is weirdly personal and human.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_27",
    title: "The 'Wait, Really?' Tooltip",
    instruction: "Add a complex settings toggle (e.g., 'Enable Global State Sync'). Write a tooltip that admits even the developers aren't 100% sure why someone would turn this off.",
    successCriteria: "Interactive tooltip + copy is vulnerable and honest.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_28",
    title: "The Password Strength Critic",
    instruction: "Build a password strength meter. Instead of 'Weak' or 'Strong', prompt AI to give the password a grade based on how long it would take a bored teenager to guess it.",
    successCriteria: "Regex validation works + grades are funny and specific.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_29",
    title: "The Minimalist Legal Notice",
    instruction: "Prompt AI to rewrite a standard 'Terms of Service' summary in under 50 words. It must be legally accurate but sound like a casual verbal agreement between friends.",
    successCriteria: "Valid HTML footer + zero 'heretofore' or 'indemnify' language.",
    difficulty: "hard",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_30",
    title: "The Final Synthesis",
    instruction: "Build a complete 'Contact Me' section. The code must be perfect, the form must validate, and the copy must convince a client to hire you by admitting one thing you're actually bad at.",
    successCriteria: "Working form + copy uses 'The Flaw' technique to build trust.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
];

const xpByDifficulty = { easy: 50, medium: 100, hard: 200 };

export function mapQuestToLevel(q: (typeof questLevels)[0], index: number) {
  const type = q.primaryType;
  const difficulty = mapDifficulty(q.difficulty);
  const xp = xpByDifficulty[q.difficulty as keyof typeof xpByDifficulty] ?? 100;

  const base = {
    id: q.id,
    type,
    title: q.title,
    description: q.instruction,
    instruction: q.instruction,
    difficulty,
    passingScore: 70,
    unlocked: false,
    order: 100 + index,
    points: xp,
    estimatedTime: 10,
    tags: ["daily-quest", "combined"],
    learningObjectives: [q.successCriteria],
    grading: {
      method: "llm_judge",
      criteria: [
        {
          id: "meets_success_criteria",
          description: q.successCriteria,
          method: "llm_judge",
          weight: 3,
          required: true,
        },
      ],
      passingCondition: "Success criteria are met.",
      perfectScore: "All criteria pass.",
    },
  };

  if (type === "code") {
    return {
      ...base,
      hints: [`Success criteria: ${q.successCriteria}`],
      starterCode: "<html>\n  <head>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n  </head>\n  <body>\n  </body>\n</html>",
      language: "html",
      lessonTakeaway: q.successCriteria,
    };
  }

  return {
    ...base,
    hints: [`Success criteria: ${q.successCriteria}`],
    starterContext: { instruction: q.instruction, successCriteria: q.successCriteria },
    briefTitle: q.title,
    wordLimit: { max: 800 },
    lessonTakeaway: q.successCriteria,
  };
}

export const questLevelsData = questLevels.map(mapQuestToLevel);
