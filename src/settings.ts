import { App, PluginSettingTab, Setting } from "obsidian";
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

export class StatusEmojiSettingTab extends PluginSettingTab {
	plugin: StatusEmojiPlugin;

	constructor(app: App, plugin: StatusEmojiPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Status emoji mappings")
			.setDesc(
				"When the status property matches a keyword, the note's file name gets the emoji as a prefix. Matching ignores case."
			)
			.setHeading();

		this.plugin.settings.mappings.forEach((mapping, index) => {
			new Setting(containerEl)
				.addText((text) =>
					text
						.setPlaceholder("Keyword")
						.setValue(mapping.keyword)
						.onChange(async (value) => {
							mapping.keyword = value;
							await this.plugin.saveSettings();
						})
				)
				.addText((text) => {
					text
						.setPlaceholder("Emoji")
						.setValue(mapping.emoji)
						.onChange(async (value) => {
							mapping.emoji = value.trim();
							await this.plugin.saveSettings();
						});
					text.inputEl.size = 4;
				})
				.addExtraButton((btn) =>
					btn
						.setIcon("trash")
						.setTooltip("Delete mapping")
						.onClick(async () => {
							this.plugin.settings.mappings.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						})
				);
		});

		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText("Add mapping")
				.setCta()
				.onClick(async () => {
					this.plugin.settings.mappings.push({ keyword: "", emoji: "" });
					await this.plugin.saveSettings();
					this.display();
				})
		);
	}
}
