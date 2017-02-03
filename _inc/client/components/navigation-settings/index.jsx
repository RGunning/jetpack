/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';
import { translate as __ } from 'i18n-calypso';
import trim from 'lodash/trim';
import analytics from 'lib/analytics';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

/**
 * Internal dependencies
 */
import {
	filterSearch,
	focusSearch,
	getSearchFocus as _getSearchFocus
} from 'state/search';
import {
	userCanManageModules as _userCanManageModules,
	userIsSubscriber as _userIsSubscriber
} from 'state/initial-state';

export const NavigationSettings = React.createClass( {
	openSearch: function() {
		let currentHash = window.location.hash;
		if ( currentHash.indexOf( 'search' ) === -1 ) {
			window.location.hash = 'search';
		}
		this.props.onSearchFocus( true );
	},

	onSearch( term ) {
		if ( term.length >= 3 ) {
			analytics.tracks.recordEvent( 'jetpack_wpa_search_term', { term: term.toLowerCase() } );
		}

		this.props.searchForTerm( trim( term || '' ).toLowerCase() );

		if ( 0 === term.length ) {

			// Calling close handler to show what was previously shown to the user
			this.onClose();
		} else {

			// Calling open handler in case the search was previously closed due to zero
			// length search term
			this.openSearch();
		}
	},

	onClose: function() {
		let currentHash = window.location.hash;
		if ( currentHash.indexOf( 'search' ) > -1 ) {
			this.context.router.goBack();
		}
	},

	onBlur: function() {
		this.props.onSearchFocus( false );

		// If the user has navigated back a page, we discard the search term
		// on blur
		if ( currentHash.indexOf( 'search' ) === -1 ) {
			this.props.searchForTerm( false );
		}
	},

	maybeShowSearch: function() {
		if ( this.props.userCanManageModules ) {
			return (
				<Search
					pinned={ true }
					placeholder={ __( 'Search for a Jetpack feature.' ) }
					delaySearch={ true }
					delayTimeout={ 500 }
					onSearchOpen={ this.openSearch }
					onSearch={ this.onSearch }
					onSearchClose={ this.onClose }
					onBlur={ this.onBlur }
					isOpen={
						'/search' === this.props.route.path
						|| this.props.searchHasFocus
					}
				/>
			);
		}
	},

	render: function() {
		let navItems;

		if ( this.props.userCanManageModules ) {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#general"
						selected={ ( this.props.route.path === '/general' || this.props.route.path === '/settings' ) }>
						{ __( 'General', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#writing"
						selected={ this.props.route.path === '/writing' }>
						{ __( 'Writing', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#discussion"
						selected={ this.props.route.path === '/discussion' }>
						{ __( 'Discussion', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#traffic"
						selected={ this.props.route.path === '/traffic' }>
						{ __( 'Traffic', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#security"
						selected={ this.props.route.path === '/security' }>
						{ __( 'Security', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		} else if ( this.props.isSubscriber ) {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#general"
						selected={ ( this.props.route.path === '/general' || this.props.route.path === '/settings' ) }>
						{ __( 'General', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		} else {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#general"
						selected={ ( this.props.route.path === '/general' || this.props.route.path === '/settings' ) }>
						{ __( 'General', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#writing"
						selected={ this.props.route.path === '/writing' }>
						{ __( 'Writing', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		}

		return (
			<div className='dops-navigation'>
				<SectionNav selectedText={ this.props.route.name }>
					{ navItems }
					{ this.maybeShowSearch() }
				</SectionNav>
			</div>
		)
	}
} );

NavigationSettings.contextTypes = {
	router: React.PropTypes.object.isRequired
};

export default connect(
	( state ) => {
		return {
			userCanManageModules: _userCanManageModules( state ),
			isSubscriber: _userIsSubscriber( state ),
			searchHasFocus: _getSearchFocus( state )
		};
	},
	( dispatch ) => {
		return {
			searchForTerm: ( term ) => dispatch( filterSearch( term ) ),
			onSearchFocus: ( hasFocus ) => dispatch( focusSearch( hasFocus ) )
		}
	}
)( NavigationSettings );
