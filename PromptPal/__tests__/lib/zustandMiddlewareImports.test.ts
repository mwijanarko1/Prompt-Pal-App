import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "../..");
const srcRoot = path.join(projectRoot, "src");
const forbiddenRuntimeImport =
	/import\s+(?!type\b)[^;]*from\s+["']zustand\/middleware["']/;

function collectSourceFiles(dir: string): string[] {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...collectSourceFiles(fullPath));
			continue;
		}

		if (!/\.(ts|tsx)$/.test(entry.name)) {
			continue;
		}

		files.push(fullPath);
	}

	return files;
}

describe("zustand middleware imports", () => {
	it("avoids the ESM middleware barrel that leaks import.meta into web bundles", () => {
		const offendingFiles = collectSourceFiles(srcRoot)
			.filter((filePath) =>
				forbiddenRuntimeImport.test(fs.readFileSync(filePath, "utf8")),
			)
			.map((filePath) => path.relative(projectRoot, filePath));

		expect(offendingFiles).toEqual([]);
	});
});
