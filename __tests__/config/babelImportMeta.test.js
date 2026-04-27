const babel = require("@babel/core");

const createBabelConfig = require("../../babel.config");

function createApiStub() {
	return {
		cache: jest.fn(),
	};
}

describe("babel config", () => {
	it("transforms import.meta for Metro web bundles", () => {
		const config = createBabelConfig(createApiStub());
		const result = babel.transformSync("const bundleUrl = import.meta.url;", {
			...config,
			babelrc: false,
			configFile: false,
			caller: {
				name: "metro",
				bundler: "metro",
				platform: "web",
				supportsStaticESM: false,
				isDev: true,
			},
			filename: "importMetaProbe.ts",
		});

		expect(result.code).not.toContain("import.meta");
		expect(result.code).toContain("globalThis.__ExpoImportMetaRegistry");
	});
});
