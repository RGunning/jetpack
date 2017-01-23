/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getModule } from 'state/modules';
import { getSettings } from 'state/settings';
import { isDevMode, isUnavailableInDevMode } from 'state/connection';
import { isModuleFound as _isModuleFound } from 'state/search';
import QuerySite from 'components/data/query-site';
import { BackupsScan } from './backups-scan';
import { Antispam } from './antispam';
import { Protect } from './protect';
import { SSO } from './sso';

export const Security = React.createClass( {
	displayName: 'SecuritySettings',

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode
		};

		if (
			! this.props.searchTerm
			&& ! this.props.active
			&& ! this.props.isModuleFound( 'protect' )
			&& ! this.props.isModuleFound( 'sso' )
		) {
			return <span />;
		}

		let backupSettings = (
			<BackupsScan
				{ ...commonProps }
			/>
		);
		let akismetSettings = (
			<Antispam
				{ ...commonProps }
			/>
		);
		let protectSettings = (
			<Protect
				{ ...commonProps }
			/>
		);
		let ssoSettings = (
			<SSO
				{ ...commonProps }
			/>
		);
		return (
			<div>
				<QuerySite />
				{ this.props.isModuleFound( 'vaultpress' ) && backupSettings }
				{ this.props.isModuleFound( 'akismet' ) && akismetSettings }
				{ this.props.isModuleFound( 'protect' ) && protectSettings }
				{ this.props.isModuleFound( 'sso' ) && ssoSettings }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			module: module_name => getModule( state, module_name ),
			settings: getSettings( state ),
			isDevMode: isDevMode( state ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
		}
	}
)( Security );
