/**
 * Copywriting lessons for the Copywriting module.
 * Teaches prompt engineering for AI-assisted copy.
 * Uses llm_judge grading with custom criteria per lesson.
 * IDs: copywriting-1-easy through copywriting-15-hard (matches legacy slug format)
 *
 * IMPORTANT: Never change lesson IDs. User progress (userProgress table) is keyed by levelId.
 * Changing instruction, title, grading, hints, etc. is safe—only ID changes would orphan progress.
 */

const COPY_IDS = [
	"copywriting-1-easy",
	"copywriting-2-easy",
	"copywriting-3-easy",
	"copywriting-4-medium",
	"copywriting-5-medium",
	"copywriting-6-medium",
	"copywriting-7-medium",
	"copywriting-8-hard",
	"copywriting-9-hard",
	"copywriting-10-hard",
	"copywriting-11-hard",
	"copywriting-12-hard",
	"copywriting-13-hard",
	"copywriting-14-hard",
	"copywriting-15-hard",
];

const copywritingLessonScaffolds: Record<
	string,
	{
		scaffoldTemplate?: string;
		checklistItems?: string[];
	}
> = {
	[COPY_IDS[0]]: {
		scaffoldTemplate:
			"Write a one-sentence tagline for [brand] aimed at [audience] with a [tone] voice",
		checklistItems: ["Brand", "Audience", "Tone"],
	},
	[COPY_IDS[1]]: {
		scaffoldTemplate:
			"Write 3 Instagram captions for [brand] that sound [voice direction] and never say [banned element]",
		checklistItems: ["Brand voice", "Audience", "What the brand never says"],
	},
	[COPY_IDS[2]]: {
		scaffoldTemplate:
			"Write a product description for [product] that highlights [specific detail] and bans [word list]",
		checklistItems: ["Product detail", "Banned words list", "Target audience"],
	},
	[COPY_IDS[3]]: {
		scaffoldTemplate:
			"Rewrite this email for [reader] in a [register] voice so it feels [desired feeling]",
		checklistItems: ["Reader", "Register", "Desired feeling"],
	},
	[COPY_IDS[4]]: {
		scaffoldTemplate:
			"Write a LinkedIn post for [author] arguing that [opinion] for [audience]",
		checklistItems: ["Author perspective", "Specific opinion", "Audience"],
	},
	[COPY_IDS[5]]: {
		checklistItems: ["Name the PAS framework", "Problem", "Agitation", "Solution"],
	},
	[COPY_IDS[6]]: {
		checklistItems: ["Sentence length variation", "Short punchy lines", "Where rhythm should land"],
	},
	[COPY_IDS[7]]: {
		checklistItems: ["Target emotion", "How to create it", "What to avoid"],
	},
	[COPY_IDS[8]]: {
		checklistItems: ["Paste writing sample", "Point at style elements", "Name the new deliverable"],
	},
	[COPY_IDS[9]]: {
		checklistItems: ["Desired CTA", "Audience objection", "How to overcome it"],
	},
};

