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
    instruction: "Your app just crashed for 2 hours. Write a status page notification that explains the technical cause (a database migration lock) to developers, but sounds human and apologetic to regular users. Avoid phrases like 'we value your patience' or 'thank you for your understanding.'",
    successCriteria: "(1) Mentions the technical cause (database migration lock). (2) No corporate-speak: no 'we value', 'we apologize for any inconvenience', or 'rest assured'. (3) Sounds genuine and human.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_2",
    title: "The Self-Documenting Feature",
    instruction: "Add a 'Copy to Clipboard' button next to a code snippet on the page. Include a tooltip that explains why the feature exists in a dry, slightly sarcastic tone. Use Tailwind.",
    successCriteria: "(1) A visible Copy button that copies the code when clicked. (2) A tooltip or label explaining the feature. (3) Tooltip avoids 'seamlessly copy' or 'empower your workflow'.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_3",
    title: "The Anti-Marketing Landing Page",
    instruction: "Build a hero section for a privacy-first browser using HTML and Tailwind. The copy must criticize 'big tech' or data harvesting. Do not use the words 'innovative', 'secure', or 'fast'.",
    successCriteria: "(1) Code uses Tailwind and renders a hero section. (2) Copy takes a clear stance against big tech or tracking. (3) None of the words 'innovative', 'secure', or 'fast' appear.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_4",
    title: "The 'Explain Like I'm 5' Debugger",
    instruction: "Build a simple page with a regex input and a test button. Include a short comment or label that explains what the regex does using an analogy (e.g. sorting physical mail). No 'imagine a world' phrasing.",
    successCriteria: "(1) Input field and test button. (2) Regex logic or test behavior works. (3) Explanation uses a concrete analogy. (4) No 'imagine a world' or similar AI phrasing.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_5",
    title: "The High-Conversion Micro-Interaction",
    instruction: "Build a Pricing Toggle (Monthly vs Yearly) with HTML and Tailwind. Add a small nudge text next to Yearly that sounds like a friend giving a secret tip—not 'best value' or 'save 20%'.",
    successCriteria: "(1) Toggle switches between Monthly and Yearly. (2) Nudge text visible next to Yearly. (3) Nudge does not say 'best value' or 'save 20%'.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_6",
    title: "The Error State Personality",
    instruction: "Build a 404 page for a high-end streetwear brand. Use HTML and Tailwind. Minimalist black and white. Copy should make being lost feel cooler than being on the right page. No 'oops' or 'we can't find that'.",
    successCriteria: "(1) Valid HTML with Tailwind. (2) Minimalist B&W layout. (3) Copy is elitist and brief. (4) No 'oops' or 'we can't find that'.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_7",
    title: "The JSON-to-Human Newsletter",
    instruction: "Given a JSON blob of 5 product releases, generate an email template where each product is written as a 'Hot Take' from a disgruntled employee. Voice must be grumpy and specific.",
    successCriteria: "(1) All 5 products from the JSON are included. (2) Each product has a distinct grumpy hot take. (3) No generic or cheerful copy.",
    difficulty: "hard",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_8",
    title: "The UX Writing Audit",
    instruction: "Build a multi-step signup form (e.g. step 1: email, step 2: password). Include a Success message that is short, flat, and realistic—under 5 words. No 'Congratulations!' or 'You did it!'.",
    successCriteria: "(1) Form has at least 2 steps and transitions between them. (2) Success message appears when complete. (3) Success message is 5 words or fewer.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_9",
    title: "The Feature Flag Spec",
    instruction: "Generate a feature flag config (JSON or YAML) with at least 2 flags, plus a short Slack announcement to engineers explaining why. The announcement must use only active verbs—no 'will be', 'is being', or passive voice.",
    successCriteria: "(1) Valid config format (parseable JSON or YAML). (2) At least 2 flags defined. (3) Announcement uses active verbs (e.g. 'We ship', 'We enable'). (4) No passive voice.",
    difficulty: "hard",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_10",
    title: "The Non-Robot ReadMe",
    instruction: "Write a README for an open-source library. No 'Key Features' or 'Installation' headers. Use conversational headings that ask questions (e.g. 'What does this do?'). No 'robust' or 'testament'.",
    successCriteria: "(1) Valid markdown. (2) No 'Key Features' or 'Installation' headers. (3) At least one heading is a question. (4) No 'robust' or 'testament'.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_11",
    title: "The Performance Budget Warning",
    instruction: "Build a page that simulates a bundle size check (e.g. a number input and a 'Check' button). If the value exceeds 500, show a warning message that sounds like a disappointed minimalist architect—pretentious and short.",
    successCriteria: "(1) Input and button. (2) When value > 500, a warning message appears. (3) Warning is short and has a pretentious tone.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_12",
    title: "The API Error Translator",
    instruction: "Build a page that simulates a failed API call (e.g. a 'Fetch' button). When it fails, show a message that tells the user exactly what they can do while they wait. No 'technical difficulties' or generic 'please try again'.",
    successCriteria: "(1) Code handles a simulated or real fetch failure. (2) Error message shows a concrete, actionable task (e.g. 'Grab a coffee', 'Check your inbox'). (3) No 'technical difficulties'.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_13",
    title: "The 'No-Bullshit' Cookie Banner",
    instruction: "Build a cookie consent banner with an Accept button. The copy must be honest about tracking (e.g. to pay for server costs). No 'better experience' or 'personalized content'.",
    successCriteria: "(1) Banner visible with Accept button. (2) Clicking Accept hides or dismisses the banner. (3) Copy mentions tracking or server costs. (4) No 'better experience' or marketing fluff.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_14",
    title: "The Overly Enthusiastic Intern",
    instruction: "Build a simple form that asks for the user's name. When submitted, show a welcome message in the voice of an 'Overly Enthusiastic Intern'—lots of metaphors about 'climbing the ladder' or 'reaching for the stars'.",
    successCriteria: "(1) Name input and submit. (2) Welcome message appears after submit. (3) Message uses enthusiastic intern voice with metaphors.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_15",
    title: "The Comment-Only Refactor",
    instruction: "Add a code block to the page with a messy function. Include comments that sound like a junior dev who doesn't know why it works but is scared to touch it—honest and slightly panicked.",
    successCriteria: "(1) Code block with a function. (2) Comments are present. (3) Comments feel uncertain or panicked (e.g. 'not sure why this works', 'don't touch').",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_16",
    title: "The Empty State Storyteller",
    instruction: "Build an 'Empty Inbox' state for an email app. Centered layout. The copy should be a 2-sentence micro-story about what the user could be doing outside instead of checking email. No 'All caught up!'.",
    successCriteria: "(1) Centered empty state UI. (2) Copy is 2 sentences. (3) Copy suggests an activity outside (e.g. 'outside', 'walk', 'coffee'). (4) No 'All caught up!'.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_17",
    title: "The One-Line Sales Pitch",
    instruction: "Build a page that displays a product (e.g. a price-tracking tool). Write a one-sentence sales pitch that would convince a CEO who hates technology. Focus on money saved or ROI, not features.",
    successCriteria: "(1) A visible product or tool description. (2) One-sentence pitch. (3) Pitch focuses on money/ROI, not 'features' or 'powerful'.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_18",
    title: "The 'Boring' Release Notes",
    instruction: "Given a list of 3 small fixes (e.g. 'Fixed typo', 'Updated dependency'), generate release notes that apologize for how boring the update is. Ban the word 'excited'.",
    successCriteria: "(1) All 3 fixes are included. (2) Tone is dull and apologetic. (3) No 'excited'.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_19",
    title: "The Passive-Aggressive Linter",
    instruction: "Build a page with a text input. When the user types 'console.log' or similar, show a warning message that sounds like a senior dev tired of cleaning up debug logs—specific and weary.",
    successCriteria: "(1) Input field. (2) Warning appears when forbidden pattern is detected. (3) Message sounds like a tired senior dev (e.g. 'again?', 'debug logs').",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_20",
    title: "The Accessibility-First Card",
    instruction: "Build a product card with ARIA labels and role. Include an alt text for the product image that describes the 'vibe' or style—descriptive and opinionated, like a fashion critic.",
    successCriteria: "(1) Product card with image. (2) ARIA attributes or role. (3) Alt text is descriptive and opinionated (not just 'product image').",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_21",
    title: "The Onboarding 'Hard Truth'",
    instruction: "Build a welcome modal for a fitness app that appears on page load. The copy must tell the user the app won't work unless they actually move. No 'transform your life' or motivational fluff.",
    successCriteria: "(1) Modal appears on load. (2) Copy is blunt about needing to move. (3) No 'transform your life' or similar.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_22",
    title: "The Commit Message Poet",
    instruction: "Write a git commit message for a major refactor. First line: conventional format (feat:, fix:, etc.). Body: a haiku (5-7-5 syllables) about the code that was deleted.",
    successCriteria: "(1) First line follows conventional commit format. (2) Body is a valid 5-7-5 haiku. (3) Haiku references code or refactor.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_23",
    title: "The Paywall With Personality",
    instruction: "Build a paywall for a technical blog. Clean layout with Tailwind. Copy must explain exactly what the $5 goes toward (e.g. 'buying the author a decent sandwich')—hyper-specific, not corporate.",
    successCriteria: "(1) Paywall UI with price. (2) Copy specifies what the money goes toward. (3) Copy is specific and non-corporate.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_24",
    title: "The API Documentation for Humans",
    instruction: "Rewrite 2–3 API endpoint descriptions in plain English. Use kitchen or everyday analogies. No technical jargon (no 'endpoint', 'payload', 'authentication' unless explained simply).",
    successCriteria: "(1) At least 2 endpoint descriptions. (2) Plain English. (3) At least one kitchen or everyday analogy.",
    difficulty: "medium",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_25",
    title: "The Dark Mode Defense",
    instruction: "Add a Dark Mode toggle to the page. Include a 1-sentence explanation for why Dark Mode is the only correct way to use the site. Tone: dramatic, opinionated, like a religious zealot.",
    successCriteria: "(1) Toggle switches between light and dark. (2) One-sentence explanation visible. (3) Copy is dramatic and opinionated.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_26",
    title: "The Unsubscribe Guilt-Trip",
    instruction: "Build an 'Unsubscribe' button. When clicked, show a message that does not say 'we're sorry to see you go,' but instead asks for something personal (e.g. a book recommendation).",
    successCriteria: "(1) Unsubscribe button. (2) Click shows a message. (3) Message asks for something personal (e.g. book recommendation). (4) No 'sorry to see you go'.",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_27",
    title: "The 'Wait, Really?' Tooltip",
    instruction: "Add a settings toggle (e.g. 'Enable Global State Sync') with a tooltip. The tooltip should admit the developers aren't 100% sure why someone would turn this off—vulnerable and honest.",
    successCriteria: "(1) Toggle with tooltip. (2) Tooltip is visible on hover or focus. (3) Copy admits uncertainty or is vulnerable.",
    difficulty: "hard",
    primaryType: "code" as const,
  },
  {
    id: "quest_28",
    title: "The Password Strength Critic",
    instruction: "Build a password strength meter. Instead of 'Weak' or 'Strong', show grades based on how long a bored teenager would take to guess it (e.g. '30 seconds', '2 minutes'). Funny and specific.",
    successCriteria: "(1) Password input. (2) Strength feedback updates as user types. (3) Grades are funny and specific (e.g. time-based, not generic).",
    difficulty: "medium",
    primaryType: "code" as const,
  },
  {
    id: "quest_29",
    title: "The Minimalist Legal Notice",
    instruction: "Rewrite a Terms of Service summary in under 50 words. Legally accurate but sounds like a casual verbal agreement between friends. No 'heretofore', 'indemnify', or legalese.",
    successCriteria: "(1) Under 50 words. (2) Covers key terms (e.g. use, liability). (3) Casual tone. (4) No 'heretofore' or 'indemnify'.",
    difficulty: "hard",
    primaryType: "copywriting" as const,
  },
  {
    id: "quest_30",
    title: "The Final Synthesis",
    instruction: "Build a complete 'Contact Me' section. Form with name, email, message. Validate required fields. Copy must admit one thing you're bad at to build trust (the 'flaw' technique).",
    successCriteria: "(1) Form with name, email, message. (2) Validation blocks submit when empty. (3) Copy admits a flaw or weakness. (4) Copy builds trust.",
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
