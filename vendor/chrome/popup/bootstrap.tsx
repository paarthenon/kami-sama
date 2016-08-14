import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as log4js from 'log4js'

import Config from '../config'
import {MainPanel} from './mainPanel'
import {Tabs} from './tabs'
import {DictViewer} from './dict'
import {ReadOnlyDictViewer} from './readOnlyDict'
import {ActionPanel} from './actionPanel'
import {SettingsPanel} from './settingsPanel'
import {ConfigPanel} from './configPanel'
import {ServerStatusPanel} from './serverStatusPanel'

import configKeys from '../../../src/configKeys'
import {CachedDictionaryService, naiveDictionary, cachedDictionary} from '../../../src/core/cachedDictService'

let logger = log4js.getLogger('Bootstrap');

let official_dict :any = {};

let cachedDict = new CachedDictionaryService(new Config(), {
	global: configKeys.official_dict,
	local: configKeys.user_dict,
	cache: configKeys.cached_dict
});

class DictContainer extends React.Component<{dictKey:string},cachedDictionary> {
	constructor(props:{dictKey:string}) {
		super(props);
		this.state = { cache: [] };
		this.updateDict();
	}
	updateDict() :void {
		cachedDict.cache
			.then(cachedDict => this.setState(cachedDict))
			.catch(error => logger.error(error));
	}

	handleUpdate(key:string, value:string) :void {
		cachedDict.update(key, value).then(() => this.updateDict());
	}
	handleDelete(key:string) {
		cachedDict.delete(key).then(() => this.updateDict());
	}
	public render() {
		return <DictViewer
			cachedDict={this.state}
			onAdd={this.handleUpdate.bind(this)}
			onUpdate={this.handleUpdate.bind(this)}
			onDelete={this.handleDelete.bind(this)}
			/>
	}
}

import Mailman from '../mailman'
Mailman.Background.getConfig({ key: configKeys.official_dict })
	.then(dict => { official_dict = dict.value; render(); });

function render() {
	let tabInfo: { [id: string]: JSX.Element } = {
		Actions: <ActionPanel />,
		Dictionary: <DictContainer dictKey={configKeys.user_dict} />,
		"Global Dictionary": <ReadOnlyDictViewer dict={official_dict}/>,
		Settings: <SettingsPanel />,
		Config: <ConfigPanel />,
		ServerStatus: <ServerStatusPanel />
	}

	ReactDOM.render(<Tabs tabs={tabInfo} initialTab="Dictionary" />, document.getElementById('content'));
}

render();