const copywritingLessonsBase = [
	{
		id: COPY_IDS[0],
		title: "Make the tagline specific to one brand",
		instruction:
			"Your task: get AI to produce a one-sentence tagline for the coffee brand below. Use the context (brand, audience, tone) to craft your own prompt; don't copy the instruction or context verbatim.",
		hint: "If your prompt just says 'write a tagline for a coffee brand,' AI will write something generic. Think about who drinks this coffee, what makes it different, and what feeling it should leave.",
		starterContext: {
			brand: "Blackout Coffee Co.",
			audience: "People who wake up before 5am to train",
			tone: "Raw, no-nonsense, slightly aggressive",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "not_generic",
					description:
						"The tagline could not apply to any other coffee brand. It is specific to this audience and tone.",
					method: "llm_judge",
					weight: 3,
					required: true,
				},
				{
					id: "no_banned_words",
					description:
						"The tagline contains none of the following: robust, bold, premium, artisan, crafted, seamless, innovative, transform.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "matches_tone",
					description:
						"The tagline sounds raw and direct, not polished or corporate.",
					method: "llm_judge",
					weight: 1,
					required: false,
				},
			],
			passingCondition:
				"Both required criteria (not_generic and no_banned_words) pass, and total weight is at least 4 out of 6.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "not_generic fails.",
			nudge:
				"That tagline could be for any coffee brand. What makes this one different? Who exactly is drinking it and why?",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"That's specific enough to belong to one brand. Generic is AI's default. Specific is what you have to ask for.",
		},
		lessonTakeaway:
			"AI defaults to a voice that fits everyone, which means it fits no one. Specificity about audience and tone is what makes copy belong to a brand.",
	},
	{
		id: COPY_IDS[1],
		title: "Include a voice brief in your prompt",
		instruction:
			"Your task: get AI to produce three Instagram captions for the skincare brand below. Craft a prompt that includes a voice brief (how the brand talks, what it never says) and asks for the captions. Use your own words.",
		hint: "A voice brief isn't just 'be friendly.' It describes how the brand talks, what it never says, who it's talking to, and what it sounds like in real life.",
		starterContext: {
			brand: "Glow Theory",
			audience:
				"Women in their late 20s and 30s who are done with overcomplicated routines",
			personality:
				"Sounds like your most knowledgeable friend, not a lab. Confident, a little dry, never preachy.",
			never:
				"Clinical language, exclamation points, the word 'journey', anything that sounds like a wellness influencer",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_includes_voice_brief",
					description:
						"The user's prompt describes the brand voice with enough specificity that a stranger could write in it. It covers tone, audience, and at least one thing the brand never does.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "captions_match_personality",
					description:
						"The three captions sound like the same person talking. They are confident and dry, not bubbly or generic.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "no_banned_elements",
					description:
						"None of the captions contain exclamation points, the word 'journey', clinical language, or influencer-style phrases like 'this one's for you' or 'we see you'.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
			],
			passingCondition: "All three required criteria pass.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "captions_match_personality fails.",
			nudge:
				"The captions sound like they could be from any brand. Your voice brief might not be specific enough. What does this brand sound like compared to its competitors?",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"A good voice brief is reusable. You just built something you could paste into any prompt for this brand and get consistent output.",
		},
		lessonTakeaway:
			"A voice brief that includes what the brand never says is more useful than one that only describes what it does say.",
	},
	{
		id: COPY_IDS[2],
		title: "Ban specific words in your prompt",
		instruction:
			"Your task: get AI to write a product description for the standing desk below. Craft a prompt that bans at least four words or phrases AI tends to overuse, and use your own list, don't copy examples.",
		hint: "Think about which words AI always reaches for when describing a product like this. Then ban them in the prompt before it gets the chance.",
		starterContext: {
			product: "The Frame Desk",
			keyFeature:
				"Adjusts from sitting to standing in two seconds with a single lever, no electricity needed",
			audience: "Remote workers who are tired of overengineered solutions",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_contains_banned_list",
					description:
						"The user's prompt explicitly lists words or phrases that AI should not use. The list includes at least four terms.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "output_contains_no_banned_words",
					description:
						"The generated description contains none of the words the user banned in their prompt.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "description_is_specific",
					description:
						"The description mentions the actual mechanism (the lever, the two-second adjustment) rather than describing the product in vague benefit language.",
					method: "llm_judge",
					weight: 2,
					required: false,
				},
			],
			passingCondition:
				"Both required criteria (prompt_contains_banned_list and output_contains_no_banned_words) pass, and total weight is at least 4 out of 6.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "output_contains_no_banned_words fails.",
			nudge:
				"Some of the words you banned still showed up. Try being more explicit in how you frame the restriction in the prompt.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Banning words before AI writes is faster than editing them out after. You just saved yourself a rewrite.",
		},
		lessonTakeaway:
			"A banned words list in the prompt is one of the highest-leverage things you can add to a copy prompt. AI avoids what you explicitly forbid.",
	},
	{
		id: COPY_IDS[3],
		title: "Match reading level and register to the audience",
		instruction:
			"Your task: get AI to rewrite the email below for the target audience. Craft a prompt that specifies who the reader is and what register to use. Use your own words.",
		hint: "Don't just say 'make it simpler.' Tell AI the exact reading level, who the reader is, and what they should feel after reading it.",
		starterContext: {
			originalEmail:
				"We are pleased to inform you that your subscription renewal has been successfully processed. Our commitment to delivering unparalleled service means that your continued patronage is of the utmost importance to us. Should you require any assistance pertaining to your account, our dedicated support infrastructure remains at your disposal.",
			audience: "Regular people renewing a meal kit subscription",
			targetTone: "Warm, casual, like a text from a friend who works there",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_specifies_reader_and_register",
					description:
						"The user's prompt identifies who the reader is and what register or reading level the copy should be written at.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "no_formal_language_remains",
					description:
						"The rewritten email contains none of the original formal phrasing: no 'patronage', 'pertaining to', 'at your disposal', or 'unparalleled'.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "feels_warm_and_human",
					description:
						"The rewritten email sounds like it was written by a person, not a company. It is conversational and warm without being fake.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
			],
			passingCondition: "All three required criteria pass.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "feels_warm_and_human fails.",
			nudge:
				"It's simpler now but it still sounds like a company talking. Try telling AI exactly who is writing this and who they're writing to, as if they know each other.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Register is one of the things AI gets most wrong by default. You just learned how to correct it at the prompt level.",
		},
		lessonTakeaway:
			"Specifying who the reader is and what register to write in produces a bigger shift in output quality than any other single instruction.",
	},
	{
		id: COPY_IDS[4],
		title: "Give AI a specific opinion to argue",
		instruction:
			"Your task: get AI to write a LinkedIn post about remote work. Craft a prompt that gives it a specific, arguable position to defend. Use the starter context, but put it in your own words.",
		hint: "AI without an opinion writes 'remote work has pros and cons.' Give it a real position to defend and a reason why.",
		starterContext: {
			author:
				"A startup founder who went fully remote in 2020 and has since brought the team back to an office",
			angle:
				"Remote work is great for execution but kills the kind of spontaneous thinking that builds a real company culture",
			audience: "Other founders and team leads on LinkedIn",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_contains_specific_opinion",
					description:
						"The user's prompt gives AI a clear, arguable position to write from, not a balanced 'both sides' framing.",
					method: "llm_judge",
					weight: 3,
					required: true,
				},
				{
					id: "post_takes_a_stand",
					description:
						"The generated post argues a point of view. It does not hedge with 'it depends' or present both sides equally.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "no_linkedin_cliches",
					description:
						"The post contains none of the following: 'hot take', 'unpopular opinion', 'I'll say it', 'this is your sign', or any variation of 'let that sink in'.",
					method: "llm_judge",
					weight: 1,
					required: false,
				},
			],
			passingCondition:
				"Both required criteria (prompt_contains_specific_opinion and post_takes_a_stand) pass, and total weight is at least 4 out of 6.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "post_takes_a_stand fails.",
			nudge:
				"The post is sitting on the fence. AI defaults to balance when it doesn't have a position to argue. Give it one explicitly.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Opinion is what makes copy worth reading. AI can argue a point well when you give it one to argue.",
		},
		lessonTakeaway:
			"AI defaults to balance and hedging. Giving it a specific position to defend is what produces copy with a real point of view.",
	},
	{
		id: COPY_IDS[5],
		title: "Fill a framework with specific content",
		instruction:
			"Your task: get AI to write a sales email for the project management tool below using PAS. Craft a prompt that explains PAS and supplies specific problem, agitation, and solution from the context, in your own words.",
		hint: "Don't just say 'use PAS.' Give AI the actual content for each section so it fills the framework with real specifics, not placeholders.",
		starterContext: {
			product: "Stackr, a project management tool for small agencies",
			problem:
				"Small agencies lose track of client work across Slack, email, and spreadsheets",
			agitation:
				"By the time they realize a deadline was missed, the client already noticed",
			solution:
				"Stackr puts every client, task, and deadline in one place with automatic status updates the client can see in real time",
			audience: "Agency owners with 5-15 person teams",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_maps_pas_content",
					description:
						"The user's prompt provides specific content for each PAS section, not just the framework name.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "email_follows_pas_structure",
					description:
						"The generated email opens with the problem, escalates with agitation, and resolves with the solution in that order.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "email_uses_specific_details",
					description:
						"The email references real specifics like Slack, email, spreadsheets, or client visibility, not generic benefit language.",
					method: "llm_judge",
					weight: 2,
					required: false,
				},
			],
			passingCondition:
				"Both required criteria (prompt_maps_pas_content and email_follows_pas_structure) pass, and total weight is at least 4 out of 6.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "email_follows_pas_structure fails.",
			nudge:
				"The email doesn't follow the PAS structure. Try mapping out the problem, agitation, and solution explicitly in your prompt before asking AI to write.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Naming a framework and filling it with real content is faster than writing the structure yourself. You did both in one prompt.",
		},
		lessonTakeaway:
			"Naming a copywriting framework works best when you also supply the specific content for each section. Otherwise AI fills it with generic placeholders.",
	},
	{
		id: COPY_IDS[6],
		title: "Vary sentence length and rhythm",
		instruction:
			"Your task: get AI to rewrite the paragraph below with varied sentence length and rhythm. Craft a prompt that specifies where short, punchy sentences should appear. Use your own words.",
		hint: "Don't just say 'vary the sentences.' Tell AI specifically to mix very short sentences with longer ones, and tell it where the punchy short ones should land.",
		starterContext: {
			originalParagraph:
				"Our platform helps businesses streamline their operations and improve their overall efficiency. It provides users with a comprehensive suite of tools that are designed to enhance productivity and collaboration. The interface is intuitive and easy to use, making it accessible to teams of all sizes. With our platform, businesses can achieve their goals more effectively and efficiently.",
			product: "A workflow automation tool for operations teams",
			tone: "Direct, confident, slightly impatient with corporate fluff",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_requests_rhythm_variation",
					description:
						"The user's prompt explicitly asks for sentence length variation and gives some direction on where short sentences should appear.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "output_has_varied_sentence_length",
					description:
						"The rewritten paragraph contains at least one sentence under eight words and at least one sentence over twenty words.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "no_uniform_paragraph_blocks",
					description:
						"The rewritten copy does not have every sentence at roughly the same length. The rhythm is uneven in a natural way.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
			],
			passingCondition: "All three required criteria pass.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "output_has_varied_sentence_length fails.",
			nudge:
				"The sentences are still roughly the same length. Try telling AI to write one or two sentences that are under six words, and place them where the most important point lands.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Rhythm is one of the hardest AI tells to fix after the fact. You just learned to fix it at the prompt level.",
		},
		lessonTakeaway:
			"Sentence rhythm variation is what separates copy that reads naturally from copy that reads like a report. Specify it explicitly or AI defaults to uniform blocks.",
	},
	{
		id: COPY_IDS[7],
		title: "Name the target emotion and how to get there",
		instruction:
			"Your task: get AI to write a fundraising appeal for the nonprofit below. Craft a prompt that names the exact emotion you want and how to get there without guilt-tripping. Use your own words.",
		hint: "There's a difference between making someone feel hopeful and making them feel guilty. Tell AI which one you're going for and how to get there.",
		starterContext: {
			organization:
				"First Chapter, a nonprofit that puts books in underserved elementary schools",
			targetEmotion:
				"The reader should feel that their small action has a visible, specific impact. Hopeful, not guilty.",
			avoidance:
				"No poverty porn, no guilt, no statistics without a human face attached",
			audience: "Past donors who gave once and haven't given again",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_names_target_emotion",
					description:
						"The user's prompt explicitly names the emotion the copy should produce and how to get there.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "copy_feels_hopeful_not_guilty",
					description:
						"The generated appeal creates a sense of impact and possibility without making the reader feel bad for not giving sooner.",
					method: "llm_judge",
					weight: 3,
					required: true,
				},
				{
					id: "contains_specific_human_detail",
					description:
						"The appeal includes at least one specific human detail, a child, a book, a moment, rather than relying purely on statistics or abstract impact language.",
					method: "llm_judge",
					weight: 1,
					required: false,
				},
			],
			passingCondition:
				"Both required criteria (prompt_names_target_emotion and copy_feels_hopeful_not_guilty) pass, and total weight is at least 4 out of 6.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "copy_feels_hopeful_not_guilty fails.",
			nudge:
				"The copy is leaning into guilt rather than hope. Try telling AI the specific feeling you want the reader to have after reading the last line.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Naming the target emotion is more precise than naming the tone. You pointed AI at a feeling and it wrote toward it.",
		},
		lessonTakeaway:
			"Specifying the exact emotion the reader should feel, and how to get there without manipulation, is more useful than a generic tone instruction.",
	},
	{
		id: COPY_IDS[8],
		title: "Include a writing sample and point at style elements",
		instruction:
			"Your task: paste a writing sample (100+ words) and get AI to write a product announcement in that style. Craft a prompt that points at specific style elements to replicate (sentence structure, punctuation, etc.). Use your own words.",
		hint: "Point AI at specific things in the sample: the sentence structure, the punctuation habits, the vocabulary level, and how the writer opens and closes ideas.",
		starterContext: {
			task: "Write a product announcement post in the style of the sample the user provides",
			userAction:
				"The user must paste a real writing sample of at least 100 words into their prompt before asking AI to write",
			product:
				"A new feature that lets users schedule social media posts directly from their notes app",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_includes_real_sample",
					description:
						"The user's prompt contains a pasted writing sample of at least 100 words.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "prompt_points_at_specific_style_elements",
					description:
						"The user's prompt identifies specific things in the sample for AI to replicate, not just 'write like this'.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "output_matches_sample_style",
					description:
						"The generated post resembles the writing sample in sentence structure, vocabulary, and rhythm. A reader familiar with the original writer would recognize the style.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
			],
			passingCondition: "All three required criteria pass.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "output_matches_sample_style fails.",
			nudge:
				"The output doesn't sound like the sample. Try pointing AI at two or three specific things in the sample: how long the sentences are, what punctuation the writer uses, and how they open paragraphs.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Giving AI a real sample to match is more reliable than describing a style in abstract terms. You just learned the most powerful voice-matching technique there is.",
		},
		lessonTakeaway:
			"A real writing sample in the prompt produces better style matching than any adjective-based voice description. Point AI at the sample and tell it what specifically to replicate.",
	},
	{
		id: COPY_IDS[9],
		title: "Add one deliberate stylistic imperfection",
		instruction:
			"Your task: get AI to rewrite the headline below with one deliberate stylistic imperfection (fragment, aside, or interruption). Craft a prompt that names the type and where it should go. Use your own words.",
		hint: "Real writers use fragments, interruptions, run-ons, and asides. Tell AI to add one of these deliberately and tell it where.",
		starterContext: {
			originalHeadline:
				"The all-in-one platform that helps growing teams manage projects, communicate effectively, and deliver results on time.",
			brand: "A project management tool for creative agencies",
			tone: "Confident, slightly informal, talks to the user like a peer",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_requests_specific_imperfection",
					description:
						"The user's prompt asks for a specific type of natural imperfection: a fragment, an aside, an interruption, or a run-on. Not just 'make it sound human'.",
					method: "llm_judge",
					weight: 3,
					required: true,
				},
				{
					id: "output_contains_deliberate_imperfection",
					description:
						"The rewritten headline contains a detectable stylistic imperfection that a grammar checker would flag but a human reader would find natural.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "still_communicates_clearly",
					description:
						"The imperfection makes it sound more human without making it confusing or hard to read.",
					method: "llm_judge",
					weight: 1,
					required: false,
				},
			],
			passingCondition:
				"Both required criteria (prompt_requests_specific_imperfection and output_contains_deliberate_imperfection) pass, and total weight is at least 4 out of 6.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "output_contains_deliberate_imperfection fails.",
			nudge:
				"The rewrite is still too clean. Try asking AI specifically for a sentence fragment or a thought that interrupts itself mid-way.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Controlled imperfection is one of the clearest signals of human writing. You prompted for it deliberately instead of hoping AI would find it.",
		},
		lessonTakeaway:
			"Asking for a specific type of imperfection is more effective than asking AI to 'sound human.' Name the technique and tell it where to use it.",
	},
	{
		id: COPY_IDS[10],
		title: "Adapt one message for three channels",
		instruction:
			"Your task: get AI to adapt the core message below for three channels: Tweet (280 chars), Google ad headline (30 chars), email subject (50 chars). Craft a prompt that spells out the rules for each. Use your own words.",
		hint: "A tweet, a Google ad headline, and an email subject line all have different length limits, different reader intents, and different tones. Tell AI all three sets of rules before it writes.",
		starterContext: {
			coreMessage:
				"This budgeting app helps people stop living paycheck to paycheck",
			channels: [
				{
					name: "Tweet",
					rules:
						"Under 280 characters, conversational, can use one emoji, no hashtags",
				},
				{
					name: "Google ad headline",
					rules:
						"Under 30 characters, action-oriented, no punctuation at the end",
				},
				{
					name: "Email subject line",
					rules:
						"Under 50 characters, creates curiosity or urgency without being clickbait, no emoji",
				},
			],
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_specifies_rules_per_channel",
					description:
						"The user's prompt includes the specific constraints for each channel: character limits, tone, and format rules.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "each_version_fits_its_channel",
					description:
						"All three versions are within their character limits and follow the tone appropriate for that channel.",
					method: "llm_judge",
					weight: 3,
					required: true,
				},
				{
					id: "versions_feel_distinct",
					description:
						"The three versions don't feel like variations of the same sentence. Each one is adapted for how people read on that platform.",
					method: "llm_judge",
					weight: 1,
					required: false,
				},
			],
			passingCondition:
				"Both required criteria (prompt_specifies_rules_per_channel and each_version_fits_its_channel) pass, and total weight is at least 4 out of 6.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "each_version_fits_its_channel fails.",
			nudge:
				"At least one version doesn't follow its channel's rules. Make sure your prompt spells out the character limit and tone for each one separately.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"The same message written for three different channels in one prompt. Channel constraints are what separate copy that performs from copy that just exists.",
		},
		lessonTakeaway:
			"The same core message needs a different prompt for every channel. Character limits, tone, and reader intent all change, and AI needs you to specify all three.",
	},
	{
		id: COPY_IDS[11],
		title: "Remove em dashes and formulaic transitions",
		instruction:
			"Your task: get AI to rewrite the blog intro below and strip AI tells. Craft a prompt that lists specific patterns to remove: em dashes, formulaic transitions, neat wrap-ups. Use your own words.",
		hint: "List every specific pattern you want removed. Then tell AI what to replace them with.",
		starterContext: {
			originalIntro:
				"In today's fast-paced world, businesses are constantly looking for ways to stay ahead of the competition. It is important to note that the tools you choose can make or break your success. Moreover, finding the right project management software isn't just about features; it's about finding a solution that truly fits your team's unique needs. In this comprehensive guide, we'll walk you through everything you need to know.",
			topic: "How to choose project management software for a small team",
			targetTone:
				"Opinionated, skips the preamble, talks to the reader like they're already in the middle of the conversation",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_lists_specific_patterns_to_remove",
					description:
						"The user's prompt explicitly lists the patterns to remove: em dashes, formulaic transitions, and neat wrap-up sentences.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "no_em_dashes_in_output",
					description: "The rewritten intro contains zero em dashes.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "no_formulaic_transitions",
					description:
						"The rewritten intro contains none of the following: 'Moreover', 'Furthermore', 'It is important to note', 'In today's world', 'In this guide', or 'In conclusion'.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
			],
			passingCondition: "All three required criteria pass.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "no_em_dashes_in_output or no_formulaic_transitions fails.",
			nudge:
				"Some of the AI tells are still in the output. Try listing each one explicitly as a banned pattern in your prompt.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Em dashes and formulaic transitions are two of the most detectable AI signals in copy. You just learned to kill them at the source.",
		},
		lessonTakeaway:
			"Listing specific patterns to avoid by name gets cleaner results than asking AI to 'sound less like AI.' Be surgical about what you ban.",
	},
	{
		id: COPY_IDS[12],
		title: "Attach a human face to a statistic",
		instruction:
			"Your task: get AI to rewrite the sentence below so the 78% statistic lands emotionally. Craft a prompt that tells it to attach a human detail or consequence to the number. Preserve the statistic. Use your own words.",
		hint: "A statistic on its own is just a number. Tell AI to attach a human face, a moment, or a consequence to it before or after it appears.",
		starterContext: {
			originalSentence:
				"Studies show that 78% of employees feel disengaged at work.",
			context:
				"This is the opening line of a landing page for an employee engagement platform",
			goal: "The reader should feel the weight of that number, not just process it",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_asks_for_human_context",
					description:
						"The user's prompt tells AI to attach a human detail, moment, or consequence to the statistic.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "statistic_is_preserved",
					description:
						"The rewritten copy still includes the 78% statistic and does not change or omit it.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "statistic_feels_emotional",
					description:
						"The statistic is surrounded by language that makes the reader feel what it means, not just understand it intellectually.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
			],
			passingCondition: "All three required criteria pass.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "statistic_feels_emotional fails.",
			nudge:
				"The statistic is still landing flat. Try asking AI to describe what that number looks like for one specific person on one specific day.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Data without context is forgettable. You just learned how to make a number feel like something.",
		},
		lessonTakeaway:
			"Statistics need a human face to land emotionally. Tell AI to attach a moment or consequence to the number, not just report it.",
	},
	{
		id: COPY_IDS[13],
		title: "Audit copy for AI tells and rewrite failures",
		instruction:
			"Your task: get AI to audit the landing page copy below for AI tells and rewrite what fails. Craft a prompt with a specific checklist (banned words, em dashes, rhythm, hedging, CTAs). Use your own words.",
		hint: "Give AI a specific checklist to run against the copy, not just 'does this sound human?' The checklist should cover banned words, em dashes, uniform sentence length, hedging language, and generic CTAs.",
		starterContext: {
			generatedCopy:
				"Welcome to the future of team collaboration. Our innovative platform is designed to seamlessly integrate with your existing workflow, empowering teams to achieve more together. With a robust suite of features, including real-time messaging, task management, and file sharing, you'll have everything you need to transform the way your team works. Get started today and experience the difference.",
			task: "Audit this copy for AI tells and rewrite the sections that fail",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_contains_specific_audit_checklist",
					description:
						"The user's prompt gives AI a checklist of specific AI signals to look for, covering at least four categories: banned words, punctuation, sentence rhythm, hedging, and CTA quality.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "audit_identifies_real_problems",
					description:
						"The AI audit correctly identifies the em dash, the banned words (innovative, seamlessly, robust, empowering, transform), and the generic CTA.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "rewrite_fixes_identified_problems",
					description:
						"The rewritten copy removes the identified AI tells and replaces them with more specific, human-sounding language.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
			],
			passingCondition: "All three required criteria pass.",
			perfectScore: "All three criteria pass.",
		},
		failState: {
			condition: "audit_identifies_real_problems fails.",
			nudge:
				"The audit missed some of the obvious AI tells. Try giving AI a more explicit checklist: banned words, em dashes, uniform sentence length, and generic CTAs as separate items.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"Running an audit prompt before shipping is faster than finding out after. You just built a QA step into your copy workflow.",
		},
		lessonTakeaway:
			"An audit prompt with a specific checklist catches AI tells that a quick read misses. Make it part of the process before anything ships.",
	},
	{
		id: COPY_IDS[14],
		title: "Produce a full campaign from one prompt",
		instruction:
			"Your task: get AI to produce a full campaign from the brief below: headline, subheadline, 3-sentence description, email subject, and CTA. Craft one prompt that sets voice, audience, banned elements, and format for each. Use your own words.",
		hint: "Your prompt needs to do everything at once: set the voice, ban the AI tells, specify the emotion, name the audience, and define the format for each asset. Nothing can be left for AI to guess.",
		starterContext: {
			brand: "Drift",
			product:
				"A sleep tracking ring that gives you a single daily score and one actionable recommendation, nothing else",
			audience:
				"High performers who are already doing everything right but still waking up exhausted",
			voice:
				"Calm, confident, talks like someone who has figured something out and isn't trying to sell you on it",
			avoid:
				"Wellness cliches, exclamation points, em dashes, words like optimize or transform or seamless, any mention of 'hustle culture'",
		},
		grading: {
			method: "llm_judge",
			criteria: [
				{
					id: "prompt_covers_all_requirements",
					description:
						"The user's prompt specifies the voice, the audience, the banned elements, and the format for all five assets.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "all_five_assets_present",
					description:
						"The output contains all five assets: a landing page headline, a subheadline, a 3-sentence product description, an email subject line, and a CTA.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "assets_sound_like_same_writer",
					description:
						"All five pieces share the same voice, tone, and vocabulary level. They read like they came from the same person.",
					method: "llm_judge",
					weight: 2,
					required: true,
				},
				{
					id: "no_ai_tells_present",
					description:
						"The output contains no em dashes, no banned words, no formulaic transitions, and no generic CTAs like 'Learn More' or 'Get Started Today'.",
					method: "llm_judge",
					weight: 1,
					required: true,
				},
				{
					id: "copy_is_specific_to_this_product",
					description:
						"The copy could not be swapped onto a competitor's product. It is specific to the single score, single recommendation mechanic and the exhausted high performer audience.",
					method: "llm_judge",
					weight: 1,
					required: false,
				},
			],
			passingCondition:
				"All four required criteria pass, and total weight is at least 7 out of 8.",
			perfectScore: "All five criteria pass.",
		},
		failState: {
			condition: "Any required criterion fails.",
			nudge:
				"Something is off. Check your prompt against this list: did you set the voice, ban the AI tells, specify the audience, and define the format for every asset? Any gap is something AI filled with a default.",
		},
		successState: {
			condition: "Passing condition is met.",
			feedback:
				"A complete campaign from a single brief, with consistent voice across every asset and no AI tells. That's what a senior copywriter does with AI in half the time it used to take.",
		},
		lessonTakeaway:
			"A complete copy prompt covers voice, audience, banned elements, emotion, and format for every asset. When AI has all of that, it produces work you can actually ship.",
	},
];

export const copywritingLessons = copywritingLessonsBase.map((lesson) => ({
	...lesson,
	...copywritingLessonScaffolds[lesson.id],
}));
