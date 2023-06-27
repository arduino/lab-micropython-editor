// Copyright 2022 Arduino SA
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const isCI = require('is-ci');
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
		if (!isCI) {
			if (
				typeof process.env.MACOS_FORCE_NOTARIZE === 'string' &&
				/true/i.test(process.env.MACOS_FORCE_NOTARIZE)
			  ) {
				// Hack for manual M1 signing. Set the MACOS_FORCE_NOTARIZE env variable to true, to force notarization when not on a CI. The 'true' is case insensitive.
				console.log(
				  `Detected the 'MACOS_FORCE_NOTARIZE' environment variable with '${process.env.MACOS_FORCE_NOTARIZE}' value. Forcing the app notarization, although not on a CI.`
				);
			  } else {
				console.log('Skipping notarization: not on CI.');
				return;
			  }
		}
		if (process.env.IS_FORK === 'true') {
				console.log('Skipping the app notarization: building from a fork.');
				return;
		}
		const { electronPlatformName, appOutDir } = context;
		if (electronPlatformName !== 'darwin') {
				return;
		}

		const appName = context.packager.appInfo.productFilename;
		const appBundleId = context.packager.config.appId;
		console.log(`>>> Notarizing ${appBundleId} at ${appOutDir}/${appName}.app...`);

		return await notarize({
				tool: 'notarytool',
				appBundleId,
				appPath: `${appOutDir}/${appName}.app`,
				appleId: process.env.AC_USERNAME,
				appleIdPassword: process.env.AC_PASSWORD,
				teamId: process.env.AC_TEAM_ID,
		});
};
