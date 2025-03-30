import { App, Plugin, PluginSettingTab, Setting, TFolder} from 'obsidian';

interface addFolderDataAttrPluginSettings {
	max: string;
	name: string;
	recursive: boolean;
}

const DEFAULT_SETTINGS: addFolderDataAttrPluginSettings = {
	max: "10",
	name: "foldernumber",
	recursive: false
}

export default class addFolderDataAttrPlugin extends Plugin {
	settings: addFolderDataAttrPluginSettings;

	elObserver = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach(node => {
					if (node instanceof Element) {
						if (node.matches(".nav-folder")) {
							this.applycolorinfo();
						}
					}
				});
				mutation.removedNodes.forEach(node => {
					if (node instanceof Element) {
						if (node.matches(".nav-folder")) {
							this.applycolorinfo();
						}
					}
				});
			}
		});
	});

	attrObserver = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			if (mutation.type === "attributes") {
				this.applycolorinfo();
			}
		});
	});

	allfolders: TFolder[] = [];

	applycolorinfo() {
		//const allfolders = this.app.vault.getAllFolders();
		let imax = Number(this.settings.max);

		//for folders in root
		const colorcodethese = [];
		const sortthese: string[] = [];
		const sorttheseCase: {[key:string]: string} = {};

		//for children
		const pathcollector: string[] = [];
		const sortthesechildren: string[] = [];
		const stcCase: {[key:string]: string} = {};
		const datafoldername = `data-${this.settings.name}`;

		//for removal of data attr if recursive toggled on/off
		const removeThese: string[] = [];
		
		for (let folder of this.allfolders) {
			if (!folder.parent) {continue;}
			if (folder.parent.path == "/") {
				sortthese.push(folder.name.toLowerCase());
				sorttheseCase[folder.name.toLowerCase()] = folder.name; //somefolder: SomeFolder
			} else {
				sortthesechildren.push(folder.path);
				stcCase[folder.path.toLowerCase()] = folder.path;

				const parentFolder = folder.path.lastIndexOf(folder.name);
				const folderpath = folder.path.substring(0, parentFolder);
				if (!pathcollector.includes(folderpath)) {
					pathcollector.push(folderpath);
				}
			}
		}

		//sort because getallfolders doesn't grab them in the same order they're sorted in
		sortthese.sort();
		let i = 0;
		for (let x of sortthese) {
			i++;
			if (i > imax) {
				i = 1
			}
			colorcodethese.push({path: sorttheseCase[x], num: i});
		}

		//now for subdirs
		//start with the longest path that we don't hate ourselves with a lot of nested folders
		pathcollector.sort((a, b) => {
			return b.length - a.length;
		});

		for (let path of pathcollector) {
			const sortchildren = [];
			//iterate backwards so we don't screw up by reindexing as we remove
			let maxnum = sortthesechildren.length - 1
			for (let i=maxnum; i >= 0; i--) {
				let folderpath = sortthesechildren[i];

				if (folderpath.startsWith(path) && folderpath.length > path.length) {
					sortchildren.push(folderpath.toLowerCase());
					sortthesechildren.splice(i, 1);
				}
			}

			//sort lowercase paths
			sortchildren.sort();
			let someno = 0;
			for (let child of sortchildren) {
				someno++;
				if (someno > imax) {
					someno = 1
				}
				if (this.settings.recursive) {
					colorcodethese.push({path: stcCase[child], num: someno});
				} else {
					removeThese.push(stcCase[child]);
				}
			}
		}

		for (let folder of colorcodethese) {
			const element = document.querySelector(`[data-path="${folder.path}"]`);
			if (!element) {continue;}

			const parent = element.parentElement;
			if (!parent) {continue;}
			parent.setAttribute(datafoldername, folder.num.toString());
		}

		for (let folder of removeThese) {
			const element = document.querySelector(`[data-path="${folder}"]`);
			if (!element) {continue;}

			const parent = element.parentElement;
			if (!parent) {continue;}
			parent.removeAttribute(datafoldername);
		}
	}
	
	async onload() {
		await this.loadSettings();

		this.app.workspace.onLayoutReady(() => {
			this.allfolders = this.app.vault.getAllFolders();
			//useful for when plugin is first added to vault;
			this.applycolorinfo();

			const watchThis = document.querySelector(".nav-files-container");
			if (watchThis) {
				this.elObserver.observe(watchThis, {childList:true, subtree: true});
			}

			const watchThisMobile = document.querySelector(".workspace-drawer.mod-left");
			if (watchThisMobile) {
				this.attrObserver.observe(watchThisMobile, {attributes: true, childList:false, subtree:false});
			}

			//update allfolders if needed
			this.registerEvent(this.app.vault.on('create', (thisFile) => {
				if (thisFile instanceof TFolder) {
					this.allfolders = this.app.vault.getAllFolders();
				}
			}));

			this.registerEvent(this.app.vault.on('rename', (thisFile) => {
				if (thisFile instanceof TFolder) {
					this.allfolders = this.app.vault.getAllFolders();
				}
			}));
		});

		this.addSettingTab(new addFolderDataAttrSettingsTab(this.app, this));
	}

	onunload() {
		this.elObserver.disconnect();
		this.attrObserver.disconnect();

		let allfolders = this.app.vault.getAllFolders();

		for (let folder of allfolders) {
			const element = document.querySelector(`[data-path="${folder.path}"]`);
			if (!element) {continue;}
			const parent = element.parentElement;
			if (!parent) {continue;}
			parent.removeAttribute(`data-${this.settings.name}`);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class addFolderDataAttrSettingsTab extends PluginSettingTab {
	plugin: addFolderDataAttrPlugin;

	constructor(app: App, plugin: addFolderDataAttrPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
		.setName('Number of colors')
		.setDesc('The maximum number of colors your rainbow folders cycle through before repeating.')
		.addText(text => text
			//.setLimits(0,50,1)
			//.setDynamicTooltip()
			.setPlaceholder("10")
			.setValue(this.plugin.settings.max)
			.onChange(async (value) => {
				let newNumber = parseInt(value)
				if (isNaN(newNumber)) {
					newNumber = 1
				}
				this.plugin.settings.max = newNumber.toString();
				this.plugin.applycolorinfo();
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('Attribute name')
		.setDesc('The name of the attribute that will be added to the element. May need a restart to see changes.')
		.addText(text => text
			.setPlaceholder("foldernumber")
			.setValue(this.plugin.settings.name)
			.onChange(async (value) => {
				this.plugin.settings.name = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('Apply recursively')
		.setDesc('Toggle on to also apply the new attribute to subfolders.')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.recursive)
			.onChange(async (value) => {
				this.plugin.settings.recursive = value;
				this.plugin.applycolorinfo();
				await this.plugin.saveSettings();
			}));
	}
}