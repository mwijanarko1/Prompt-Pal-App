import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { allLevels } from "./levels_data";

const logSeed = (...args: unknown[]): void => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args);
  }
};

export const seedApps = action({
  args: {},
  handler: async (ctx) => {
    // Check if PromptPal app already exists
    const existingPromptPal = await ctx.runQuery(api.apps.getApp, { appId: "prompt-pal" });

    if (existingPromptPal) {
      // Update existing app with new limits if needed
      const needsUpdate = existingPromptPal.freeLimits.imageCalls !== 50;
      if (needsUpdate) {
        await ctx.runMutation(api.apps.updateLimits, {
          appId: "prompt-pal",
          freeLimits: {
            textCalls: 50,
            imageCalls: 50,
            audioSummaries: 0,
            dailyQuests: 1,
            imageLevels: 1,
            codingLogicLevels: 3,
            copywritingLevels: 3,
          },
          proLimits: {
            textCalls: 1000,
            imageCalls: 500,
            audioSummaries: 0,
            dailyQuests: 10,
            imageLevels: 50,
            codingLogicLevels: 50,
            copywritingLevels: 50,
          },
        });
        logSeed("Updated PromptPal limits");
      }
    } else {
      // Create new PromptPal app
      await ctx.runMutation(api.apps.insert, {
        id: "prompt-pal",
        name: "Prompt Pal",
        freeLimits: {
          textCalls: 50,
          imageCalls: 50,
          audioSummaries: 0,
          dailyQuests: 1,
          imageLevels: 1,
          codingLogicLevels: 3,
          copywritingLevels: 3,
        },
        proLimits: {
          textCalls: 1000,
          imageCalls: 500,
          audioSummaries: 0,
          dailyQuests: 10,
          imageLevels: 50,
          codingLogicLevels: 50,
          copywritingLevels: 50,
        },
      });
      logSeed("Created PromptPal app");
    }

    logSeed("Apps seeding completed");
  },
});

// Seed learning modules
export const seedLearningModules = action({
  args: {},
  handler: async (ctx) => {
    const modules = [
      {
        id: "image-generation",
        category: "IMAGE GENERATION",
        title: "Image Generation",
        level: "beginner",
        topic: "Visual Prompting",
        icon: "🎨",
        accentColor: "#FF6B6B",
        buttonText: "Start Creating",
        description: "Analyze target images and write prompts to recreate them using Gemini AI. Master the art of visual description and style transfer.",
        objectives: [
          "Understand visual composition and lighting",
          "Learn style and artistic direction keywords",
          "Practice recreating images from textual descriptions"
        ],
      },
      {
        id: "coding-logic",
        category: "CODING & LOGIC",
        title: "Coding and Logic",
        level: "beginner",
        topic: "Algorithmic Prompting",
        icon: "💻",
        accentColor: "#4ECDC4",
        buttonText: "Start Coding",
        description: "Transform programming requirements into functional code. Execute your generated code in a sandbox and verify correctness through automated testing.",
        objectives: [
          "Learn to translate logic into precise prompts",
          "Understand functional correctness in AI code generation",
          "Practice step-by-step algorithmic problem solving"
        ],
      },
      {
        id: "copywriting",
        category: "COPYWRITING",
        title: "Copywriting",
        level: "beginner",
        topic: "Persuasive Prompting",
        icon: "✍️",
        accentColor: "#45B7D1",
        buttonText: "Start Writing",
        description: "Master marketing briefs and generate persuasive copy. Analyze tone, style, and effectiveness against real-world brief requirements.",
        objectives: [
          "Master tone and voice adaptation",
          "Learn copywriting frameworks for AI",
          "Practice audience-focused persuasive writing"
        ],
      },
    ];

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const existing = await ctx.runQuery(api.queries.getLearningModuleById, { id: module.id });
      if (!existing) {
        await ctx.runMutation(api.mutations.createLearningModule, {
          ...module,
          appId: "prompt-pal",
          isActive: true,
          order: i + 1,
        });
        logSeed(`Created learning module: ${module.title}`);
      }
    }

    logSeed("Learning modules seeding completed");
  },
});

