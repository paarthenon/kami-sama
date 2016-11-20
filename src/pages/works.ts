import * as $ from 'jquery'
import * as pathUtils from 'src/utils/path'
import * as jQUtils from 'src/utils/document'
import {PixivAssistantServer} from 'src/services'
import {RegisteredAction, ExecuteIfSetting} from 'src/utils/actionDecorators'
import {GalleryPage} from 'src/pages/gallery'
import SettingKeys from 'src/settingKeys'
import {Model} from 'common/proto'

import {injectUserRelationshipButton} from 'src/injectors/openFolderInjector'
import {injectOpenInTabs} from 'src/injectors/openInTabs'
import {Container as Deps} from 'src/deps'

import {prefix} from 'src/utils/log'
let console = prefix('Works Page');

export class WorksPage extends GalleryPage {
	public get artistId():number {
		return pathUtils.getArtistId(this.path);
	}
	public get artistName():string {
		return $('h1.user').text();
	}
	public get artist():Model.Artist {
		return { id: this.artistId, name: this.artistName };
	}
	public get allImages():JQuery[] {
		return $('li.image-item').toArray().map(x => $(x));
	}

	protected getTagElements() {
		return [
			'span.tag-badge',
			'div.user-tags li a'
		].map(tag => $(tag)).concat(super.getTagElements());
	}

	protected executeOnEachImage<T>(func:(image:JQuery) => T) {
		$('li.image-item').toArray().forEach(image => func($(image)));
	}

	@ExecuteIfSetting(SettingKeys.global.inject.openToArtistButton)
	public injectOpenFolder(){
		injectUserRelationshipButton(this.artist);
	}
	@ExecuteIfSetting(SettingKeys.pages.works.inject.openInTabs)
	public injectOpenTabs(){
		injectOpenInTabs(this.openTabs.bind(this));
	}
	@ExecuteIfSetting(SettingKeys.global.inject.pagingButtons)
	public injectPagingButtons(){
		super.injectPagingButtons();
	}

	@ExecuteIfSetting(SettingKeys.global.fadeDownloadedImages)
	public experimentalFade() {
		let imageMap = this.allImages.reduce((acc: { [id:string] : JQuery }, cur:JQuery) => {
			let imageId = pathUtils.getImageId(cur.find('a.work').attr('href'));
			acc[imageId.toString()] = cur;
			return acc;
		}, <{ [id: string]: JQuery }> {});

		let request = Object.keys(imageMap)
						.map(id => ({ artist: this.artist, image: { id: parseInt(id) } }));

		PixivAssistantServer.bulkImageExists(request)
			.then(matchedImages => matchedImages
				.map(match => match.image.id.toString())
				.forEach(matchId => imageMap[matchId].addClass('pa-hidden-thumbnail')));
	}

	@RegisteredAction({ id: 'pa_button_open_in_tabs', label: 'Open in Tabs', icon: 'new-window' })
	public openTabs():void {
		console.trace('Opening images in tabs');
		Deps.getSetting(SettingKeys.pages.works.openTabsImagesOnly).then(imagesOnly => {
			if(imagesOnly) {
				console.log('opening images only.')
				/*
				For each image
					- if a manga or ugoira page, return the viewing url directly
					- if an illustration page, return the original image url
						- use the API to get illustration details to find file path
						- use string manipulation to get the original-size image path from the thumbnail
						- use string manipulation to attach the proper extension (thumbnails are always jpg)
				Once each url is loaded, open them all in new tabs.
					- Use a hacked navigate instead of chrome's tabs.create because pixiv needs referer information
					  to access direct images or it gives 403 Forbidden.
				*/
				Promise.all<string>($('li.image-item a.work').toArray().map((imgEntry:HTMLAnchorElement) => {
					if (imgEntry.classList.contains('multiple') || imgEntry.classList.contains('ugoku-illust')) {
						return Promise.resolve(imgEntry.href);
					} else {
						let url = $(imgEntry).find('img').attr('src');
						let illustId = pathUtils.getImageIdFromSourceUrl(url);
						return Deps.execOnPixiv(
							(pixiv, props) => pixiv.api.illust.detail([props.illustId], {}),
							{
								illustId
							}
						).then((response:any) => {
							let extension = response.body[illustId].illust_ext;
							let extensionWithDot = (extension.charAt(0) === '.') ? extension : `.${extension}`;
							let newSrc = pathUtils.experimentalMaxSizeImageUrl(url).replace(/\.(\w+)$/, extensionWithDot);

							return newSrc;
						});
					}
					
				})).then(newUrls => newUrls.forEach(url => jQUtils.hackedNewTab($, url)));
			} else {
				$('li.image-item a.work').toArray().forEach((image:HTMLAnchorElement) => Deps.openInTab(image.href));
			}
		});
	}

	@RegisteredAction({id: 'pa_button_open_folder', label: 'Open Folder', icon: 'folder-open'})
	public openFolder():void {
		PixivAssistantServer.openFolder(this.artist);
	}

	@ExecuteIfSetting(SettingKeys.global.directToManga)
	public replaceMangaThumbnailLinksToFull(){
		super.replaceMangaThumbnailLinksToFull();
	}

}
