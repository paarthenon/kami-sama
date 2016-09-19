import * as pathUtils from '../utils/path'
import {PixivAssistantServer} from '../services'
import {RootPage} from './root'
import {RegisteredAction, ExecuteOnLoad, ExecuteIfSetting} from '../utils/actionDecorators'
import {GalleryPage} from './gallery'
import {DictionaryService} from '../services'
import {Container as Deps} from '../deps'
import {injectPagingButtons} from '../injectors/pagingButtonInjector'
import SettingKeys from '../settingKeys'

import * as jQUtils from '../utils/document'

export class SearchPage extends GalleryPage {

	protected executeOnEachImage<T>(func: (image: JQuery) => T) {
		this.jQuery('li.image-item').toArray().forEach(image => func(this.jQuery(image)));
	}

	@ExecuteOnLoad
	public experimentalFade() {
		this.executeOnEachImage(image => {
			Deps.getSetting(SettingKeys.pages.search.fadeDownloaded).then(fade => {
				if(fade) {
					let artist = jQUtils.artistFromJQImage(image);
					let imageObj = jQUtils.imageFromJQImage(image);
					PixivAssistantServer.imageExistsInDatabase(artist, imageObj).then(exists => {
						if (exists) {
							image.addClass('pa-hidden-thumbnail');
						}
					})
				}
			});

			Deps.getSetting(SettingKeys.pages.search.fadeBookmarked).then(fade => {
				if (fade) {
					let url = jQUtils.artistUrlFromJQImage(image);
					Deps.isPageBookmarked(url).then(bookmarked => {
						if (bookmarked) {
							image.addClass('pa-hidden-thumbnail');
						}
					})
				}
			})
		});
	}

	@ExecuteOnLoad
	public injectPagingButtons(){
		super.injectPagingButtons();
	}

	protected getTagElements() {
		return [
			'nav.breadcrumb > span > a > span',
			'a.self',
			'dl.column-related ul.tags li.tag a.text'
		].map(tag => this.jQuery(tag)).concat(super.getTagElements());
	}

	public changeTitle(): void {
		let titleMatch = document.title.match(/「(.*)」/);
		if(titleMatch && titleMatch[1]){
			DictionaryService.getTranslation(titleMatch[1])
				.then(translatedText => {
					if(translatedText) {
						let newTitle = document.title.replace(/「(.*)」/, `「${translatedText}」`);
						// If I set the title directly pixiv will eventually try to set the title
						// again, reverting my changes. This sets the field that pixiv's own functions
						// use. They'll do my work for me.
						Deps.execOnPixiv((pixiv, props) => pixiv.title.original = props.title, {title: newTitle});
						document.title = newTitle;
					}
				});
		}
	}

	public translateTagsOnPage(): void {
		this.changeTitle();
		super.translateTagsOnPage();
	}

	@RegisteredAction({ id: 'pa_button_go_to_last_page', label: 'Go To Last Page', icon: 'fast-forward' })
	public goToLastPage() {
		window.location.href = this.lastPageUrl;
	}

	@ExecuteIfSetting(SettingKeys.pages.search.directToManga)
	public replaceMangaThumbnailLinksToFull(){
		super.replaceMangaThumbnailLinksToFull();
	}
}