// Seed learning resources
export const seedLearningResources = action({
  args: {},
  handler: async (ctx) => {
    const resources = [
      {
        id: "guide-lighting-basics",
        type: "guide" as const,
        title: "Lighting Basics for AI Art",
        description: "Use practical lighting language to control mood, depth, and realism in image prompts.",
        category: "IMAGE GENERATION",
        difficulty: "beginner" as const,
        estimatedTime: 8,
        tags: ["lighting", "composition", "image-gen"],
        icon: "book",
        content: {
          sections: [
            {
              title: "Natural Lighting",
              body: "Use conditions like golden hour, overcast sky, and dappled sunlight to shape color temperature and contrast.",
              tips: "Pair the light source with scene context: 'golden hour street market, long soft shadows'."
            },
            {
              title: "Studio Lighting",
              body: "Keywords like softbox, rim light, and backlight create clean edges and highlight product details.",
              tips: "Mention camera intent: 'softbox portrait with shallow depth of field'."
            },
            {
              title: "Mood Through Contrast",
              body: "Low-key lighting gives dramatic scenes. High-key lighting creates bright, commercial-friendly visuals.",
              tips: "Add one mood word and one contrast term for consistency."
            }
          ]
        }
      },
      {
        id: "lexicon-image-styles",
        type: "lexicon" as const,
        title: "Image Prompt Style Lexicon",
        description: "A fast lookup of style and quality terms that consistently improve image outputs.",
        category: "IMAGE GENERATION",
        difficulty: "beginner" as const,
        estimatedTime: 6,
        tags: ["style", "quality", "lexicon"],
        icon: "text",
        content: {
          terms: [
            {
              term: "Cinematic",
              definition: "Applies film-like grading, composition, and depth.",
              example: "cinematic wide shot, moody color grading, soft grain"
            },
            {
              term: "Photorealistic",
              definition: "Pushes materials, lighting, and detail toward realism.",
              example: "photorealistic product shot, natural reflections, studio backdrop"
            },
            {
              term: "Concept Art",
              definition: "Leans toward exploratory design language and stylized detail.",
              example: "sci-fi concept art, atmospheric perspective, dramatic silhouette"
            }
          ]
        }
      },
      {
        id: "cheatsheet-js-loops",
        type: "cheatsheet" as const,
        title: "JavaScript Loop Patterns for Prompted Code",
        description: "Reference snippets for choosing the right iteration pattern in coding challenges.",
        category: "CODING & LOGIC",
        difficulty: "beginner" as const,
        estimatedTime: 5,
        tags: ["javascript", "loops", "coding"],
        icon: "flash",
        content: {
          snippets: [
            {
              title: "Transform with map",
              code: "const pricesWithTax = prices.map((p) => Number((p * 1.08).toFixed(2)));",
              description: "Use when every input item should produce one output item."
            },
            {
              title: "Filter then map",
              code: "const activeEmails = users.filter((u) => u.active).map((u) => u.email);",
              description: "Split selection and transformation for readable prompts and code."
            },
            {
              title: "Aggregate with reduce",
              code: "const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);",
              description: "Use when you need a single final value."
            }
          ]
        }
      },
      {
        id: "guide-debug-prompted-code",
        type: "guide" as const,
        title: "Debugging AI-Generated Code",
        description: "A repeatable workflow to catch errors, tighten requirements, and iterate quickly.",
        category: "CODING & LOGIC",
        difficulty: "intermediate" as const,
        estimatedTime: 9,
        tags: ["debugging", "iteration", "testing"],
        icon: "book",
        content: {
          sections: [
            {
              title: "Start with Failing Cases",
              body: "Ask the model to produce 3-5 edge-case tests before writing implementation details.",
              tips: "Use: 'List boundary tests first, then implement the function.'"
            },
            {
              title: "Constrain the Output",
              body: "Specify language version, runtime assumptions, and exact function signature to reduce ambiguity.",
              tips: "Include expected complexity when performance matters."
            },
            {
              title: "Refine in Small Deltas",
              body: "Request one change per iteration and preserve known-good behavior with regression tests.",
              tips: "Avoid full rewrites unless the approach is fundamentally wrong."
            }
          ]
        }
      },
      {
        id: "cheatsheet-copy-frameworks",
        type: "cheatsheet" as const,
        title: "Copywriting Framework Cheatsheet",
        description: "Prompt templates for AIDA, PAS, and feature-to-benefit conversion.",
        category: "COPYWRITING",
        difficulty: "beginner" as const,
        estimatedTime: 6,
        tags: ["copywriting", "frameworks", "marketing"],
        icon: "flash",
        content: {
          snippets: [
            {
              title: "AIDA Prompt",
              code: "Write landing page copy using AIDA for [audience], highlighting [core offer], ending with CTA '[cta]'.",
              description: "Reliable structure for ads and landing pages."
            },
            {
              title: "PAS Prompt",
              code: "Write a PAS email for [problem], intensify business impact, then position [product] as the solution.",
              description: "Useful for pain-point led messaging."
            },
            {
              title: "Feature -> Benefit Prompt",
              code: "Convert these features into customer benefits for [persona], with one proof point per claim.",
              description: "Prevents feature-heavy but weak copy."
            }
          ]
        }
      },
      {
        id: "case-study-email-ctr",
        type: "case-study" as const,
        title: "Case Study: Improve Email CTR",
        description: "How better prompt constraints improved a campaign CTA click-through rate.",
        category: "COPYWRITING",
        difficulty: "intermediate" as const,
        estimatedTime: 7,
        tags: ["case-study", "email", "conversion"],
        icon: "bulb",
        content: {
          challenge: "Open rates were healthy, but CTA clicks underperformed because copy was generic and value was unclear.",
          solution: "The team used a stricter prompt template: audience pain points, tone constraints, one concrete proof point, and three CTA options ranked by urgency.",
          result: "CTA click-through increased by 28% over two campaign cycles."
        }
      },
      {
        id: "prompting-tip-iteration-loop",
        type: "prompting-tip" as const,
        title: "Use an Iteration Loop",
        description: "Get stronger outputs by explicitly asking the model to critique and improve its first draft.",
        category: "GENERAL",
        difficulty: "beginner" as const,
        estimatedTime: 4,
        tags: ["prompting", "iteration", "quality"],
        icon: "chatbubble-ellipses",
        content: {
          sections: [
            {
              title: "Request Draft -> Critique -> Rewrite",
              content: "Ask for an initial answer, a short self-critique against your constraints, and a revised final version.",
              example: "Generate a first draft. Then list 3 weaknesses against my goal. Rewrite with those fixed."
            },
            {
              title: "Keep Constraints Stable",
              content: "If the model drifts, restate non-negotiables like format, audience, tone, and length before each rewrite.",
              example: "Keep B2B tone, max 120 words, and include one quantified claim."
            }
          ]
        }
      }
    ];

    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      const payload = {
        ...res,
        appId: "prompt-pal",
        isActive: true,
        order: i + 1,
      };
      const existing = await ctx.runQuery(api.queries.getLearningResourceById, {
        id: res.id,
        appId: "prompt-pal",
      });

      if (existing) {
        await ctx.runMutation(api.mutations.updateLearningResource, payload);
        logSeed(`Updated learning resource: ${res.title}`);
      } else {
        await ctx.runMutation(api.mutations.createLearningResource, payload);
        logSeed(`Created learning resource: ${res.title}`);
      }
    }

    logSeed("Learning resources seeding completed");
  },
});

