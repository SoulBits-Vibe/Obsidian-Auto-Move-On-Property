import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	normalizePath,
} from "obsidian";

interface MoveRule {
	property: string;
	value: string;
	folder: string;
}

interface AutoMoveSettings {
	rules: MoveRule[];
	showMoveToast: boolean;
	showDebugToast: boolean;
	watchedFolders: string;
	watchRoot: boolean;
}

const DEFAULT_SETTINGS: AutoMoveSettings = {
	rules: [],
	showMoveToast: true,
	showDebugToast: false,
	watchedFolders: "",
	watchRoot: true,
};

function isMoveRule(value: unknown): value is MoveRule {
	return typeof value === "object" &&
		value !== null &&
		"property" in value &&
		typeof value.property === "string" &&
		"value" in value &&
		typeof value.value === "string" &&
		"folder" in value &&
		typeof value.folder === "string";
}

function parseSettings(data: unknown): Partial<AutoMoveSettings> {
	if (typeof data !== "object" || data === null) {
		return {};
	}

	const settings: Partial<AutoMoveSettings> = {};
	if ("rules" in data && Array.isArray(data.rules)) {
		settings.rules = data.rules.filter(isMoveRule);
	}
	if ("showMoveToast" in data && typeof data.showMoveToast === "boolean") {
		settings.showMoveToast = data.showMoveToast;
	}
	if ("showDebugToast" in data && typeof data.showDebugToast === "boolean") {
		settings.showDebugToast = data.showDebugToast;
	}
	if ("watchedFolders" in data && typeof data.watchedFolders === "string") {
		settings.watchedFolders = data.watchedFolders;
	}
	if ("watchRoot" in data && typeof data.watchRoot === "boolean") {
		settings.watchRoot = data.watchRoot;
	}

	return settings;
}

class AutoMoveOnPropertyPlugin extends Plugin {
	settings: AutoMoveSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new AutoMoveSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				if (!(file instanceof TFile) || file.extension !== "md") {
					return;
				}

				const path = file.path;
				const watchedFolders = (this.settings.watchedFolders || "")
					.split(",")
					.map((folder) => normalizePath(folder.trim()))
					.filter((folder) => folder.length > 0);

				if (this.settings.watchRoot) {
					watchedFolders.push("");
				}

				const isWatched = watchedFolders.some((folder) => {
					if (folder === "") {
						return !path.includes("/");
					}

					return path.startsWith(`${folder}/`) &&
						path.split("/").length === folder.split("/").length + 1;
				});

				if (this.settings.showDebugToast) {
					new Notice(`[Debug] File: ${file.name}, Path: "${path}", Watched: ${isWatched}`);
				}

				if (!isWatched) {
					if (this.settings.showDebugToast) {
						new Notice(`[Debug] Skipping ${file.name} - not in watched location`);
					}
					return;
				}

				const content = await this.app.vault.read(file);
				const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
				if (!match) {
					if (this.settings.showDebugToast) {
						new Notice(`[Debug] No YAML frontmatter found in ${file.name}`);
					}
					return;
				}

				const yaml = match[1];
				if (this.settings.showDebugToast) {
					new Notice(`[Debug] YAML found, checking ${this.settings.rules.length} rules...`);
					new Notice(`[Debug] YAML preview: ${yaml.substring(0, 200).replace(/\n/g, " | ")}`);
				}

				for (const rule of this.settings.rules) {
					const singleMatch = yaml.match(new RegExp(`^${escapeRegex(rule.property)}:[ \t]*["']?([^"'\n]+)["']?`, "m"));
					let matched = false;

					if (singleMatch && (singleMatch[1] || "").trim() === rule.value) {
						matched = true;
						if (this.settings.showDebugToast) {
							new Notice(`[Debug] Match: ${rule.property}=${rule.value} (single-line)`);
						}
					} else {
						const listBlock = yaml.match(new RegExp(`^${escapeRegex(rule.property)}:\\s*\r?\n([\\s\\S]*?)(?=^[\\w-]+:\\s*|$)`, "m"));
						if (listBlock) {
							const items = listBlock[1]
								.split(/\r?\n/)
								.map((line) => line.replace(/^[ \t]*-[ \t]*/, "").trim())
								.filter((item) => item.length > 0);

							if (items.includes(rule.value)) {
								matched = true;
								if (this.settings.showDebugToast) {
									new Notice(`[Debug] Match: ${rule.property}=${rule.value} (list: [${items.join(", ")}])`);
								}
							}
						}
					}

					if (matched) {
						const newFolder = normalizePath(rule.folder);
						const newPath = `${newFolder}/${file.name}`;
						if (path === newPath) {
							return;
						}

						await this.app.vault.adapter.mkdir(newFolder).catch(() => {});
						await this.app.fileManager.renameFile(file, newPath);

						if (this.settings.showMoveToast) {
							new Notice(`Moved: ${file.name} -> ${newFolder}`);
						}
						return;
					}
				}
			})
		);
	}

	async loadSettings(): Promise<void> {
		const data: unknown = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, parseSettings(data));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

