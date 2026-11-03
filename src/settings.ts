import { App, Modal, Notice, PluginSettingTab, Setting } from "obsidian";
import type { SettingDefinitionItem } from "obsidian";
import type StatusEmojiPlugin from "./main";

export interface StatusMapping {
	keyword: string;
	emoji: string;
}

export interface StatusEmojiSettings {
	mappings: StatusMapping[];
}

export const DEFAULT_SETTINGS: StatusEmojiSettings = {
	mappings: [
		{ keyword: "done", emoji: "✅" },
		{ keyword: "idea", emoji: "🔵" },
		{ keyword: "work in progress", emoji: "🍊" },
		{ keyword: "bug", emoji: "🪲" },
	],
};

/** Form modal for adding or editing one keyword/emoji pair. */
class MappingModal extends Modal {
	private keyword: string;
	private emoji: string;

	constructor(
		app: App,
		initial: StatusMapping,
		private onSubmit: (mapping: StatusMapping) => void
	) {
		super(app);
		this.keyword = initial.keyword;
		this.emoji = initial.emoji;
	}

	onOpen() {
		const { contentEl } = this;
		this.setTitle("Status mapping");

		new Setting(contentEl)
			.setName("Keyword")
			.setDesc("Matched against the status property, ignoring case.")
			.addText((text) =>
				text.setValue(this.keyword).onChange((value) => {
					this.keyword = value;
				})
			);

		new Setting(contentEl)
			.setName("Emoji")
			.setDesc("Added to the start of the file name.")
			.addText((text) =>
				text.setValue(this.emoji).onChange((value) => {
					this.emoji = value;
				})
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Save")
					.setCta()
					.onClick(() => this.submit())
			)
			.addButton((btn) => btn.setButtonText("Cancel").onClick(() => this.close()));
	}

	onClose() {
		this.contentEl.empty();
	}

	private submit() {
		const keyword = this.keyword.trim();
		const emoji = this.emoji.trim();
		if (!keyword || !emoji) {
			new Notice("Enter both a keyword and an emoji.");
			return;
		}
		this.onSubmit({ keyword, emoji });
		this.close();
	}
}

export class StatusEmojiSettingTab extends PluginSettingTab {
	plugin: StatusEmojiPlugin;

	constructor(app: App, plugin: StatusEmojiPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: "Status keywords",
				desc: "When the status property matches a keyword, the note's file name gets that emoji as a prefix.",
			},
			{
				type: "list",
				heading: "Mappings",
				emptyState: "No mappings yet.",
				addItem: {
					name: "Add mapping",
					action: () => this.editMapping(null),
				},
				onDelete: async (index) => {
					this.plugin.settings.mappings.splice(index, 1);
					await this.plugin.saveSettings();
					this.update();
				},
				items: this.plugin.settings.mappings.map((mapping) => ({
					name: `${mapping.emoji}  ${mapping.keyword}`,
					searchable: false,
					action: (_el: HTMLElement, index: number) => this.editMapping(index),
				})),
			},
		];
	}

	private editMapping(index: number | null) {
		const existing = index === null ? undefined : this.plugin.settings.mappings[index];
		const initial: StatusMapping = {
			keyword: existing?.keyword ?? "",
			emoji: existing?.emoji ?? "",
		};

		new MappingModal(this.app, initial, (result) => {
			const list = this.plugin.settings.mappings;
			if (index === null) list.push(result);
			else list[index] = result;
			void this.plugin.saveSettings().then(() => this.update());
		}).open();
	}
}
