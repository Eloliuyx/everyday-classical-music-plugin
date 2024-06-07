import { App, Plugin, PluginSettingTab, Setting, TFile, Notice } from 'obsidian';
import * as fs from 'fs';
import moment from 'moment';

// Plugin settings interface
interface MyPluginSettings {
    jsonFilePath: string;
    backfillExistingNotes: boolean;
    removeLinksBeforeDate: string;
}

// Default settings
const DEFAULT_SETTINGS: MyPluginSettings = {
    jsonFilePath: '/Users/eloliu/Obsidian/Elo\'s Vault/.obsidian/plugins/everyday-classical-music/dailyMusicLinks.json',
    backfillExistingNotes: false,
    removeLinksBeforeDate: ''
}

// Define the structure of the JSON data
interface MusicPiece {
    name: string;
    author: string;
    link: string;
}

// Main plugin class
export default class EverydayClassicalMusicPlugin extends Plugin {
    settings: MyPluginSettings;
    musicData: Record<string, MusicPiece> = {};
    pluginEnabledTimestamp: number;

    async onload() {
        console.log('Loading Everyday Classical Music Plugin');

        // Load settings
        await this.loadSettings();

        // Load JSON data
        await this.loadJsonData();

        // Get the current timestamp when the plugin is enabled
        this.pluginEnabledTimestamp = Date.now();
        localStorage.setItem('everydayClassicalMusicEnabledTimestamp', this.pluginEnabledTimestamp.toString());

        // Register event to modify daily note on creation
        this.registerEvent(this.app.vault.on('create', this.onFileCreate.bind(this)));

        if (this.settings.backfillExistingNotes) {
            this.backfillExistingNotes();
        }

        // Add settings tab
        this.addSettingTab(new MyPluginSettingTab(this.app, this));
    }

    onunload() {
        console.log('Unloading Everyday Classical Music Plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async loadJsonData() {
        const { jsonFilePath } = this.settings;
        console.log('Loading JSON file from path:', jsonFilePath); // Debug log

        if (jsonFilePath) {
            try {
                const data = fs.readFileSync(jsonFilePath, 'utf-8');
                this.musicData = JSON.parse(data);
                console.log('JSON data successfully loaded'); // Debug log
            } catch (error) {
                console.error('Error loading JSON data:', error);
                new Notice('Failed to load JSON data.');
            }
        } else {
            new Notice('JSON file path is not set.');
        }
    }

    async onFileCreate(file: TFile) {
        const fileCreationTime = moment(file.stat.ctime).valueOf();
        if (this.isDailyNoteFile(file) && fileCreationTime >= this.pluginEnabledTimestamp) {
            await this.addMusicLinkToFile(file);
        }
    }

    async backfillExistingNotes() {
        const files = this.app.vault.getMarkdownFiles();
        for (const file of files) {
            if (this.isDailyNoteFile(file)) {
                await this.addMusicLinkToFile(file);
            }
        }
    }

    async addMusicLinkToFile(file: TFile) {
        const date = file.basename;
        const monthDay = date.slice(5); // Get MM-DD part
        const musicPiece = this.musicData[`2024-${monthDay}`];

        if (musicPiece) {
            const content = await this.app.vault.read(file);

            // Check if the note already contains the music link block
            if (content.includes('> [!tip] Daily Classical Music') || content.includes('[!info] Daily Classical Music') || content.includes('[!quote] Daily Classical Music')) {
                console.log('Music link already present in the note');
                return;
            }

            const musicLink = `[${musicPiece.name} by ${musicPiece.author}](${musicPiece.link})`;
            const quoteBlock = `> [!tip] Daily Classical Music\n> ${musicLink}\n`;

            const propertyFieldsEndIndex = content.indexOf('---', content.indexOf('---') + 1) + 3;
            const newContent = `${content.slice(0, propertyFieldsEndIndex)}\n\n${quoteBlock}\n${content.slice(propertyFieldsEndIndex).trim()}`;

            await this.app.vault.modify(file, newContent);
        }
    }

    async removeLinksBeforeDate(cutoffDate: string) {
        const files = this.app.vault.getMarkdownFiles();
        const cutoff = moment(cutoffDate, 'YYYY-MM-DD');

        for (const file of files) {
            if (this.isDailyNoteFile(file)) {
                const fileDate = moment(file.basename, 'YYYY-MM-DD', true);
                if (fileDate.isValid() && fileDate.isBefore(cutoff)) {
                    let content = await this.app.vault.read(file);
                    const pattern = /> \[!tip\] Daily Classical Music\n> .*?\n\n/;
                    content = content.replace(pattern, '');
                    await this.app.vault.modify(file, content);
                    console.log(`Removed links from: ${file.path}`);
                }
            }
        }
    }

    isDailyNoteFile(file: TFile): boolean {
        const dailyNoteFormat = 'YYYY-MM-DD';  // Adjust if your daily note format is different
        return moment(file.basename, dailyNoteFormat, true).isValid();
    }
}

// Plugin settings tab
class MyPluginSettingTab extends PluginSettingTab {
    plugin: EverydayClassicalMusicPlugin;

    constructor(app: App, plugin: EverydayClassicalMusicPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings for Everyday Classical Music Plugin' });

        new Setting(containerEl)
            .setName('Backfill Existing Notes')
            .setDesc('If enabled, backfill all existing daily notes with classical music suggestions')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.backfillExistingNotes)
                .onChange(async (value) => {
                    this.plugin.settings.backfillExistingNotes = value;
                    await this.plugin.saveSettings();
                    if (value) {
                        await this.plugin.backfillExistingNotes();
                    }
                }));

        new Setting(containerEl)
            .setName('Remove Links Before Date')
            .setDesc('Select a date to remove all the links added before this date')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.removeLinksBeforeDate)
                .onChange(async (value) => {
                    this.plugin.settings.removeLinksBeforeDate = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .addButton(button => {
                button.setButtonText('Remove Links')
                    .setCta()
                    .onClick(async () => {
                        const cutoffDate = this.plugin.settings.removeLinksBeforeDate;
                        if (moment(cutoffDate, 'YYYY-MM-DD', true).isValid()) {
                            await this.plugin.removeLinksBeforeDate(cutoffDate);
                        } else {
                            new Notice('Please enter a valid date in YYYY-MM-DD format');
                        }
                    });
            });

        // Add "Feed the Markhor" button
        const buttonDiv = containerEl.createDiv({ cls: 'ko-fi-button-container' });
        buttonDiv.style.textAlign = 'center';
        buttonDiv.style.marginTop = '20px';

        const koFiButton = buttonDiv.createEl('button', { text: 'Feed the Markhor 🦌🪽' });
        koFiButton.style.backgroundColor = '#FFD6C0'; 
        koFiButton.style.color = '#343434';
        koFiButton.style.border = 'none';
        koFiButton.style.padding = '10px 20px';
        koFiButton.style.fontSize = '16px';
        koFiButton.style.borderRadius = '5px';
        koFiButton.style.cursor = 'pointer';

        koFiButton.onclick = () => {
            window.open('https://ko-fi.com/flyingmarkhor', '_blank');
        };
    }
}