class AutoMoveSettingTab extends PluginSettingTab {
	plugin: AutoMoveOnPropertyPlugin;

	constructor(app: App, plugin: AutoMoveOnPropertyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Always watch vault root")
			.setDesc("If enabled, notes in the vault root will always be watched.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.watchRoot)
					.onChange(async (value: boolean) => {
						this.plugin.settings.watchRoot = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Watched folders")
			.setDesc("Comma-separated list of folders to watch (e.g. folder1,folder/folder2). Does not affect vault root.")
			.addText((text) =>
				text
					.setPlaceholder("folder1,folder/folder2")
					.setValue(this.plugin.settings.watchedFolders || "")
					.onChange(async (value) => {
						this.plugin.settings.watchedFolders = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show move notifications")
			.setDesc("Display a toast notification when a file is moved")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showMoveToast)
					.onChange(async (value: boolean) => {
						this.plugin.settings.showMoveToast = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show debug notifications")
			.setDesc("Display detailed debug toast notifications (for troubleshooting)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showDebugToast)
					.onChange(async (value: boolean) => {
						this.plugin.settings.showDebugToast = value;
						await this.plugin.saveSettings();
					})
			);

		const topBar = containerEl.createDiv();
		topBar.setCssStyles({
			display: "flex",
			gap: "10px",
			alignItems: "center",
			marginBottom: "12px",
		});

		const addBtn = topBar.createEl("button", { text: "+ Add Rule" });
		const filterInput = topBar.createEl("input");
		filterInput.type = "text";
		filterInput.placeholder = "filter rules...";
		filterInput.setCssStyles({
			flex: "1",
			padding: "4px 8px",
			borderRadius: "4px",
			border: "1px solid var(--background-modifier-border)",
			background: "var(--background-primary)",
			color: "var(--text-normal)",
		});

		new Setting(containerEl).setName("Move Rules").setHeading();
		const rulesContainer = containerEl.createDiv();

		const renderRules = (filter: string) => {
			rulesContainer.empty();
			const term = filter.toLowerCase();

			this.plugin.settings.rules.forEach((rule: MoveRule, idx: number) => {
				if (
					term &&
					!rule.property.toLowerCase().includes(term) &&
					!rule.value.toLowerCase().includes(term) &&
					!rule.folder.toLowerCase().includes(term)
				) {
					return;
				}

				new Setting(rulesContainer)
					.setName("Rule")
					.addText((text) =>
						text
							.setPlaceholder("Property")
							.setValue(rule.property)
							.onChange(async (value) => {
								rule.property = value;
								await this.plugin.saveSettings();
							})
					)
					.addText((text) =>
						text
							.setPlaceholder("Value")
							.setValue(rule.value)
							.onChange(async (value) => {
								rule.value = value;
								await this.plugin.saveSettings();
							})
					)
					.addText((text) =>
						text
							.setPlaceholder("Folder")
							.setValue(rule.folder)
							.onChange(async (value) => {
								rule.folder = value;
								await this.plugin.saveSettings();
							})
					)
					.addButton((btn) => {
						btn.buttonEl.addClass("mod-destructive");
						btn.setButtonText("Delete")
							.onClick(async () => {
								this.plugin.settings.rules.splice(idx, 1);
								await this.plugin.saveSettings();
								renderRules(filterInput.value);
							});
					});
			});
		};

		addBtn.onclick = async () => {
			this.plugin.settings.rules.unshift({ property: "", value: "", folder: "" });
			await this.plugin.saveSettings();
			filterInput.value = "";
			renderRules("");
		};

		filterInput.addEventListener("input", () => renderRules(filterInput.value));
		renderRules("");
	}
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export = AutoMoveOnPropertyPlugin;
