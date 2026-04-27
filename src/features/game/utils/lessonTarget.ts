import type { Level } from "@/features/game/store";

interface LessonTargetBrief {
	primary?: string;
	secondary?: string;
}

function normalizeText(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function getLessonTargetBrief(level?: Level | null): LessonTargetBrief {
	if (!level) return {};

	const primary =
		normalizeText(level.whatUserSees) ??
		normalizeText(level.requirementBrief) ??
		normalizeText(level.briefTitle) ??
		normalizeText(level.description) ??
		normalizeText(level.instruction);

	const secondaryCandidates = [
		normalizeText(level.instruction),
		normalizeText(level.briefGoal),
		normalizeText(level.description),
	].filter((value): value is string => Boolean(value) && value !== primary);

	return {
		primary,
		secondary: secondaryCandidates[0],
	};
}

export function hasMeaningfulHtmlPreview(html?: string | null): boolean {
	if (!html || !html.trim()) return false;
	const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "");
	const bodyMatch = withoutScripts.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	const visibleSource = bodyMatch?.[1] ?? withoutScripts;
	const visibleText = visibleSource
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/gi, " ")
		.trim();
	return visibleText.length > 0;
}

const codingTargetHtmlById: Record<string, string> = {
	"code-1-easy": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50">
    <section class="min-h-[220px] px-8 py-10 flex flex-col items-center justify-center text-center bg-white">
      <p class="text-xs font-bold tracking-[0.2em] uppercase text-emerald-600 mb-3">PromptPal Studio</p>
      <h1 class="text-4xl font-black tracking-tight text-slate-950 mb-4">Build Better Prompts</h1>
      <p class="text-base leading-7 text-slate-600 max-w-xl mb-6">Turn rough ideas into clear instructions that help AI create polished interfaces faster.</p>
      <button class="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white">Start Building</button>
    </section>
  </body>
</html>`,
	"code-2-easy": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-white">
    <nav class="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
      <div class="text-lg font-black text-slate-950">Northstar</div>
      <div class="flex items-center gap-5 text-sm font-semibold text-slate-600">
        <a href="#">Product</a>
        <a href="#">Pricing</a>
        <a href="#">Docs</a>
      </div>
      <button class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Get Started</button>
    </nav>
  </body>
</html>`,
	"code-3-easy": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-white p-8">
    <h1 class="text-2xl font-bold mb-6">Contact Us</h1>
    <form class="max-w-md space-y-4">
      <input class="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Name" />
      <input class="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Email" />
      <textarea class="w-full rounded-xl border border-slate-300 px-4 py-3 min-h-24" placeholder="Message"></textarea>
      <button class="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Submit Message</button>
    </form>
  </body>
</html>`,
	"code-4-easy": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50 p-8">
    <button class="bg-blue-500 text-white px-4 py-2 rounded">Sign Up</button>
    <div class="mt-6 max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="text-xl font-black text-slate-950 mb-2">Create your account</h2>
      <p class="text-sm text-slate-600 mb-4">Enter your email to continue.</p>
      <input class="w-full rounded-xl border border-slate-300 px-4 py-3 mb-3" placeholder="Email address" />
      <button class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Continue</button>
    </div>
  </body>
</html>`,
	"code-5-easy": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="p-8">
    <header class="bg-emerald-700 text-white p-4">
      <h1 class="text-2xl font-bold">My App</h1>
      <nav class="mt-2">
        <a href="#" class="text-emerald-100 mr-4">Home</a>
        <a href="#" class="text-emerald-100 mr-4">About</a>
        <a href="#" class="text-emerald-100">Contact</a>
      </nav>
    </header>
    <main class="mt-8">
      <p class="text-gray-600">Welcome to my app.</p>
    </main>
  </body>
</html>`,
	"code-6-medium": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-white p-8">
    <form class="max-w-sm space-y-3">
      <input type="text" placeholder="Email" class="border border-red-300 p-3 w-full rounded-xl" />
      <p class="text-sm font-semibold text-red-600">Email is required.</p>
      <button class="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold">Submit</button>
    </form>
  </body>
</html>`,
	"code-7-medium": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="p-8 bg-slate-950 text-white">
    <header class="mb-8 flex items-center justify-between">
      <h1 class="text-2xl font-bold">My App</h1>
      <button class="rounded-full border border-white/20 px-4 py-2 text-sm font-bold">Dark Mode On</button>
    </header>
    <main>
      <p class="text-slate-300">Welcome to my app.</p>
    </main>
  </body>
</html>`,
	"code-8-medium": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="p-8 bg-white">
    <h1 class="text-2xl font-bold mb-4">Users</h1>
    <div class="grid gap-3">
      <div class="rounded-xl border border-slate-200 p-4">Leona Park</div>
      <div class="rounded-xl border border-slate-200 p-4">Mateo Ivers</div>
      <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">No users found yet.</div>
      <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">Could not load users. Try again.</div>
    </div>
  </body>
</html>`,
	"code-9-medium": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="p-8 bg-slate-100">
    <div class="border border-slate-200 rounded-2xl p-6 w-72 bg-white shadow-sm space-y-4">
      <h2 class="text-2xl font-black text-slate-950">Card Title</h2>
      <p class="text-slate-600 leading-6">This is the card description text.</p>
      <button class="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">Action</button>
    </div>
  </body>
</html>`,
	"code-10-medium": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <header class="bg-gray-800 text-white p-4 flex items-center justify-between">
      <h1 class="text-xl font-bold">My App</h1>
      <nav class="flex items-center gap-4">
        <a href="#" class="text-gray-300">Dashboard</a>
        <a href="#" class="text-gray-300">Settings</a>
        <button class="rounded-lg bg-white px-3 py-1 text-sm font-bold text-gray-800">Logout</button>
      </nav>
    </header>
  </body>
</html>`,
	"code-11-hard": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="p-16 bg-slate-100 flex justify-center">
    <div class="w-72 rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
      <p class="text-xs font-black tracking-[0.2em] text-emerald-600 uppercase mb-3">Most Popular</p>
      <h2 class="text-2xl font-black text-slate-950">Pro Plan</h2>
      <p class="mt-3 text-4xl font-black">$29<span class="text-base text-slate-500">/mo</span></p>
      <ul class="mt-6 space-y-3 text-sm text-slate-700">
        <li>Feature one</li>
        <li>Feature two</li>
        <li>Feature three</li>
      </ul>
      <button class="mt-7 w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white">Get Started</button>
    </div>
  </body>
</html>`,
	"code-12-hard": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <header class="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 class="text-xl font-bold">TaskFlow</h1>
      <button class="text-sm bg-white text-blue-600 px-3 py-1 rounded">Logout</button>
    </header>
    <main class="p-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold">Your Tasks</h2>
        <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Add task</button>
      </div>
      <ul class="space-y-2">
        <li class="border p-3 rounded bg-white">Buy groceries</li>
        <li class="border p-3 rounded bg-white">Finish project report</li>
      </ul>
    </main>
  </body>
</html>`,
	"code-13-hard": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="p-8 bg-white">
    <form class="space-y-4 max-w-sm rounded-2xl border border-slate-200 p-5">
      <input type="text" placeholder="Username" class="border p-2 w-full rounded" />
      <input type="password" placeholder="Password" class="border p-2 w-full rounded" />
      <button class="bg-blue-600 text-white px-4 py-2 rounded w-full font-bold">Login</button>
      <div class="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Includes loading, error handling, and no hardcoded secrets.</div>
    </form>
  </body>
</html>`,
	"code-14-hard": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50 p-8">
    <section class="mx-auto max-w-lg rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
      <h1 class="text-3xl font-black mb-2">Task Manager</h1>
      <p class="text-slate-600 mb-5">Create, complete, and organize personal tasks.</p>
      <div class="flex gap-2 mb-4">
        <input class="flex-1 rounded-xl border border-slate-300 px-4 py-3" placeholder="Add a task" />
        <button class="rounded-xl bg-slate-950 px-4 py-3 text-white font-bold">Add</button>
      </div>
      <div class="space-y-2">
        <div class="rounded-xl border p-3">Plan project</div>
        <div class="rounded-xl border p-3 line-through text-slate-400">Review notes</div>
      </div>
    </section>
  </body>
</html>`,
	"code-15-hard": `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="p-8 bg-gray-100">
    <article class="max-w-sm rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
      <div class="mb-4 h-12 w-12 rounded-full bg-emerald-100"></div>
      <h2 class="text-2xl font-black text-slate-950">Leanne Graham</h2>
      <p class="text-slate-600">Bret · Romaguera-Crona</p>
      <p class="mt-4 text-sm text-slate-500">Loading and error states are handled before this card appears.</p>
    </article>
  </body>
</html>`,
};

export function getCodingLessonTargetHtml(level?: Level | null): string | null {
	if (!level || level.type !== "code") return null;
	return codingTargetHtmlById[level.id] ?? null;
}
