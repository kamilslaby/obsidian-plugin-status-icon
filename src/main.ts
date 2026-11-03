import { Notice, Plugin, TFile, normalizePath } from "obsidian";
import {
	DEFAULT_SETTINGS,
	StatusEmojiSettings,
	StatusEmojiSettingTab,
} from "./settings";

export default class StatusEmojiPlugin extends Plugin {
	settings: StatusEmojiSettings = {
		mappings: DEFAULT_SETTINGS.mappings.map((m) => ({ ...m })),
	};
	private busy = new Set<TFile>();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new StatusEmojiSettingTab(this.app, this));

		this.registerEvent(
			this.app.metadataCache.on("changed", (file, _data, cache) => {
				const fm = cache?.frontmatter;
				if (!fm) return;
				// property keys are case-sensitive, so accept "status" or "Status"
				const key = Object.keys(fm).find((k) => k.toLowerCase() === "status");
				void this.updateName(file, key ? fm[key] : undefined);
			})
		);
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<StatusEmojiSettings> | null;
		this.settings = {
			mappings: Array.isArray(data?.mappings)
				? data.mappings
				: DEFAULT_SETTINGS.mappings.map((m) => ({ ...m })),
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private emojiFor(status: string): string | undefined {
		const wanted = status.trim().toLowerCase();
		return this.settings.mappings.find(
			(m) => m.keyword.trim().toLowerCase() === wanted && m.emoji
		)?.emoji;
	}

	private async updateName(file: TFile, status: unknown) {
		if (file.extension !== "md" || this.busy.has(file)) return;

		const value = Array.isArray(status) ? status[0] : status;
		if (typeof value !== "string") return;

		const emoji = this.emojiFor(value);
		if (!emoji) return;

		// strip an existing status emoji (any configured one) so a status change swaps it
		let base = file.basename;
		for (const m of this.settings.mappings) {
			if (m.emoji && base.startsWith(m.emoji + " ")) {
				base = base.slice(m.emoji.length + 1);
				break;
			}
		}

		const newName = `${emoji} ${base}`;
		if (newName === file.basename) return;

		const dir = file.parent && !file.parent.isRoot() ? file.parent.path + "/" : "";
		const newPath = normalizePath(`${dir}${newName}.${file.extension}`);

		if (this.app.vault.getAbstractFileByPath(newPath)) {
			new Notice(`Status Emoji: "${newPath}" already exists.`);
			return;
		}

		this.busy.add(file);
		try {
			// keeps links updated (if "automatically update internal links" is on)
			await this.app.fileManager.renameFile(file, newPath);
		} catch (err) {
			console.error("Status Emoji: rename failed", err);
		} finally {
			this.busy.delete(file);
		}
	}
}