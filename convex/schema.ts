import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const dailyQuestRequirements = v.object({
	difficulty: v.optional(v.string()),
	topic: v.optional(v.string()),
	levelId: v.optional(v.string()),
});

export default defineSchema({
	// Apps configuration table
	apps: defineTable({
		id: v.string(), // 'prompt-pal'
		name: v.string(),
		freeLimits: v.object({
			textCalls: v.number(),
			imageCalls: v.number(),
			audioSummaries: v.number(),
			dailyQuests: v.optional(v.number()),
			imageLevels: v.optional(v.number()),
			codingLogicLevels: v.optional(v.number()),
			copywritingLevels: v.optional(v.number()),
		}),
		proLimits: v.object({
			textCalls: v.number(),
			imageCalls: v.number(),
			audioSummaries: v.number(),
			dailyQuests: v.optional(v.number()),
			imageLevels: v.optional(v.number()),
			codingLogicLevels: v.optional(v.number()),
			copywritingLevels: v.optional(v.number()),
		}),
	}).index("by_app_id", ["id"]),

	// User plans and usage tracking
	appPlans: defineTable({
		userId: v.string(), // Clerk user ID
		appId: v.string(), // References apps.id
		tier: v.union(v.literal("free"), v.literal("pro")),
		used: v.object({
			textCalls: v.number(),
			imageCalls: v.number(),
			audioSummaries: v.number(),
			dailyQuests: v.optional(v.number()),
			imageLevels: v.optional(v.number()),
			codingLogicLevels: v.optional(v.number()),
			copywritingLevels: v.optional(v.number()),
		}),
		periodStart: v.number(), // Timestamp for monthly reset
	})
		.index("by_user_app", ["userId", "appId"])
		.index("by_app", ["appId"]),

	// ===== USER MANAGEMENT =====

	// User profiles (extended from Clerk)
	users: defineTable({
		clerkId: v.string(), // Clerk user ID
		name: v.string(),
		email: v.string(),
		avatarUrl: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerk_id", ["clerkId"])
		.index("by_email", ["email"]),

	// User preferences
	userPreferences: defineTable({
		userId: v.string(), // References users.id
		soundEnabled: v.boolean(),
		hapticsEnabled: v.boolean(),
		theme: v.string(), // 'light', 'dark', 'system'
		difficulty: v.string(), // 'easy', 'medium', 'hard'
		favoriteModule: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	// ===== GAMIFICATION SYSTEM =====

	// Comprehensive user statistics for rankings
	userStatistics: defineTable({
		userId: v.string(), // References users.id
		totalXp: v.number(),
		lifetimeXp: v.optional(v.number()),
		walletXp: v.optional(v.number()),
		currentLevel: v.number(),
		currentStreak: v.number(),
		longestStreak: v.number(),
		lastActivityDate: v.optional(v.string()), // ISO date
		globalRank: v.number(),
		points: v.number(), // Calculated total points
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_rank", ["globalRank"])
		.index("by_xp", ["totalXp"]),

	// ===== QUEST-FIRST PRODUCT SYSTEM =====

	learningTracks: defineTable({
		id: v.string(),
		title: v.string(),
		subtitle: v.string(),
		description: v.string(),
		iconKey: v.string(),
		themeKey: v.string(),
		sortOrder: v.number(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_track_id", ["id"])
		.index("by_active_order", ["isActive", "sortOrder"]),

	lessonDefinitions: defineTable({
		id: v.string(),
		trackId: v.string(),
		lessonType: v.union(
			v.literal("code"),
			v.literal("image"),
			v.literal("copywriting"),
		),
		mode: v.union(
			v.literal("teaching"),
			v.literal("practice"),
			v.literal("milestone"),
			v.literal("boss"),
			v.literal("daily"),
		),
		title: v.string(),
		subtitle: v.string(),
		objective: v.string(),
		difficulty: v.union(
			v.literal("beginner"),
			v.literal("intermediate"),
			v.literal("advanced"),
		),
		nodeOrder: v.number(),
		estimatedTimeSeconds: v.number(),
		heartsCost: v.number(),
		rewardXp: v.number(),
		masteryThreshold: v.number(),
		contentPayload: v.any(),
		targetPayload: v.any(),
		scaffoldPayload: v.any(),
		evaluationPayload: v.any(),
		resultPayload: v.any(),
		teachingPayload: v.any(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_lesson_id", ["id"])
		.index("by_track_order", ["trackId", "nodeOrder"])
		.index("by_track_active", ["trackId", "isActive"]),

	questNodes: defineTable({
		id: v.string(),
		trackId: v.string(),
		lessonId: v.string(),
		lessonTitle: v.optional(v.string()),
		lessonSubtitle: v.optional(v.string()),
		difficulty: v.optional(
			v.union(
				v.literal("beginner"),
				v.literal("intermediate"),
				v.literal("advanced"),
			),
		),
		nodeType: v.union(
			v.literal("standard"),
			v.literal("milestone"),
			v.literal("boss"),
			v.literal("reward"),
		),
		pathOrder: v.number(),
		unlockRule: v.any(),
		badgeLabel: v.string(),
		visualMetadata: v.any(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_node_id", ["id"])
		.index("by_track_order", ["trackId", "pathOrder"])
		.index("by_lesson", ["lessonId"]),

	userQuestPathProgress: defineTable({
		userId: v.string(),
		trackId: v.string(),
		currentNodeOrder: v.number(),
		highestUnlockedNodeOrder: v.number(),
		activeNodeId: v.string(),
		completedNodeIds: v.array(v.string()),
		masteredNodeIds: v.array(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_track", ["userId", "trackId"])
		.index("by_user", ["userId"]),

	questRuns: defineTable({
		userId: v.string(),
		trackId: v.string(),
		nodeId: v.string(),
		lessonId: v.string(),
		status: v.union(
			v.literal("started"),
			v.literal("submitted"),
			v.literal("completed"),
			v.literal("failed"),
		),
		startedAt: v.number(),
		submittedAt: v.optional(v.number()),
		completedAt: v.optional(v.number()),
		attemptCount: v.number(),
		heartsRemaining: v.number(),
		timeSpentMs: v.number(),
		finalScore: v.optional(v.number()),
		rewardXp: v.number(),
		rewardClaimed: v.boolean(),
		resultSummary: v.optional(v.any()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_status", ["userId", "status"])
		.index("by_lesson", ["lessonId"]),

	questAttempts: defineTable({
		runId: v.id("questRuns"),
		userId: v.string(),
		lessonId: v.string(),
		submissionPayload: v.any(),
		evaluationPayload: v.any(),
		score: v.number(),
		passed: v.boolean(),
		feedback: v.array(v.string()),
		matchedCriteria: v.array(v.string()),
		createdAt: v.number(),
	})
		.index("by_run", ["runId"])
		.index("by_user", ["userId"])
		.index("by_lesson", ["lessonId"]),

	perkCatalog: defineTable({
		id: v.string(),
		slug: v.string(),
		name: v.string(),
		description: v.string(),
		perkType: v.union(
			v.literal("streak_freeze"),
			v.literal("extra_heart"),
			v.literal("xp_boost"),
			v.literal("skip_token"),
		),
		costXp: v.number(),
		effectValue: v.number(),
		durationSeconds: v.optional(v.number()),
		sortOrder: v.number(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_active_order", ["isActive", "sortOrder"]),

	userPerkInventory: defineTable({
		userId: v.string(),
		perkId: v.string(),
		perkType: v.string(),
		quantity: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_perk", ["userId", "perkId"])
		.index("by_user_type", ["userId", "perkType"]),

	activePerkEffects: defineTable({
		userId: v.string(),
		perkId: v.string(),
		perkType: v.string(),
		targetContext: v.optional(v.any()),
		effectValue: v.number(),
		startedAt: v.number(),
		expiresAt: v.optional(v.number()),
		consumedAt: v.optional(v.number()),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_type", ["userId", "perkType"])
		.index("by_user_active", ["userId", "isActive"]),

	dailyActivity: defineTable({
		userId: v.string(),
		date: v.string(),
		questsCompleted: v.number(),
		xpEarned: v.number(),
		streakProtected: v.boolean(),
		perfectDay: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_date", ["userId", "date"])
		.index("by_user", ["userId"]),

	onboardingProfiles: defineTable({
		userId: v.string(),
		status: v.union(
			v.literal("not_started"),
			v.literal("in_progress"),
			v.literal("completed"),
		),
		experienceLevel: v.optional(v.string()),
		reasonForLearning: v.optional(v.string()),
		selectedTrackId: v.optional(v.string()),
		selectedGoals: v.optional(v.array(v.string())),
		completedAt: v.optional(v.number()),
		version: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	// ===== LEVELS & CHALLENGES SYSTEM =====

	// User level attempts - stores attempt history with scores and feedback
	userLevelAttempts: defineTable({
		userId: v.string(), // References users.id
		levelId: v.string(), // References levels.id
		attemptNumber: v.number(), // 1, 2, 3... per user per level
		score: v.number(), // 0-100 evaluation score
		feedback: v.array(v.string()), // Array of feedback strings (max 10 items, each max 200 chars)
		keywordsMatched: v.array(v.string()), // Array of matched keywords from level's hiddenPromptKeywords
		imageUrl: v.optional(v.string()), // User's generated image URL (must be from *.convex.cloud)
		code: v.optional(v.string()), // Generated code for coding challenges
		copy: v.optional(v.string()), // Generated copy for copywriting challenges
		testResults: v.optional(
			v.array(
				v.object({
					id: v.optional(v.string()),
					name: v.optional(v.string()),
					passed: v.boolean(),
					error: v.optional(v.string()),
					output: v.optional(v.any()),
					expectedOutput: v.optional(v.any()),
					actualOutput: v.optional(v.any()),
					executionTime: v.optional(v.number()),
				}),
			),
		),
		createdAt: v.number(), // Timestamp
	})
		.index("by_user_level", ["userId", "levelId"])
		.index("by_user_created", ["userId", "createdAt"])
		.index("by_created", ["createdAt"]),

	// Comprehensive levels table
	levels: defineTable({
		id: v.string(),
		appId: v.string(),
		type: v.union(
			v.literal("image"),
			v.literal("code"),
			v.literal("copywriting"),
		),
		title: v.string(),
		description: v.optional(v.string()),
		difficulty: v.union(
			v.literal("beginner"),
			v.literal("intermediate"),
			v.literal("advanced"),
		),
		passingScore: v.number(),
		unlocked: v.boolean(),
		isActive: v.boolean(),
		order: v.number(),

		// Image challenge fields
		targetImageUrl: v.optional(v.string()),
		hiddenPromptKeywords: v.optional(v.array(v.string())),
		style: v.optional(v.string()),

		// Code challenge fields
		moduleTitle: v.optional(v.string()),
		requirementBrief: v.optional(v.string()),
		requirementImage: v.optional(v.string()),
		language: v.optional(v.string()),
		functionName: v.optional(v.string()),
		testCases: v.optional(
			v.array(
				v.object({
					input: v.any(),
					expectedOutput: v.any(),
					description: v.optional(v.string()),
				}),
			),
		),
		// Onboarding-style code lessons (prompt-for-UI flow)
		instruction: v.optional(v.string()),
		whatUserSees: v.optional(v.string()),
		starterCode: v.optional(v.string()),
		grading: v.optional(v.any()),
		failState: v.optional(v.any()),
		successState: v.optional(v.any()),
		lessonTakeaway: v.optional(v.string()),

		// Copywriting challenge fields
		starterContext: v.optional(v.any()), // For llm_judge lessons: brand, audience, originalEmail, etc.
		briefTitle: v.optional(v.string()),
		briefProduct: v.optional(v.string()),
		briefTarget: v.optional(v.string()),
		briefTone: v.optional(v.string()),
		briefGoal: v.optional(v.string()),
		wordLimit: v.optional(
			v.object({
				min: v.optional(v.number()),
				max: v.optional(v.number()),
			}),
		),
		requiredElements: v.optional(v.array(v.string())),
		metrics: v.optional(
			v.array(
				v.object({
					name: v.string(),
					target: v.number(),
					weight: v.number(),
				}),
			),
		),
		scaffoldType: v.optional(
			v.union(
				v.literal("template"),
				v.literal("checklist"),
				v.literal("none"),
			),
		),
		scaffoldTemplate: v.optional(v.string()),
		checklistItems: v.optional(v.array(v.string())),
		promptChecklist: v.optional(v.array(v.string())),

		// Common metadata
		hints: v.optional(v.array(v.string())),
		estimatedTime: v.optional(v.number()), // Minutes
		points: v.number(), // XP reward
		tags: v.optional(v.array(v.string())),
		learningObjectives: v.optional(v.array(v.string())),
		prerequisites: v.optional(v.array(v.string())), // Level IDs that must be completed first

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_type", ["type"])
		.index("by_difficulty", ["difficulty"])
		.index("by_app_order", ["appId", "order"]),

	// User progress on levels
	userProgress: defineTable({
		userId: v.string(), // References users.id
		appId: v.string(),
		levelId: v.string(), // References levels.id
		isUnlocked: v.boolean(),
		isCompleted: v.boolean(),
		bestScore: v.number(),
		attempts: v.number(),
		timeSpent: v.number(), // Seconds
		completedAt: v.optional(v.number()),
		hintsUsed: v.number(),
		firstAttemptScore: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_level", ["levelId"])
		.index("by_user_level", ["userId", "levelId"])
		.index("by_user_app", ["userId", "appId"])
		.index("by_completed", ["isCompleted"]),

	// Game sessions for analytics
	gameSessions: defineTable({
		userId: v.string(), // References users.id
		levelId: v.string(), // References levels.id
		startedAt: v.number(),
		endedAt: v.optional(v.number()),
		score: v.number(),
		livesUsed: v.number(),
		hintsUsed: v.number(),
		completed: v.boolean(),
		userPrompt: v.optional(v.string()),
		aiResponse: v.optional(v.any()),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_level", ["levelId"])
		.index("by_user_level", ["userId", "levelId"]),

	// Game progress state
	gameProgress: defineTable({
		userId: v.string(), // References users.id
		appId: v.string(), // App identifier
		currentLevelId: v.optional(v.string()),
		lives: v.number(),
		score: v.number(),
		isPlaying: v.boolean(),
		unlockedLevels: v.array(v.string()),
		completedLevels: v.array(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user_app", ["userId", "appId"]),

	// ===== LEARNING MODULES SYSTEM =====

	// Learning modules
	learningModules: defineTable({
		id: v.string(),
		appId: v.string(),
		category: v.string(),
		title: v.string(),
		level: v.string(), // 'beginner', 'intermediate', 'advanced'
		topic: v.string(),
		icon: v.string(),
		accentColor: v.string(),
		buttonText: v.string(),
		description: v.optional(v.string()),
		objectives: v.optional(v.array(v.string())),
		content: v.optional(v.any()), // Module content/lessons
		type: v.optional(
			v.union(v.literal("module"), v.literal("course"), v.literal("track")),
		),
		format: v.optional(v.string()), // e.g., 'interactive', 'video', 'text'
		estimatedTime: v.optional(v.number()), // Minutes
		tags: v.optional(v.array(v.string())),
		isActive: v.boolean(),
		order: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_category", ["category"])
		.index("by_app", ["appId"]),

	// Individual learning resources (Guides, Cheatsheets, Lexicon)
	learningResources: defineTable({
		id: v.string(),
		appId: v.string(),
		type: v.union(
			v.literal("guide"),
			v.literal("cheatsheet"),
			v.literal("lexicon"),
			v.literal("case-study"),
			v.literal("prompting-tip"),
		),
		title: v.string(),
		description: v.string(),
		content: v.any(), // Structured content based on type
		category: v.string(), // 'IMAGE GENERATION', 'CODING', 'COPYWRITING'
		difficulty: v.union(
			v.literal("beginner"),
			v.literal("intermediate"),
			v.literal("advanced"),
		),
		estimatedTime: v.optional(v.number()), // Minutes
		tags: v.array(v.string()),
		icon: v.optional(v.string()),
		order: v.number(),
		isActive: v.boolean(),
		metadata: v.optional(v.any()), // Additional specific data
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_app_category", ["appId", "category"])
		.index("by_type", ["type"])
		.index("by_active", ["isActive"]),

	// User progress on learning modules
	userModuleProgress: defineTable({
		userId: v.string(), // References users.id
		moduleId: v.string(), // References learningModules.id
		progress: v.number(), // 0-100
		completed: v.boolean(),
		completedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_module", ["moduleId"])
		.index("by_user_module", ["userId", "moduleId"]),

	// User modules (simplified version for compatibility)
	userModules: defineTable({
		userId: v.string(), // References users.id
		appId: v.string(),
		moduleId: v.string(), // References learningModules.id
		level: v.string(),
		topic: v.string(),
		progress: v.number(), // 0-100
		completed: v.boolean(),
		completedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_module", ["userId", "moduleId"])
		.index("by_user_app", ["userId", "appId"]),

	// ===== QUESTS SYSTEM =====

	// Daily quests
	dailyQuests: defineTable({
		id: v.string(),
		appId: v.string(),
		title: v.string(),
		description: v.string(),
		xpReward: v.number(),
		questType: v.union(
			v.literal("image"),
			v.literal("code"),
			v.literal("copywriting"),
		),
		levelId: v.optional(v.string()), // Associated level to complete
		type: v.string(), // 'image', 'code', 'copywriting'
		category: v.string(),
		requirements: dailyQuestRequirements, // Specific requirements for quest
		difficulty: v.string(), // 'easy', 'medium', 'hard'
		isActive: v.boolean(),
		expiresAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_active", ["isActive", "expiresAt"])
		.index("by_type", ["questType"])
		.index("by_app", ["appId"]),

	// User quest completions
	userQuestCompletions: defineTable({
		userId: v.string(), // References users.id
		questId: v.string(), // References dailyQuests.id
		completed: v.boolean(),
		completedAt: v.optional(v.number()),
		score: v.number(),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_quest", ["questId"])
		.index("by_user_quest", ["userId", "questId"]),

	// User daily quest assignments (per-user, per-day)
	userDailyQuests: defineTable({
		userId: v.string(), // References users.id
		appId: v.string(),
		questId: v.string(), // References dailyQuests.id
		assignedDate: v.string(), // UTC date string (YYYY-MM-DD)
		assignedAt: v.number(),
		expiresAt: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_date", ["userId", "assignedDate"])
		.index("by_user_app_date", ["userId", "appId", "assignedDate"]),

	// User quests (simplified version for compatibility)
	userQuests: defineTable({
		userId: v.string(), // References users.id
		appId: v.string(), // App identifier
		questId: v.string(), // References dailyQuests.id
		completed: v.boolean(),
		completedAt: v.optional(v.number()),
		expiresAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user_app", ["userId", "appId"]),

	// ===== FRIENDS SYSTEM =====

	// Friend relationships between users
	userFriends: defineTable({
		userId: v.string(), // User who initiated the friendship
		friendId: v.string(), // The friend user ID
		status: v.union(
			v.literal("pending"),
			v.literal("accepted"),
			v.literal("rejected"),
		),
		requestedAt: v.number(),
		acceptedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_friend", ["friendId"])
		.index("by_user_status", ["userId", "status"])
		.index("by_friend_status", ["friendId", "status"])
		.index("by_user_friend", ["userId", "friendId"]),

	// ===== ACHIEVEMENTS SYSTEM =====

	// Achievements
	achievements: defineTable({
		id: v.string(),
		title: v.string(),
		description: v.string(),
		icon: v.string(),
		rarity: v.union(
			v.literal("common"),
			v.literal("rare"),
			v.literal("epic"),
			v.literal("legendary"),
		),
		conditionType: v.string(), // 'levels_completed', 'streak', 'xp_earned', etc.
		conditionValue: v.number(),
		conditionMetadata: v.optional(v.any()), // Additional condition parameters
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_rarity", ["rarity"]),

	// User achievements
	userAchievements: defineTable({
		userId: v.string(), // References users.id
		achievementId: v.string(), // References achievements.id
		unlockedAt: v.number(),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_achievement", ["achievementId"])
		.index("by_user_achievement", ["userId", "achievementId"]),

	// ===== ANALYTICS & MONITORING =====

	// AI generations history (privacy-safe - no sensitive content)
	aiGenerations: defineTable({
		userId: v.string(), // Clerk user ID
		appId: v.string(), // 'prompt-pal'
		requestId: v.string(), // Unique request identifier
		type: v.union(
			v.literal("text"),
			v.literal("image"),
			v.literal("compare"),
			v.literal("evaluate"),
		),
		model: v.string(), // Model used
		promptLength: v.optional(v.number()), // Length of prompt (characters)
		responseLength: v.optional(v.number()), // Length of response (characters)
		tokensUsed: v.optional(v.number()), // Token usage
		durationMs: v.number(), // Processing time
		success: v.boolean(), // Whether request succeeded
		errorMessage: v.optional(v.string()), // Error details if failed
		createdAt: v.number(), // Timestamp
	})
		.index("by_user_app", ["userId", "appId"])
		.index("by_user_created", ["userId", "createdAt"])
		.index("by_request", ["requestId"]),

	// User events/analytics
	userEvents: defineTable({
		userId: v.string(), // Clerk user ID
		appId: v.string(), // 'prompt-pal'
		eventType: v.string(), // Event name (e.g., "level_started", "quest_completed")
		eventData: v.optional(v.any()), // Additional event data
		sessionId: v.optional(v.string()), // Session identifier
		timestamp: v.number(), // Event timestamp
		userAgent: v.optional(v.string()), // Browser/device info
		ipAddress: v.optional(v.string()), // IP address (anonymized)
	})
		.index("by_user_app", ["userId", "appId"])
		.index("by_event_type", ["eventType"])
		.index("by_timestamp", ["timestamp"]),

	// Error logs
	errorLogs: defineTable({
		userId: v.optional(v.string()), // Clerk user ID (if authenticated)
		appId: v.optional(v.string()), // 'prompt-pal'
		errorType: v.string(), // Error category
		message: v.string(), // Error message
		stack: v.optional(v.string()), // Stack trace
		context: v.optional(v.any()), // Additional context
		userAgent: v.optional(v.string()), // Browser/device info
		timestamp: v.number(), // Error timestamp
	})
		.index("by_user", ["userId"])
		.index("by_timestamp", ["timestamp"]),

	// Performance metrics
	performanceMetrics: defineTable({
		userId: v.optional(v.string()), // Clerk user ID (if authenticated)
		appId: v.string(), // 'prompt-pal'
		metricType: v.string(), // Metric type (e.g., "app_load", "api_response")
		value: v.number(), // Metric value (duration in ms, etc.)
		metadata: v.optional(v.any()), // Additional metric data
		userAgent: v.optional(v.string()), // Browser/device info
		timestamp: v.number(), // Metric timestamp
	})
		.index("by_user", ["userId"])
		.index("by_app_type", ["appId", "metricType"])
		.index("by_timestamp", ["timestamp"]),

	// ===== GENERATED IMAGES STORAGE =====

	// Generated images metadata (references Convex storage)
	generatedImages: defineTable({
		userId: v.string(), // Clerk user ID
		appId: v.string(), // 'prompt-pal'
		fileId: v.id("_storage"), // Convex storage file reference
		prompt: v.string(), // The prompt used to generate the image
		model: v.string(), // Model used (e.g., "gemini-2.5-flash-image")
		requestId: v.string(), // Unique request identifier for tracking
		mimeType: v.string(), // Image MIME type (e.g., "image/png")
		size: v.number(), // File size in bytes
		width: v.optional(v.number()), // Image width (if available)
		height: v.optional(v.number()), // Image height (if available)
		createdAt: v.number(), // Timestamp
	})
		.index("by_user", ["userId"])
		.index("by_app", ["appId"])
		.index("by_request", ["requestId"])
		.index("by_created", ["createdAt"]),

	// ===== RATE LIMITING =====

	// Rate limit tracking
	rateLimits: defineTable({
		identifier: v.string(), // Unique identifier (e.g., "user:userId" or "ip:127.0.0.1")
		count: v.number(), // Number of requests in current window
		windowStart: v.number(), // Timestamp when the window started
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_identifier", ["identifier"])
		.index("by_window", ["windowStart"]),
});
