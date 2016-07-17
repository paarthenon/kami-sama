import * as React from 'react'
import * as log4js from 'log4js'

let logger = log4js.getLogger('Button');

export class PageButton extends React.Component<{text:string, tooltip:string, rel:string, clickAction:Function},any> {
	public render() {
		return (
			<a onClick={this.props.clickAction} rel={this.props.rel} className="_button" title={this.props.tooltip}>
				{this.props.text}
			</a>
			);
	}
}