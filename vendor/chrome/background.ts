import * as Msg from './messages'
import * as ChromeUtils from './utils'
import * as log4js from 'log4js';

import {AjaxRequest} from '../../src/core/IAjax'
import ConfigKeys from '../../src/configKeys'
import {default as Mailman, defineImplementation} from './mailman'

let logger = log4js.getLogger('Background');

defineImplementation<Msg.Protocol>("BACKGROUND_PAGE", {
	getConfig: msg => {
		return ChromeUtils.getFromConfig(msg.key)
			.then(contents => {
				if (msg.key in contents) {
					return contents[msg.key];
				} else {
					return Promise.reject(`Key [${msg.key}] not found in data store`);
				}
			})
			.then(contents => ChromeUtils.handleError(contents))
			.then<Msg.ConfigGetResponse>(value => ({ value }));
	},
	setConfig: msg => {
		return ChromeUtils.setConfig(msg.key, msg.value)
			.then(ChromeUtils.handleError)
	},
	listConfig: () => {
		return ChromeUtils.listConfigKeys()
			.then(ChromeUtils.handleError)
	},
	ajax: req => {
		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			xhr.open(req.type, req.url, true);
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.send(JSON.stringify(req.data));
			xhr.onreadystatechange = () => {
				if (xhr.readyState == XMLHttpRequest.DONE) {
					resolve(xhr.response);
				}
			}
		});
	},
	newTab: msg => {
		return ChromeUtils.newTab(msg.url);
	},
	isPageBookmarked: msg => {
		return ChromeUtils.isPageBookmarked(msg.url);
	}
});

function firstTimeSetup(){
	Mailman.Background.getConfig({key: ConfigKeys.user_dict})
		.catch(() => Mailman.Background.setConfig({key: ConfigKeys.user_dict, value: {}}));
}

firstTimeSetup();