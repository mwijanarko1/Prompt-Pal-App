import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { allLevels } from "./levels_data";

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
        console.log("Updated PromptPal limits");
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
      console.log("Created PromptPal app");
    }

    console.log("Apps seeding completed");
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
        console.log(`Created learning module: ${module.title}`);
      }
    }

    console.log("Learning modules seeding completed");
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
        description: "Master the fundamental lighting terms that drive Gemini's image generation engine.",
        category: "IMAGE GENERATION",
        difficulty: "beginner" as const,
        estimatedTime: 10,
        tags: ["lighting", "basics", "image-gen"],
        icon: "💡",
        content: {
          sections: [
            {
              title: "Natural Lighting",
              text: "Words like 'golden hour', 'overcast', and 'dappled sunlight' create realistic outdoor scenes."
            },
            {
              title: "Studio Lighting",
              text: "Use 'rim lighting', 'softbox', and 'backlit' for professional product-style shots."
            }
          ]
        }
      },
      {
        id: "lexicon-power-words",
        type: "lexicon" as const,
        title: "Prompt Power Words",
        description: "A dictionary of high-impact words to boost your prompt results.",
        category: "IMAGE GENERATION",
        difficulty: "beginner" as const,
        estimatedTime: 5,
        tags: ["keywords", "lexicon"],
        icon: "📖",
        content: {
          entries: [
            { word: "Intricate", definition: "Adds fine detail to complex surfaces." },
            { word: "Cinematic", definition: "Improves color grading and depth of field." }
          ]
        }
      },
      {
        id: "cheatsheet-js-loops",
        type: "cheatsheet" as const,
        title: "JavaScript Loop Patterns",
        description: "Quick reference for the most common JS iteration patterns used in challenges.",
        category: "CODING & LOGIC",
        difficulty: "beginner" as const,
        estimatedTime: 3,
        tags: ["javascript", "loops", "coding"],
        icon: "🔁",
        content: {
          patterns: [
            { name: "Map", code: "const newArray = arr.map(item => ...)" },
            { name: "Filter", code: "const results = arr.filter(item => ...)" }
          ]
        }
      }
    ];

    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      await ctx.runMutation(api.mutations.createLearningResource, {
        ...res,
        appId: "prompt-pal",
        isActive: true,
        order: i + 1,
      });
      console.log(`Created learning resource: ${res.title}`);
    }

    console.log("Learning resources seeding completed");
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
        console.log(`Created level: ${level.title}`);
      } else {
        // Update existing level with new data
        const { id, ...levelData } = level;
        await ctx.runMutation(api.mutations.updateLevel, {
          id: level.id,
          appId: "prompt-pal",
          ...levelData,
          isActive: true,
        });
        console.log(`Updated level: ${level.title}`);
      }
    }

    console.log("Levels seeding completed - 30 levels created/updated");
  },
});

// Seed daily quests
export const seedDailyQuests = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(api.mutations.generateDailyQuestPool, {
      appId: "prompt-pal",
    });

    console.log("Daily quest pool seeded");
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
        console.log(`Created achievement: ${achievement.title}`);
      }
    }

    console.log("Achievements seeding completed");
  },
});

// Master seed function that runs all seeders
export const seedAll = action({
  args: {},
  handler: async (ctx) => {
    console.log("Starting comprehensive database seeding...");

    await ctx.runAction(api.seed.seedApps, {});
    await ctx.runAction(api.seed.seedLearningModules, {});
    await ctx.runAction(api.seed.seedLearningResources, {});
    await ctx.runAction(api.seed.seedLevels, {});
    await ctx.runAction(api.seed.seedDailyQuests, {});
    await ctx.runAction(api.seed.seedAchievements, {});

    console.log("All seeding completed successfully!");
  },
});