// Seed game levels
export const seedLevels = action({
  args: {},
  handler: async (ctx) => {
    for (const level of allLevels) {
      const existing = await ctx.runQuery(api.queries.getLevelById, { id: level.id });
      if (!existing) {
        await ctx.runMutation(api.mutations.createLevel, {
          ...level,
          appId: "prompt-pal",
          isActive: true,
        });
        logSeed(`Created level: ${level.title}`);
      } else {
        // Update existing level with new data
        const { id, ...levelData } = level;
        await ctx.runMutation(api.mutations.updateLevel, {
          id: level.id,
          appId: "prompt-pal",
          ...levelData,
          isActive: true,
        });
        logSeed(`Updated level: ${level.title}`);
      }
    }

    logSeed("Levels seeding completed - 30 levels created/updated");
  },
});

// Seed daily quests
export const seedDailyQuests = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(api.mutations.generateDailyQuestPool, {
      appId: "prompt-pal",
    });

    logSeed("Daily quest pool seeded");
  },
});

// Seed achievements
export const seedAchievements = action({
  args: {},
  handler: async (ctx) => {
    const achievements = [
      {
        id: "first-level",
        title: "First Steps",
        description: "Complete your first level",
        icon: "🎯",
        rarity: "common" as const,
        conditionType: "levels_completed",
        conditionValue: 1,
      },
      {
        id: "level-master",
        title: "Level Master",
        description: "Complete 10 levels",
        icon: "🏆",
        rarity: "rare" as const,
        conditionType: "levels_completed",
        conditionValue: 10,
      },
      {
        id: "streak-champion",
        title: "Streak Champion",
        description: "Maintain a 7-day activity streak",
        icon: "🔥",
        rarity: "epic" as const,
        conditionType: "streak",
        conditionValue: 7,
      },
      {
        id: "xp-millionaire",
        title: "XP Millionaire",
        description: "Earn 10,000 XP",
        icon: "💰",
        rarity: "legendary" as const,
        conditionType: "xp_earned",
        conditionValue: 10000,
      },
      {
        id: "perfect-score",
        title: "Perfectionist",
        description: "Achieve a perfect score on any level",
        icon: "⭐",
        rarity: "epic" as const,
        conditionType: "perfect_score",
        conditionValue: 1,
      },
      {
        id: "speed-demon",
        title: "Speed Demon",
        description: "Complete a level in under 5 minutes",
        icon: "⚡",
        rarity: "rare" as const,
        conditionType: "speed_completion",
        conditionValue: 300, // seconds
      },
    ];

    for (const achievement of achievements) {
      const existing = await ctx.runQuery(api.queries.getAchievementById, { id: achievement.id });
      if (!existing) {
        await ctx.runMutation(api.mutations.createAchievement, {
          ...achievement,
        });
        logSeed(`Created achievement: ${achievement.title}`);
      }
    }

    logSeed("Achievements seeding completed");
  },
});

// Master seed function that runs all seeders
export const seedAll = action({
  args: {},
  handler: async (ctx) => {
    logSeed("Starting comprehensive database seeding...");

    await ctx.runAction(api.seed.seedApps, {});
    await ctx.runAction(api.seed.seedLearningModules, {});
    await ctx.runAction(api.seed.seedLearningResources, {});
    await ctx.runAction(api.seed.seedLevels, {});
    await ctx.runAction(api.seed.seedDailyQuests, {});
    await ctx.runAction(api.seed.seedAchievements, {});

    logSeed("All seeding completed successfully!");
  },
});
